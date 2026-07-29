-- ============================================================================
-- 0014 — Prova social: tabela de depoimentos curados manualmente pelo admin.
-- Cole no SQL Editor do Supabase e rode. Idempotente.
-- Pré-requisito: schema.sql + 0008 (private.is_admin()) já aplicados.
--
-- Depoimentos chegam via WhatsApp (prints), são validados e aprovados
-- manualmente pela Kissila — não há avaliação automática. Leitura pública é
-- só dos ativos; gestão (CRUD) é admin-only.
-- ============================================================================
begin;

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),

  -- Conteúdo
  author_name text not null,
  author_cargo text,
  content text not null,
  source text not null default 'whatsapp',

  -- Imagem do print (opcional, já com blur aplicado antes do upload)
  image_url text,

  -- Qual objeção este depoimento quebra
  objection_tag text,

  -- Controle
  is_active boolean not null default false,
  display_order integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'testimonials_source_check'
  ) then
    alter table public.testimonials
      add constraint testimonials_source_check
      check (source in ('whatsapp', 'email', 'platform'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'testimonials_objection_tag_check'
  ) then
    alter table public.testimonials
      add constraint testimonials_objection_tag_check
      check (
        objection_tag is null
        or objection_tag in ('quality', 'price', 'trust', 'time', 'specific', 'simulator')
      );
  end if;
end$$;

create index if not exists idx_testimonials_active_order
  on public.testimonials (display_order)
  where is_active = true;

alter table public.testimonials enable row level security;

drop policy if exists "testimonials_public_read" on public.testimonials;
create policy "testimonials_public_read"
  on public.testimonials for select
  using (is_active = true);

drop policy if exists "testimonials_admin_all" on public.testimonials;
create policy "testimonials_admin_all"
  on public.testimonials for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ===========================================================================
-- Seed placeholder — 6 depoimentos inativos (is_active = false). A Kissila
-- edita com os depoimentos reais no painel /admin/testimonials antes de
-- ativar. Textos placeholder, um por objeção principal (qualidade, preço,
-- confiança, tempo, específico do IBGE, simulado).
-- ===========================================================================
insert into public.testimonials (author_name, author_cargo, content, source, objection_tag, display_order, is_active)
select * from (values
  ('Ana', 'ACA', 'As questões são muito boas, cada alternativa explicada. Você entende por que errou, não só qual é a certa.', 'whatsapp', 'quality', 1, false),
  ('Carlos', 'ACI', 'É bem focado no IBGE mesmo, diferente daqueles materiais genéricos. O edital esquematizado me mostrou o que mais cai.', 'whatsapp', 'specific', 2, false),
  ('Mariana', 'AOR', 'Pagaria mais que isso tranquilo. R$67 uma vez é nada perto do que você ganha se passar.', 'whatsapp', 'price', 3, false),
  ('João', 'ACR', 'O simulado corrige na hora e mostra exatamente onde errei por matéria. Mudei meu foco de estudo por causa disso.', 'whatsapp', 'simulator', 4, false),
  ('Fernanda', 'ACS', 'Comecei faltando menos de 30 dias e valeu muito. O cronograma já te diz o que fazer cada semana.', 'whatsapp', 'time', 5, false),
  ('Lucas', 'ACA', 'Eu também não conhecia. A garantia de 7 dias me deu segurança. Testei e não precisei pedir o dinheiro de volta.', 'whatsapp', 'trust', 6, false)
) as seed(author_name, author_cargo, content, source, objection_tag, display_order, is_active)
where not exists (select 1 from public.testimonials);

commit;

-- ====================== VERIFICAÇÃO (opcional) =============================
select 'testimonials' as check, count(*) from information_schema.tables
  where table_schema='public' and table_name='testimonials'; -- 1
select 'testimonials seeded' as check, count(*) from public.testimonials; -- >=6
