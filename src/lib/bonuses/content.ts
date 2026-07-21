/**
 * Conteúdo dos bônus entregues na própria página (delivery: 'page').
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  ONDE COLAR O CONTEÚDO                                                      │
 * │                                                                            │
 * │  Cada chave abaixo é o slug de um bônus. Troque o `null` pela string       │
 * │  markdown do conteúdo. Enquanto estiver `null`, a página mostra o estado   │
 * │  "conteúdo em preparação" automaticamente — nada mais a fazer.             │
 * │                                                                            │
 * │  É markdown com GitHub Flavored (tabelas, listas, títulos ##, **negrito**),│
 * │  renderizado pelo <BonusMarkdown>. Dica: use template string (crase) para  │
 * │  colar texto de várias linhas.                                             │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
export const BONUS_CONTENT: Record<string, string | null> = {
  // ►►► CRONOGRAMA DE ESTUDOS — conteúdo preenchido. ◄◄◄
  cronograma: `# 📅 Cronograma de Estudos Aprovus — Concurso IBGE 2026

**Prova: 27 de setembro de 2026 · Banca IBFC · 60 questões · 4 horas**

> Este cronograma foi montado com base na distribuição oficial de questões do Edital 01/2026. A lógica é simples: você estuda **na proporção do que cai na prova**. Não adianta gastar 40% do tempo numa matéria que vale 16% da nota.

---

## ⚠️ Antes de começar — leia isto

A prova do IBGE tem uma regra que elimina muita gente: você precisa de **no mínimo 18 pontos no total E pelo menos 1 acerto em cada disciplina**. Ou seja: **não dá pra abandonar nenhuma matéria.** Zerou Raciocínio Lógico? Eliminado, mesmo com nota alta no resto.

Por isso este cronograma **nunca deixa uma matéria de lado por mais de uma semana.** Rotação constante, revisão semanal, e foco proporcional ao peso de cada disciplina no seu cargo.

**Escolha seu cargo e siga a trilha correspondente. O peso muda:**

| Cargo | Português | R. Lógico | Específico |
|---|---|---|---|
| **ACA** (Administrativo) | 15 | 10 | Administração (35) |
| **ACI** (Informática) | 15 | 10 | Informática (35) |
| **AOR** (Operacional Regional) | 15 | 10 | Adm/Gerencial (30) + Informática (5) |
| **ACR / ACS** (Regional/Supervisor) | 15 | 10 | Adm/Gerencial (15-20) + Conhec. Técnicos (15-20) |

---

## 🎯 A estratégia em 3 fases

**Fase 1 — FUNDAÇÃO (Semanas 1-4):** aprender a teoria de cada bloco. Você constrói a base.

**Fase 2 — QUESTÕES (Semanas 5-8):** resolver muita questão da banca IBFC. É aqui que o aprendizado gruda. A banca repete padrões — quem resolve muito, reconhece.

**Fase 3 — SIMULADOS + REVISÃO (Semanas 9-10):** treinar prova completa cronometrada e revisar os erros. Ajuste fino.

---

## 📆 O CRONOGRAMA SEMANA A SEMANA

### 🟢 SEMANA 1 — Português (base) + Raciocínio Lógico (base)
Comece pelas duas matérias comuns a todos os cargos — elas valem 25 das 60 questões juntas.
- **Português:** Interpretação de texto + Ortografia e acentuação
- **Raciocínio Lógico:** Estruturas lógicas + Lógica de argumentação
- **Meta:** 1 a 2 módulos de cada na plataforma + 20 questões
- 💡 *Dica: interpretação de texto é a maior fatia de Português. Domine isso e você garante pontos fáceis.*

### 🟢 SEMANA 2 — Específica do seu cargo (base) + Português
Entre forte na matéria que mais pesa pro seu cargo.
- **Específica:** primeiro bloco de teoria (Administração / Informática / Conhecimentos Técnicos, conforme seu cargo)
- **Português:** Classes de palavras + Concordância e regência
- **Meta:** 2 módulos da específica + 1 de Português + 30 questões

### 🟢 SEMANA 3 — Específica (aprofundamento) + Raciocínio Lógico
- **Específica:** segundo bloco de teoria
- **Raciocínio Lógico:** Diagramas lógicos + Aritmética
- **Meta:** 2 módulos da específica + 1 de RLQ + 30 questões
- 🔓 *Nesta semana você já desbloqueou o EDITAL ESQUEMATIZADO (dia 7). Use ele pra ver o mapa do que mais cai.*

### 🟢 SEMANA 4 — Fechamento da teoria específica + Revisão geral
- **Específica:** terceiro bloco (fecha a base teórica)
- **Revisão:** revise os erros das semanas 1-3 (a plataforma marca o que você errou)
- **Meta:** fechar teoria + 40 questões mistas
- 🎯 *Fim da Fase 1. Você tem a base. Agora é volume de questões.*

### 🟡 SEMANA 5 — QUESTÕES: Português + Específica
A partir daqui, o foco vira resolver questões da banca IBFC.
- **Foco:** 50+ questões (Português + sua específica)
- Anote os padrões de erro. A IBFC repete o jeito de cobrar.

### 🟡 SEMANA 6 — QUESTÕES: Raciocínio Lógico + Específica
- **Foco:** 50+ questões (RLQ + específica)
- **RLQ é a matéria que mais assusta** — mas é a mais treinável. Repetição resolve.

### 🟡 SEMANA 7 — QUESTÕES: rodízio completo + pontos fracos
- Resolva questões de TODAS as disciplinas
- Dobre o tempo na matéria onde você mais erra
- **Meta:** 60+ questões + primeiro simulado curto

### 🟡 SEMANA 8 — QUESTÕES avançadas + primeiro simulado completo
- Faça **1 simulado completo** (60 questões) da plataforma
- Cronometre: 4 horas, como na prova real
- Revise cada erro com calma
- 🎯 *Fim da Fase 2. Você já resolve no ritmo da prova.*

### 🔵 SEMANA 9 — SIMULADOS em série + Revisão dos erros
- Faça 2 a 3 simulados completos cronometrados
- O objetivo agora não é aprender coisa nova — é **ajustar ritmo, marcação e resistência mental** pras 4 horas
- Revise TODOS os erros acumulados

### 🔵 SEMANA 10 (reta final) — REVISÃO FINAL + descanso estratégico
- 🔓 *Nesta fase você desbloqueou a REVISÃO FINAL INTENSIVA (7 dias antes da prova).*
- Foque nos tópicos que mais caem (estão na revisão final)
- Refaça só as questões que você errou antes
- **Nos 2 dias antes da prova: descanse.** Cérebro cansado não rende. Revisão leve, sono bom.

---

## 🔑 Regras de ouro (siga estas e você chega na frente)

1. **Nunca abandone uma matéria.** Lembra: 1 acerto mínimo em cada disciplina, senão elimina.
2. **Questão vale mais que teoria.** Depois da base, resolver questão é o que mais ensina.
3. **Revise seus erros toda semana.** A plataforma marca o que você errou — volte neles.
4. **Treine cronometrado.** A prova são 60 questões em 4h. Ritmo se treina.
5. **30 min a 1h por dia já te coloca na frente** de quem não está estudando nada.

---

*A prova é 27/09. Cada semana deste cronograma foi pensada pra te levar lá preparado. Siga o plano, confie no processo, e nos vemos do outro lado da aprovação.* 🎓

**Equipe Aprovus**`,

  // ►►► REVISÃO FINAL INTENSIVA — conteúdo preenchido. ◄◄◄
  'revisao-final': `# 🔥 Revisão Final Intensiva — Concurso IBGE 2026

**Você chegou na reta final. A prova é em 7 dias.**

> Este material foi montado com um único objetivo: **maximizar seus pontos nos próximos 7 dias.** Não tem teoria nova aqui. Tem o que mais cai, o que a IBFC adora repetir, e o que você precisa ter fresco na cabeça no dia 27/09.

**Regra de ouro daqui pra frente:** não tenta aprender coisa nova. Revisão só. Quem tenta estudar assunto novo na última semana entra na prova confuso. Você já estudou — agora é consolidar.

---

## ⚠️ A REGRA QUE AINDA PODE TE ELIMINAR

Relembre antes de entrar na revisão:

- ✅ Mínimo **18 pontos no total** (de 60)
- ✅ Mínimo **1 acerto em cada disciplina**

Se você ainda tem insegurança em alguma matéria, **priorize chegar ao 1 ponto mínimo nela antes de tudo.** Garantir o mínimo em todas vale mais do que tirar nota alta em uma só.

---

## 📅 PLANO DE 7 DIAS — o que fazer em cada dia

### DIA 1 (20/09) — Revisão de Português
**Foco: interpretação de texto + concordância**

A maior fatia de Português é interpretação — e é onde mais se perde ponto por falta de atenção, não por falta de conhecimento.

**O que revisar:**
- Leia 3 textos e responda as questões de interpretação. Cronometre.
- Revise concordância verbal e nominal (os casos clássicos que a IBFC cobra)
- Refaça as questões de Português que você errou nos simulados

**Armadilha da banca:** enunciados com "exceto", "incorreto" e "de acordo com o texto". Leia duas vezes antes de marcar.

---

### DIA 2 (21/09) — Revisão de Raciocínio Lógico
**Foco: estruturas lógicas + diagramas**

RLQ é a matéria que mais derruba quem não treinou. Mas é também a mais mecânica — os padrões se repetem.

**O que revisar:**
- Estruturas lógicas: proposições, negação, contrapositiva
- Diagramas lógicos: os 3 tipos de diagrama que a IBFC usa
- Aritmética: porcentagem e razão (caem sempre)

**Armadilha da banca:** questões de RLQ com muito texto pra disfarçar o que é simples. Ignore o enfeite, foque na estrutura lógica.

---

### DIA 3 (22/09) — Revisão da sua matéria específica (parte 1)
**Foco: os tópicos de maior peso do seu cargo**

#### 🟦 Se você é ACA:
- Funções administrativas: **planejamento, organização, direção, controle** — são 4 funções, mas a banca cobre em dezenas de variações. Saiba o que é cada uma e o que inclui.
- Motivação: teorias de Maslow e Herzberg (favoritas da IBFC)
- Atendimento ao público: foco em situações práticas ("o servidor deve...")

#### 🟩 Se você é ACI:
- Word: formatação, estilos, controle de alterações, mala direta
- Excel: funções SOMA, MÉDIA, SE, PROCV, formatação condicional
- Segurança da informação: phishing, backup, senhas, firewall

#### 🟨 Se você é AOR:
- Situações gerenciais: tomada de decisão, liderança situacional
- Funções administrativas + trabalho em equipe
- Noções básicas de informática: não negligencia os 5 pontos

#### 🟧 Se você é ACR ou ACS:
- Funções administrativas e supervisão de equipe
- Conhecimentos Técnicos do Censo: metodologia de coleta, categorias do censo agropecuário/florestal/aquícola

---

### DIA 4 (23/09) — Revisão da sua matéria específica (parte 2)
**Foco: os seus erros, não a teoria**

Hoje não lê teoria nova. Pega os simulados que fez e:
- Lista os 10 tópicos onde você mais errou
- Revisa só esses tópicos
- Refaz as questões erradas

**Por quê:** a banca repete padrões. O tópico onde você errou ontem provavelmente vai aparecer na prova.

---

### DIA 5 (24/09) — SIMULADO COMPLETO CRONOMETRADO
**Simule as condições reais da prova**

- 60 questões
- 4 horas (240 minutos) — não para antes
- Período da tarde (a prova é à tarde — treine no mesmo horário)
- Sem consulta

Depois do simulado:
- Anote sua pontuação total e por disciplina
- Veja se em alguma disciplina você ficou abaixo de 1 acerto — é emergência pra amanhã
- Revise TODOS os erros com calma

---

### DIA 6 (25/09) — Revisão cirúrgica dos erros do simulado
**Só o que você errou ontem**

Não tenta estudar tudo. Foca nos erros do simulado do dia 5 e nos pontos de insegurança.

Se zerou alguma disciplina ontem: **dedica 1 hora só a ela.** Garante o 1 ponto mínimo antes de tudo.

---

### DIA 7 (26/09 — véspera da prova) — DESCANSO ATIVO
**O maior erro da véspera: estudar demais**

Cérebro cansado não recupera na prova o que estudou de última hora. Cérebro descansado recupera tudo que aprendeu nas semanas anteriores.

**O que fazer:**
- Revisão leve de 1 a 2 horas no máximo (leia os pontos principais do edital esquematizado)
- Prepare tudo pro dia seguinte: documento, lanche, roupa, como vai chegar no local
- Durma cedo. Sério.

**O que NÃO fazer:**
- Estudar assunto novo
- Fazer simulado longo
- Ficar acordado tentando "recuperar" o tempo

---

## 🎯 OS TÓPICOS MAIS PROVÁVEIS DE CAIR — o que a IBFC adora

Com base no padrão histórico da banca:

**Português:**
- Interpretação de texto (sempre cai, sempre a maior fatia)
- Concordância verbal com sujeito composto
- Crase (os casos obrigatórios e proibidos)

**Raciocínio Lógico:**
- Proposições e tabela verdade
- Silogismo
- Porcentagem aplicada

**Administração (ACA/AOR/ACR/ACS):**
- As 4 funções administrativas (variações infindáveis)
- Teoria das necessidades de Maslow
- Liderança situacional
- Comunicação organizacional

**Informática (ACI/AOR):**
- Excel: função SE e PROCV
- Segurança: phishing e engenharia social
- Windows: atalhos de teclado

**Conhecimentos Técnicos (ACR/ACS):**
- Conceito e objetivos do Censo Agropecuário
- Unidade de produção agropecuária (UPA)
- Metodologia de coleta

---

## 🧠 MENTALIDADE DA RETA FINAL

**Você estudou.** As semanas anteriores construíram a base. Agora não é sobre aprender mais — é sobre não estragar o que você já sabe.

Na prova:
- Responde primeiro o que você sabe com certeza
- Deixa as dúvidas pro final
- Não fica mais de 3 minutos numa questão
- Gerencia o tempo: 4h pra 60 questões = 4 minutos por questão

**Você chegou até aqui. A prova é amanhã. Você está preparado.**

Boa prova. 🎓

**Equipe Aprovus**`,
}

/**
 * Conteúdo markdown de um bônus de página, ou `null` se ainda não foi colado.
 * `null` faz a página cair no placeholder "em preparação".
 */
export function getBonusContent(slug: string): string | null {
  return BONUS_CONTENT[slug] ?? null
}
