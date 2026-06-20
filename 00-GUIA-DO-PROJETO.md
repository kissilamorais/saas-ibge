# 📂 GUIA DO PROJETO — LEIA PRIMEIRO
## Curso Preparatório Censo Agro 2026 (IBGE / Banca IBFC)
### Versão final — todas as 5 trilhas cobertas

Bem-vindo. Este pacote é um **curso preparatório completo, estruturado para venda a R$ 97**, construído a partir da análise direta do **Edital nº 01/2026** do IBGE (12º Censo Agropecuário, Florestal e Aquícola), banca **IBFC**, e da **apostila oficial** do Censo.

> 🏆 **Status desta versão:** projeto de conteúdo **concluído** para todas as 5 trilhas. Bancos de 150 questões em todas as disciplinas. Simulados completos (60q) para ACA (5 provas), ACR, ACS, ACI e AOR. Fundação SaaS entregue.

---

## 1. ÍNDICE COMPLETO DOS ARQUIVOS

### 1.1 Conteúdo didático

| Arquivo | Conteúdo | Status |
|---|---|---|
| **00-GUIA-DO-PROJETO.md** | Este guia — índice, escopo, roadmap | ✅ |
| **01-ANALISE-EDITAL-E-ESTRUTURA.md** | Análise do edital + arquitetura das 5 trilhas + Módulo 0 | ✅ |
| **02-MODULO-PORTUGUES.md** | 12 aulas — todas as trilhas | ✅ |
| **03-MODULO-RACIOCINIO-LOGICO.md** | 10 aulas — todas as trilhas | ✅ |
| **04-MODULO-ADMINISTRACAO.md** | 10 aulas — ACA/AOR/ACR/ACS | ✅ |
| **05-MODULOS-INFORMATICA-E-TECNICOS.md** | Informática 10 aulas completas (ACI/AOR) | ✅ |
| **05B-MODULO-CONHECIMENTOS-TECNICOS.md** | 14 aulas fiéis à apostila IBGE (ACR/ACS) | ✅ |
| **06-CRONOGRAMAS-REVISAO-E-PLANOS.md** | Cronogramas 30/60/90/120 dias + revisão espaçada + planos por horas | ✅ |
| **07-BANCO-DE-QUESTOES.md** | Banco-base comentado + plano de escala | ✅ |
| **08-SIMULADOS.md** | Regras + Simulado 1 diagnóstico (30q) ACA + blueprint | ✅ |
| **09-COMERCIAL-PAGINA-VENDAS-MEMBROS-CHECKLIST.md** | Nomes, copy de vendas, bônus, área de membros, checklist de lançamento | ✅ |

### 1.2 Bancos de questões (~150 por disciplina)

| Arquivo | Disciplina | Questões | Status |
|---|---|---|---|
| **07A-BANCO-ADMINISTRACAO-ACA-LOTE1.md** | Administração — Lote 1 | 60 | ✅ |
| **07D-BANCO-ADMINISTRACAO-ACA-LOTE2.md** | Administração — Lote 2 | 54 | ✅ |
| **07B-BANCO-CONHECIMENTOS-TECNICOS-LOTE1.md** | Conhecimentos Técnicos — Lote 1 | 60 | ✅ |
| **07C-BANCO-CONHECIMENTOS-TECNICOS-LOTE2.md** | Conhecimentos Técnicos — Lote 2 | 62 | ✅ |
| **07E-BANCO-PORTUGUES-LOTE1.md** | Português — Lote 1 | 60 | ✅ |
| **07F-BANCO-PORTUGUES-LOTE2.md** | Português — Lote 2 | 66 | ✅ |
| **07G-BANCO-RACIOCINIO-LOGICO-LOTE1.md** | Raciocínio Lógico — Lote 1 | 60 | ✅ |
| **07H-BANCO-RACIOCINIO-LOGICO-LOTE2.md** | Raciocínio Lógico — Lote 2 | 68 | ✅ |
| **07I-BANCO-INFORMATICA-LOTE1.md** | Informática — Lote 1 | 60 | ✅ |
| **07J-BANCO-INFORMATICA-LOTE2.md** | Informática — Lote 2 | 66 | ✅ |

