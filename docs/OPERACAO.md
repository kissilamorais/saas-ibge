# Operação

Procedimentos de manutenção do Aprovus em produção.

---

## Backup do banco

### O que é

[`scripts/backup.sh`](../scripts/backup.sh) roda `pg_dump` contra o banco de
produção e grava um `.sql.gz` com timestamp em `backups/`.

Isso **não substitui** os backups do próprio Supabase — complementa. Os backups
gerenciados vivem na mesma conta que o banco: servem para corrupção e erro
humano, não para perda de acesso à conta. O dump local é a cópia que sobrevive
a isso.

### Pré-requisitos

**1. Cliente `pg_dump` 15+.** O Supabase roda Postgres 15 ou mais novo; um
cliente mais antigo aborta com `server version mismatch`.

```bash
brew install libpq && brew link --force libpq
pg_dump --version   # precisa ser >= 15
```

**2. Credencial de banco.** A `SUPABASE_SERVICE_ROLE_KEY` **não serve** — ela é
um JWT das APIs HTTP (PostgREST/GoTrue), e o `pg_dump` fala o protocolo
Postgres. É preciso a senha do banco, que é outro segredo.

Escolha um dos dois no `.env.local`:

```bash
# Recomendado: string completa do Dashboard > Connect > Session pooler
DATABASE_URL=postgresql://postgres.<ref>:<senha>@aws-0-<região>.pooler.supabase.com:5432/postgres

# Ou só a senha (o host é derivado de NEXT_PUBLIC_SUPABASE_URL)
SUPABASE_DB_PASSWORD=...   # Dashboard > Settings > Database > Database password
```

Prefira `DATABASE_URL` com o **Session pooler**: o host direto
(`db.<ref>.supabase.co`) é IPv6-only em projetos novos e falha com
`network unreachable` em rede sem IPv6. Use a porta **5432** (session), não a
6543 (transaction) — o modo transaction não suporta `pg_dump`.

### Como rodar

```bash
./scripts/backup.sh                      # grava em backups/
./scripts/backup.sh /Volumes/EXTERNO     # grava em outro destino
BACKUP_SCHEMAS=public ./scripts/backup.sh  # só o schema public
```

Saída: `backups/aprovus-prod-20260802-153045.sql.gz`

Por padrão dumpa `public` **e** `auth`. O `auth` guarda as contas de usuário —
sem ele o restore sobe os dados mas ninguém consegue entrar.

O script escreve num `.partial` e só renomeia no final, então um dump
interrompido nunca fica parecendo um backup válido. Ele também testa a
integridade do gzip antes de aceitar o arquivo.

### Com que frequência

| Situação | Frequência |
|---|---|
| Campanha ativa / lançamento (compras entrando) | **Diária** |
| Regime normal | **Semanal** |
| Antes de aplicar migration que apaga ou altera coluna | **Sempre** |

O critério é quanto dado de compra você aceita perder. Progresso de estudo se
refaz; registro de pagamento, não — é o que prova que alguém comprou.

Há um segundo motivo para não espaçar demais: as rotinas de retenção da
[migration 0019](../migrations/0019_data_retention.sql) **apagam dados todo dia
às 03:00 UTC** (leads com 24 meses, pedidos pendentes com 90 dias, checkouts
abandonados com 6 meses). Um backup só preserva o que existia quando rodou.

### Onde os backups ficam

`backups/` está no `.gitignore`, junto com `*.sql.gz` e `*.dump`. **Um dump
commitado é vazamento da base inteira** — contém e-mails, hashes de senha e
todo o PII dos usuários. Trate o arquivo como o segredo mais sensível do
projeto: disco criptografado, nada de anexar em chat ou subir em drive
compartilhado sem criptografia.

Isso também vale para a LGPD: um usuário que pediu exclusão continua presente
nos dumps antigos. Descarte backups vencidos em vez de acumular
indefinidamente.

### Restore

```bash
gunzip -c backups/aprovus-prod-20260802-153045.sql.gz | psql "$DATABASE_URL_DESTINO"
```

O dump usa `--clean --if-exists`, então ele **derruba os objetos existentes**
antes de recriar. Nunca aponte um restore para produção sem ter certeza
absoluta do destino.

> **Um backup que você nunca restaurou não é um backup — é um arquivo.**
> Pelo menos uma vez, restaure num projeto Supabase descartável e confirme que
> dá para logar e que os dados de compra estão lá. Só isso prova que a cadeia
> inteira funciona.

---

## Aplicar migrations

As migrations vivem em [`migrations/`](../migrations/) e são aplicadas à mão no
SQL Editor do Supabase, em ordem numérica. Não há runner automático.

Depois de aplicar qualquer migration de segurança (RLS, policy, grants),
**confirme por teste funcional** — "rodei o SQL" não prova que a policy está
ativa:

```bash
node scripts/test-rls.mjs
```

Para a 0019 especificamente, a verificação está no rodapé do próprio arquivo
(`select ... from cron.job`).
