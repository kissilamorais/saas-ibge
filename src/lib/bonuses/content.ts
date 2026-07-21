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

  // ►►► REVISÃO FINAL INTENSIVA — cole o markdown no lugar do `null`. ◄◄◄
  // Exemplo do formato esperado:
  //   'revisao-final': `
  //   ## Reta final — 7 dias
  //   - Dia 1: ...
  //   - Dia 2: ...
  //   `,
  'revisao-final': null,
}

/**
 * Conteúdo markdown de um bônus de página, ou `null` se ainda não foi colado.
 * `null` faz a página cair no placeholder "em preparação".
 */
export function getBonusContent(slug: string): string | null {
  return BONUS_CONTENT[slug] ?? null
}