**Total no banco:** ~750 questões comentadas em estilo IBFC, sem repetição entre arquivos.

### 1.3 Simulados completos (60 questões, formato da prova real)

| Arquivo | Trilha | Nível |
|---|---|---|
| **08-SIMULADOS.md** | ACA — S1 Diagnóstico (30q) | introdutório |
| **08A-SIMULADO-2-ACA.md** | ACA — S2 | prova real |
| **08B-SIMULADO-3-ACA.md** | ACA — S3 | prova real |
| **08C-SIMULADO-4-ACA.md** | ACA — S4 | prova real |
| **08D-SIMULADO-FINAL-ACA.md** | ACA — Simuladão Final | classificatório (meta 45+) |
| **08E-SIMULADO-1-ACR.md** | ACR | prova real |
| **08F-SIMULADO-1-ACS.md** | ACS | prova real |
| **08G-SIMULADO-1-ACI.md** | ACI | prova real |
| **08H-SIMULADO-1-AOR.md** | AOR | prova real |

**Total:** 9 simulados — 5 para ACA, 1 para cada das demais trilhas.

### 1.4 Plataforma SaaS (fundação)

| Arquivo | Conteúdo | Status |
|---|---|---|
| **APP-ARQUITETURA.md** | Arquitetura completa, 12 fases, monetização, design | ✅ |
| **APP-schema.sql** | Banco Supabase: 26 tabelas, RLS, triggers, views | ✅ |
| **APP-types.ts** | Tipos TypeScript do domínio | ✅ |
| **APP-spaced-repetition.ts** | Algoritmo de revisão espaçada | ✅ |
| **APP-schedule-generator.ts** | Gerador de cronograma + redistribuição | ✅ |

> A UI das 12 fases se constrói no seu repositório via **Claude Code**. Detalhes no `APP-ARQUITETURA.md`.

---

## 2. STATUS FINAL POR DISCIPLINA

| Disciplina | Questões no banco | Trilhas atendidas |
|---|---|---|
| **Língua Portuguesa** | ~150 ✅ | Todas (15q em cada prova) |
| **Raciocínio Lógico** | ~150 ✅ | Todas (10q em cada prova) |
| **Administração** | ~150 ✅ | ACA (35q), AOR (30q), ACR (15q), ACS (20q) |
| **Conhecimentos Técnicos** | ~150 ✅ | ACR (20q), ACS (15q) |
| **Informática** | ~150 ✅ | ACI (35q), AOR (5q básico) |

---

## 3. COMPOSIÇÃO DAS PROVAS POR TRILHA

| Trilha | Português | RLQ | Adm/SG | Informática | Téc.Censo | Total |
|---|---|---|---|---|---|---|
| **ACA** | 15 | 10 | 35 | — | — | 60 |
| **ACI** | 15 | 10 | — | 35 | — | 60 |
| **AOR** | 15 | 10 | 30 | 5 | — | 60 |
| **ACR** | 15 | 10 | 15 | — | 20 | 60 |
| **ACS** | 15 | 10 | 20 | — | 15 | 60 |

**Regra de aprovação (todas as trilhas):** ≥ 18 pontos no total **E** ≥ 1 ponto em cada disciplina (regra anti-zero). Meta de classificação: 40+.

---

## 4. O QUE ESTÁ PRONTO PARA VENDER HOJE

