#!/usr/bin/env bash
#
# Dump do banco de produção (Supabase) para um arquivo local com timestamp.
#
# Uso:   ./scripts/backup.sh [diretório-destino]
#        BACKUP_SCHEMAS=public ./scripts/backup.sh      # só o schema public
#
# Conexão, na ordem de precedência:
#   1. $DATABASE_URL (ambiente)
#   2. DATABASE_URL no .env.local
#   3. NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD do .env.local
#
# NOTA: SUPABASE_SERVICE_ROLE_KEY não serve aqui. Ela é um JWT para as APIs
# HTTP (PostgREST/GoTrue); o pg_dump fala o protocolo Postgres e precisa da
# SENHA DO BANCO, que é outro segredo (Dashboard > Settings > Database).
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_DIR="${1:-$ROOT/backups}"
ENV_FILE="$ROOT/.env.local"

# Schemas dumpados. `auth` guarda as contas de usuário — sem ele o restore
# sobe os dados mas ninguém consegue entrar.
SCHEMAS="${BACKUP_SCHEMAS:-public,auth}"

die() { printf '\033[31merro:\033[0m %s\n' "$*" >&2; exit 1; }
info() { printf '\033[36m›\033[0m %s\n' "$*"; }
warn() { printf '\033[33maviso:\033[0m %s\n' "$*" >&2; }

# --- lê uma var do .env.local (mesmo formato que scripts/test-rls.mjs aceita)
read_env_var() {
  local key="$1" line val
  [ -f "$ENV_FILE" ] || return 0
  line="$(grep -E "^[[:space:]]*${key}[[:space:]]*=" "$ENV_FILE" | tail -n 1 || true)"
  [ -n "$line" ] || return 0
  val="${line#*=}"
  val="$(printf '%s' "$val" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  val="$(printf '%s' "$val" | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/")"
  printf '%s' "$val"
}

# --- resolve a connection string -------------------------------------------
resolve_db_url() {
  if [ -n "${DATABASE_URL:-}" ]; then
    info "conexão: \$DATABASE_URL (ambiente)" >&2
    printf '%s' "$DATABASE_URL"; return
  fi

  local from_file; from_file="$(read_env_var DATABASE_URL)"
  if [ -n "$from_file" ]; then
    info "conexão: DATABASE_URL do .env.local" >&2
    printf '%s' "$from_file"; return
  fi

  local supa_url db_pass ref
  supa_url="$(read_env_var NEXT_PUBLIC_SUPABASE_URL)"
  db_pass="$(read_env_var SUPABASE_DB_PASSWORD)"

  [ -n "$supa_url" ] || die "nem DATABASE_URL nem NEXT_PUBLIC_SUPABASE_URL encontrados (checou .env.local?)"
  [ -n "$db_pass" ] || die "SUPABASE_DB_PASSWORD ausente no .env.local.
  A service_role key NÃO funciona para pg_dump — é preciso a senha do banco.
  Pegue em: Supabase Dashboard > Settings > Database > Database password.
  Ou defina DATABASE_URL inteira (Dashboard > Connect > Session pooler)."

  # https://<ref>.supabase.co -> <ref>
  ref="$(printf '%s' "$supa_url" | sed -E 's#^https?://##; s#\..*$##')"
  [ -n "$ref" ] || die "não consegui extrair o project ref de NEXT_PUBLIC_SUPABASE_URL ($supa_url)"

  info "conexão: derivada de NEXT_PUBLIC_SUPABASE_URL (projeto $ref)" >&2
  warn "host direto db.$ref.supabase.co é IPv6-only em projetos novos.
  Se der 'network unreachable', use o Session pooler: copie a string em
  Dashboard > Connect e coloque em DATABASE_URL."
  printf 'postgresql://postgres:%s@db.%s.supabase.co:5432/postgres' "$db_pass" "$ref"
}

# --- preflight --------------------------------------------------------------
command -v pg_dump >/dev/null 2>&1 || die "pg_dump não encontrado. Instale: brew install libpq && brew link --force libpq"
command -v gzip >/dev/null 2>&1 || die "gzip não encontrado"

PG_DUMP_MAJOR="$(pg_dump --version | sed -E 's/.* ([0-9]+).*/\1/')"
if [ "$PG_DUMP_MAJOR" -lt 15 ] 2>/dev/null; then
  warn "pg_dump $PG_DUMP_MAJOR é mais antigo que o servidor (Supabase roda 15+).
  O dump vai falhar com 'server version mismatch'. Atualize o cliente."
fi

DB_URL="$(resolve_db_url)"

mkdir -p "$DEST_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$DEST_DIR/aprovus-prod-$STAMP.sql.gz"
TMP="$OUT.partial"

# Um dump interrompido não pode ficar parecendo um backup válido: escrevemos
# no .partial e só renomeamos no fim. O trap limpa o lixo se algo falhar.
cleanup() { [ -f "$TMP" ] && rm -f "$TMP"; }
trap cleanup EXIT

info "schemas: $SCHEMAS"
info "destino: $OUT"

# Monta os --schema (pg_dump quer um por schema).
SCHEMA_ARGS=()
IFS=',' read -ra _schemas <<< "$SCHEMAS"
for s in "${_schemas[@]}"; do
  s="$(printf '%s' "$s" | tr -d '[:space:]')"
  [ -n "$s" ] && SCHEMA_ARGS+=(--schema="$s")
done

# --no-owner/--no-privileges: os roles do Supabase não existem no destino de
# um restore local, e sem isso o psql cospe erro em cada objeto.
# Nada de `set -x` aqui: a URL tem a senha e não pode ir para o log.
if ! pg_dump "$DB_URL" \
  "${SCHEMA_ARGS[@]}" \
  --clean --if-exists \
  --quote-all-identifiers \
  --no-owner --no-privileges \
  2>"$TMP.err" | gzip -9 > "$TMP"; then
  sed -e 's/postgresql:\/\/[^ ]*/[conexão omitida]/g' "$TMP.err" >&2 || true
  rm -f "$TMP.err"
  die "pg_dump falhou (nenhum arquivo foi gravado)"
fi
rm -f "$TMP.err"

# gzip truncado passa despercebido até a hora do restore — testa agora.
gzip -t "$TMP" 2>/dev/null || die "o arquivo gerado está corrompido"

# Um dump vazio/só-cabeçalho também é um backup inútil.
LINES="$(gzip -dc "$TMP" | head -c 200000 | grep -c 'CREATE TABLE' || true)"
[ "${LINES:-0}" -gt 0 ] || warn "nenhum CREATE TABLE nos primeiros 200KB — confira o conteúdo"

mv "$TMP" "$OUT"
trap - EXIT

SIZE="$(du -h "$OUT" | cut -f1)"
printf '\033[32m✓\033[0m backup concluído: %s (%s)\n' "$OUT" "$SIZE"
printf '  restore: gunzip -c %s | psql "$DATABASE_URL_DESTINO"\n' "$(basename "$OUT")"