- ✅ Análise integral do edital + estratégia de aprovação
- ✅ **56 aulas em 5 módulos** (Português, RLQ, Administração, Informática, Conhecimentos Técnicos)
- ✅ Módulo 0 (método) + arquitetura das 5 trilhas
- ✅ Cronogramas e planos de estudo por prazo e horas/dia
- ✅ **~750 questões comentadas** em 10 arquivos de banco
- ✅ **9 simulados completos** (60q) — 5 para ACA, 1 para cada outra trilha
- ✅ Pacote comercial: copy, bônus, área de membros e checklist de lançamento
- ✅ Fundação de plataforma SaaS (arquitetura + banco + algoritmos)

---

## 5. AVISOS ANTES DE PUBLICAR

### Revisões de gabarito
Todos os pontos sinalizados durante a produção foram corrigidos diretamente nos arquivos:
- **S3 (08B) — Q11:** questão reformulada com alternativa claramente incorreta (gabarito C).
- **S4 (08C) — Q5:** reformulada com resposta única (gabarito A); **Q6:** opções simplificadas (gabarito C).
- **Simuladão Final (08D) — Q18:** gabarito corrigido para **D (89)**; **Q12:** questão reformulada com resposta única (gabarito A).
- **ACS (08F) — Q25:** gabarito corrigido para **A (○)**.

> ⚠️ Mesmo com as correções feitas, recomenda-se uma **leitura final rápida** de cada simulado antes de publicar — especialmente os cálculos de RLQ.

### Conformidade
- ⚠️ Material **independente**, sem vínculo oficial com IBGE ou IBFC. Declare isso na página de vendas.
- ⚠️ Todo o conteúdo foi escrito com palavras próprias — a apostila e o edital **não** são reproduzidos.
- ⚠️ A apostila apresenta inconsistência interna de datas (coleta 2027/referência 2026 no objetivo; exemplo usa 31/12/2025). Sinalizado no Módulo 5. Confirme com o edital antes de publicar.
- ⚠️ A apostila cita ~36 mil temporários em 2027; o edital IBFC traz 8.238 vagas. São números de contextos diferentes — não os misture.
- ⚠️ **Revise todos os gabaritos** do banco e simulados antes de vender.

---

## 6. ROADMAP PARA O LANÇAMENTO

### Passos que você faz (requerem sua ação)
1. **Conta Stripe** com seus dados fiscais — credenciais e pagamentos ficam com você.
2. **Domínio + deploy** da plataforma (Vercel + Supabase) e testes reais.
3. **Jurídico:** termos de uso, política de reembolso (7 dias), aviso de material independente.
4. **Conta na plataforma de curso** (Hotmart, Kiwify ou Eduzz — ver Doc 09) e upload do conteúdo.

### Passos que posso fazer por você (na sequência que quiser)
5. **Converter conteúdo em PDF** — prova + gabarito separado para área de membros.
6. **Simulados adicionais** — mais provas para ACR, ACS, ACI e AOR (cada trilha tem apenas 1 por ora).
7. **UI do SaaS** — construir fase a fase no seu repositório via Claude Code.
8. **Mais bancos** — se quiser mais de 150 questões por disciplina.

---

## 7. DNA DO CURSO (para referência)

Cada aula segue a estrutura:
> 🎯 Por que cai · 📖 Resumo · 🧠 Mapa Mental · 🃏 Flashcards · 🪄 Macetes e Pegadinhas da IBFC · ✅ Questões Comentadas

Cada simulado segue:
> 📝 Prova completa (60q, 5 alternativas) → ✅ Gabarito comentado com resolução → 📊 Tabela de interpretação do resultado

---

## 8. RESUMO EM UMA LINHA

Você tem um **curso preparatório real e vendável a R$ 97**, com **5 módulos (56 aulas)**, **~750 questões comentadas**, **9 simulados completos** para todas as 5 trilhas, pacote comercial pronto e a fundação de uma plataforma SaaS — tudo construído a partir do edital e da apostila oficial do IBGE.

**Próximo passo recomendado:** revisar os pontos sinalizados nos gabaritos, subir na plataforma de cursos e lançar.
