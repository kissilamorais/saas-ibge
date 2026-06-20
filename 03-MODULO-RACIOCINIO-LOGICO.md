# MÓDULO 2 — RACIOCÍNIO LÓGICO QUANTITATIVO
## Curso IBGE Censo Agro 2026 (IBFC) — Documento 3 de 9

> Disciplina **comum a todas as funções** — 10 questões (16,7%).
> ⚠️ Poucas questões, mas **não pode zerar**. Garantir 4-6 acertos aqui é totalmente viável com método.
> Estrutura por aula: 🎯 Por que cai · 📖 Teoria · 🧠 Mapa Mental · 🃏 Flashcards · 🪄 Macetes · ✅ Questões.

---

## AULA 2.1 — ESTRUTURAS LÓGICAS E PROPOSIÇÕES

🎯 **Por que cai:** base de tudo em lógica. 1 a 2 questões diretas + sustenta as aulas 2.2 e 2.3.

### 📖 Resumo Teórico
- **Proposição:** frase declarativa que pode ser **V (verdadeira)** ou **F (falsa)**. *Não* são proposições: perguntas, ordens, exclamações, frases sem verbo.
- **Conectivos lógicos:**
  | Nome | Símbolo | Lê-se | Verdadeiro quando… |
  |---|---|---|---|
  | Negação | ~p / ¬p | "não p" | p é falso |
  | Conjunção | p ∧ q | "p **e** q" | **ambos** V |
  | Disjunção | p ∨ q | "p **ou** q" | **pelo menos um** V |
  | Disjunção exclusiva | p ⊻ q | "**ou** p **ou** q" | exatamente **um** V |
  | Condicional | p → q | "**se** p **então** q" | só é F quando V→F |
  | Bicondicional | p ↔ q | "p **se e somente se** q" | quando têm o **mesmo** valor |

- **Macete por conectivo:**
  - **E (∧):** verdadeiro **só** se os dois forem verdadeiros (basta um F → F).
  - **OU (∨):** falso **só** se os dois forem falsos (basta um V → V).
  - **CONDICIONAL (→):** "se chove, levo guarda-chuva". A única forma de **mentir** é: choveu (V) e **não** levei (F) → **V→F = F**. Todo o resto é V (inclusive "não choveu", que sempre dá V).
  - **BICONDICIONAL (↔):** verdadeiro quando os dois têm o **mesmo** valor (VV ou FF).

### 🧠 Mapa Mental
```
PROPOSIÇÕES (V ou F)
├── Conectivos
│   ├── ~ negação (inverte)
│   ├── ∧ "e" → V só com AMBOS V
│   ├── ∨ "ou" → F só com AMBOS F
│   ├── → "se...então" → F só em V→F
│   └── ↔ "sse" → V quando IGUAIS
└── Memória rápida
    ├── E = exigente (precisa dos 2)
    ├── OU = generoso (basta 1)
    └── SE-ENTÃO mente só quando promete e não cumpre
```

### 🃏 Flashcards
1. P: Quando "p ∧ q" é verdadeiro? **R:** Só quando os dois são V.
2. P: Quando "p ∨ q" é falso? **R:** Só quando os dois são F.
3. P: A única linha F do condicional p→q? **R:** V→F.
4. P: "Se não choveu", o condicional é V ou F? **R:** Sempre V (antecedente falso → condicional verdadeiro).
5. P: Bicondicional é V quando? **R:** Quando p e q têm o mesmo valor lógico.

### 🪄 Macetes & Pegadinhas IBFC
- **Macete "E é exigente, OU é generoso".** "E" precisa de tudo; "OU" se contenta com um.
- **Macete do condicional:** "**A promessa só é quebrada se eu prometi e não cumpri.**" Antecedente falso → não há quebra → V.
- **Pegadinha:** frases imperativas/interrogativas **não são proposições** → a banca coloca "Estude para a prova!" como pegadinha.

### ✅ Questões Comentadas
**Q1.** Considerando p verdadeira e q falsa, o valor lógico de **p → q** é:
A) Verdadeiro B) Falso ✔️ C) Indeterminado D) Depende de outras E) Verdadeiro e falso
**Gabarito: B.** V → F é a **única** combinação que torna o condicional falso.

**Q2.** Qual das frases é uma **proposição lógica**?
A) Que horas são?
B) Estude bastante!
C) O censo agropecuário ocorre em 2026. ✔️
D) Cuidado com o degrau.
E) Ah, que prova difícil!
**Gabarito: C.** Só C é uma sentença **declarativa** (pode ser julgada V ou F). As demais são pergunta, ordem, alerta e exclamação.

---

## AULA 2.2 — TABELA-VERDADE, EQUIVALÊNCIAS E NEGAÇÕES

🎯 **Por que cai:** 1 a 2 questões. As **negações** (Morgan) e a negação do condicional são clássicos de banca.

### 📖 Resumo Teórico
- **Tabela-verdade:** lista todas as combinações de V/F. Para *n* proposições → **2ⁿ linhas**.
- **Negações (decorar!):**
  - ~(p ∧ q) = **~p ∨ ~q** (nega o "e" → vira "ou" negado). *(De Morgan)*
  - ~(p ∨ q) = **~p ∧ ~q** (nega o "ou" → vira "e" negado). *(De Morgan)*
  - **~(p → q) = p ∧ ~q** ← **a mais cobrada!** A negação de "se p então q" é "p **e** não q" (mantém o primeiro, nega o segundo, troca por "e").
  - ~(p ↔ q) = p ⊻ q (ou exclusivo).
- **Equivalências (mesma tabela-verdade):**
  - **p → q  ≡  ~q → ~p** (contrapositiva — a equivalência rainha das provas).
  - **p → q  ≡  ~p ∨ q** (condicional vira disjunção).
- **Negação de quantificadores:**
  - Negar "**Todo** A é B" → "**Algum** A **não** é B" (existe pelo menos um que não é).
  - Negar "**Algum** A é B" → "**Nenhum** A é B".

### 🧠 Mapa Mental
```
NEGAÇÕES & EQUIVALÊNCIAS
├── De Morgan
│   ├── ~(p∧q) = ~p ∨ ~q
│   └── ~(p∨q) = ~p ∧ ~q
├── ~(p→q) = p ∧ ~q   ★ (mantém 1º, nega 2º, vira "e")
├── Equivalências do condicional
│   ├── p→q ≡ ~q→~p (CONTRAPOSITIVA)
│   └── p→q ≡ ~p ∨ q
└── Quantificadores
    ├── ~(Todo é) = Algum NÃO é
    └── ~(Algum é) = Nenhum é
```

### 🃏 Flashcards
1. P: Negação de "p → q"? **R:** p ∧ ~q.
2. P: Equivalente de "p → q" pela contrapositiva? **R:** ~q → ~p.
3. P: Negação de "Todo aluno passou"? **R:** Algum aluno não passou.
4. P: ~(p ∧ q) = ? **R:** ~p ∨ ~q (De Morgan).
5. P: Quantas linhas tem a tabela de 3 proposições? **R:** 2³ = 8.

### 🪄 Macetes & Pegadinhas IBFC
- **Macete da negação do "se-então": "MANTÉM, NEGA, E".** ~(p→q) = mantém p, **nega** q, liga com "**e**". Ex.: nega "Se chover, fico em casa" → "Choveu **e** **não** fiquei em casa".
- **Macete De Morgan: "nega tudo e troca o sinal".** O "e" vira "ou" e vice-versa, negando cada parte.
- **Pegadinha do "todo/algum":** a negação de "todo" **não** é "nenhum" — é "**algum não**". A IBFC erra muita gente aqui.
- **Macete da contrapositiva:** inverte a ordem **e** nega as duas. "Se estudo, passo" ≡ "Se não passo, não estudei".

### ✅ Questões Comentadas
**Q1.** A negação da proposição "Se o candidato estuda, então ele é aprovado" é:
A) Se o candidato não estuda, então não é aprovado.
B) O candidato estuda e não é aprovado. ✔️
C) O candidato não estuda ou é aprovado.
D) O candidato é aprovado e estuda.
E) Se o candidato é aprovado, então estuda.
**Gabarito: B.** ~(p→q) = p ∧ ~q → "estuda **e não** é aprovado". A) é a contrapositiva da inversa (errada); C) é equivalente, não negação; E) é a recíproca.

**Q2.** A negação de "Todos os agentes entregaram o relatório" é:
A) Nenhum agente entregou o relatório.
B) Todos os agentes não entregaram.
C) Pelo menos um agente não entregou o relatório. ✔️
D) Alguns agentes entregaram.
E) Nenhum agente deixou de entregar.
**Gabarito: C.** Negar "todos" = "existe **pelo menos um** que não". Não é "nenhum" (A) — isso seria afirmar o oposto extremo.

---

## AULA 2.3 — LÓGICA DE ARGUMENTAÇÃO (VALIDADE)

🎯 **Por que cai:** 1 a 2 questões. Avalia se uma conclusão **decorre** das premissas.

### 📖 Resumo Teórico
- **Argumento:** conjunto de **premissas** + uma **conclusão**.
- **Argumento válido:** se as premissas forem verdadeiras, a conclusão é **necessariamente** verdadeira. (Validade ≠ verdade dos fatos; é estrutura.)
- **Regras de inferência válidas:**
  - **Modus Ponens:** p→q ; p ∴ **q**. (Se chove, levo capa. Choveu → levei capa.)
  - **Modus Tollens:** p→q ; ~q ∴ **~p**. (Se chove, levo capa. Não levei capa → não choveu.)
  - **Silogismo hipotético:** p→q ; q→r ∴ **p→r** (encadeamento).
  - **Silogismo disjuntivo:** p∨q ; ~p ∴ **q**.
- **Falácias (inválidas) — a banca testa:**
  - **Afirmação do consequente:** p→q ; q ∴ p (INVÁLIDO).
  - **Negação do antecedente:** p→q ; ~p ∴ ~q (INVÁLIDO).
- **Como resolver "validade":** suponha as premissas **verdadeiras** e teste se é possível a conclusão ser **falsa**. Se for impossível → válido.

### 🧠 Mapa Mental
```
ARGUMENTAÇÃO
├── Válido = premissas V ⇒ conclusão necessariamente V
├── Regras VÁLIDAS
│   ├── Modus Ponens:  p→q, p ⊢ q
│   ├── Modus Tollens: p→q, ~q ⊢ ~p
│   ├── Sil. hipotético: p→q, q→r ⊢ p→r
│   └── Sil. disjuntivo: p∨q, ~p ⊢ q
└── FALÁCIAS (inválidas)
    ├── afirmar o consequente (p→q, q ⊬ p)
    └── negar o antecedente (p→q, ~p ⊬ ~q)
```

### 🃏 Flashcards
1. P: Modus Ponens conclui o quê de "p→q" e "p"? **R:** q.
2. P: Modus Tollens parte de "p→q" e "~q" e conclui? **R:** ~p.
3. P: "p→q, q, logo p" é válido? **R:** Não (falácia: afirmação do consequente).
4. P: Validade depende da verdade real dos fatos? **R:** Não, depende da estrutura.
5. P: Como testar validade? **R:** Supor premissas V e ver se a conclusão pode ser F.

### 🪄 Macetes & Pegadinhas IBFC
- **Macete "PONENS empurra para frente; TOLLENS volta negando":** Ponens (afirma o antecedente → afirma o consequente); Tollens (nega o consequente → nega o antecedente).
- **Pegadinha das falácias:** "Se estudou, passou. Passou. Logo estudou." → **inválido** (poderia ter passado por outro motivo). A IBFC adora.
- **Macete do encadeamento:** premissas em cadeia (A→B, B→C, C→D) concluem A→D. Ligue as pontas.

### ✅ Questões Comentadas
**Q1.** São premissas: "Se há coleta, então há dados." e "Não há dados." Conclui-se validamente que:
A) Há coleta.
B) Não há coleta. ✔️
C) Há dados e coleta.
D) Pode haver coleta.
E) Nada se conclui.
**Gabarito: B.** Modus Tollens: p→q e ~q ⊢ ~p. Negou o consequente ("não há dados") → nega o antecedente ("não há coleta").

**Q2.** O argumento "Se o agente faltou, foi advertido. O agente foi advertido. Logo, o agente faltou." é:
A) válido por Modus Ponens
B) válido por Modus Tollens
C) inválido — falácia da afirmação do consequente ✔️
D) válido por silogismo disjuntivo
E) válido por contrapositiva
**Gabarito: C.** Afirmou o consequente ("foi advertido") para concluir o antecedente — falácia. O agente poderia ter sido advertido por outro motivo.

---

## AULA 2.4 — DIAGRAMAS LÓGICOS (QUANTIFICADORES)

🎯 **Por que cai:** 1 a 2 questões. "Todo / algum / nenhum" com diagramas de Venn.

### 📖 Resumo Teórico
- **Todo A é B:** o conjunto A está **inteiramente dentro** de B. (Todo gato é mamífero.)
- **Nenhum A é B:** A e B **não se tocam** (conjuntos separados).
- **Algum A é B:** A e B têm **interseção** (pelo menos um elemento em comum).
- **Algum A não é B:** existe parte de A **fora** de B.

**Regras de conclusão:**
- "Todo A é B" **não** garante "Todo B é A" (cuidado com a inversão!).
- De "Todo A é B" e "Todo B é C" → "Todo A é C" (transitividade).
- "Algum A é B" garante "Algum B é A" (a interseção é mútua).
- Para **derrubar** uma afirmação universal, basta **um contraexemplo**.

### 🧠 Mapa Mental
```
DIAGRAMAS (VENN)
├── TODO A é B → A dentro de B (○A dentro de ○B)
├── NENHUM A é B → círculos separados
├── ALGUM A é B → círculos se cruzam (∩)
├── ALGUM A não é B → parte de A fora de B
└── Cuidado
    ├── "Todo A é B" ≠ "Todo B é A"
    ├── Todo A→B + Todo B→C ⇒ Todo A→C
    └── 1 contraexemplo derruba o "todo"
```

### 🃏 Flashcards
1. P: "Todo A é B" — A está onde? **R:** Inteiramente dentro de B.
2. P: "Todo A é B" implica "Todo B é A"? **R:** Não.
3. P: "Algum A é B" implica "Algum B é A"? **R:** Sim.
4. P: Como representar "Nenhum A é B"? **R:** Dois círculos separados.
5. P: O que derruba "Todo A é B"? **R:** Um único contraexemplo (um A que não é B).

### 🪄 Macetes & Pegadinhas IBFC
- **Macete "TODO entra, NENHUM separa, ALGUM cruza".**
- **Pegadinha da inversão:** "Todo censo coleta dados" **não** significa "Toda coleta de dados é censo".
- **Pegadinha do "algum":** em lógica, "algum" significa **pelo menos um** (pode ser até todos). Não confunda com "alguns, mas não todos" do português coloquial.

### ✅ Questões Comentadas
**Q1.** Sabendo que "Todo recenseador é servidor temporário" e "Todo servidor temporário tem contrato", conclui-se que:
A) Todo recenseador tem contrato. ✔️
B) Todo servidor temporário é recenseador.
C) Nenhum recenseador tem contrato.
D) Algum servidor temporário não tem contrato.
E) Todo contratado é recenseador.
**Gabarito: A.** Transitividade: recenseador ⊂ temporário ⊂ contrato → recenseador ⊂ contrato. B e E invertem indevidamente.

**Q2.** Se "Algum agente é motorista", então é **necessariamente** verdadeiro que:
A) Todo motorista é agente.
B) Algum motorista é agente. ✔️
C) Nenhum agente é motorista.
D) Todo agente é motorista.
E) Algum agente não é motorista.
**Gabarito: B.** A interseção é mútua: se há agentes que são motoristas, há motoristas que são agentes. As demais afirmam mais do que o dado permite.

---

## AULA 2.5 — SEQUÊNCIAS LÓGICAS

🎯 **Por que cai:** 1 questão típica. A IBFC gosta de sequências numéricas e de figuras.

### 📖 Resumo Teórico
- **Procure o padrão:** soma/subtração constante (PA), multiplicação/divisão (PG), alternância, soma dos anteriores (Fibonacci), padrão posicional.
- **Tipos comuns:**
  - **Aritmética:** 2, 5, 8, 11… (+3).
  - **Geométrica:** 3, 6, 12, 24… (×2).
  - **Diferenças crescentes:** 1, 2, 4, 7, 11… (+1, +2, +3, +4).
  - **Fibonacci:** 1, 1, 2, 3, 5, 8… (soma os dois anteriores).
  - **Alternada/intercalada:** dois padrões em zigue-zague (ex.: ímpares e pares misturados).
  - **Letras:** posição no alfabeto (A=1, B=2…), pulando posições.
- **Estratégia:** calcule as **diferenças** entre termos; se forem constantes → PA; se a razão for constante → PG; se as diferenças formam outra sequência → padrão de 2ª ordem.

### 🧠 Mapa Mental
```
SEQUÊNCIAS
├── PA (soma fixa): 2,5,8,11 (+3)
├── PG (multiplica): 3,6,12,24 (×2)
├── Diferenças crescentes: 1,2,4,7,11
├── Fibonacci: soma dos 2 anteriores
├── Alternada: dois padrões intercalados
├── Letras: posição no alfabeto
└── MÉTODO: calcule as diferenças → ache o padrão
```

### 🃏 Flashcards
1. P: 2, 4, 8, 16, ? **R:** 32 (×2, PG).
2. P: 1, 4, 9, 16, ? **R:** 25 (quadrados perfeitos).
3. P: 1, 1, 2, 3, 5, ? **R:** 8 (Fibonacci).
4. P: 3, 6, 11, 18, ? **R:** 27 (+3, +5, +7, +9).
5. P: Primeiro passo para achar o padrão? **R:** Calcular as diferenças entre os termos.

### 🪄 Macetes & Pegadinhas IBFC
- **Macete "calcule as diferenças primeiro".** Se a diferença é fixa → PA. Se a diferença cresce de forma regular → padrão de 2ª ordem (ex.: +2, +4, +6).
- **Pegadinha da sequência intercalada:** olhe os termos de 2 em 2 (1º, 3º, 5º… e 2º, 4º, 6º…). Às vezes são duas sequências misturadas.
- **Macete dos quadrados/cubos:** memorize 1,4,9,16,25,36… (quadrados) e 1,8,27,64… (cubos) — aparecem disfarçados.

### ✅ Questões Comentadas
**Q1.** Qual o próximo termo de 5, 10, 20, 40, ___?
A) 60 B) 70 C) 80 ✔️ D) 50 E) 45
**Gabarito: C.** Razão constante ×2 (PG): 40 × 2 = 80.

**Q2.** Na sequência 2, 3, 5, 8, 12, 17, ___, o próximo número é:
A) 21 B) 22 C) 23 ✔️ D) 24 E) 20
**Gabarito: C.** As diferenças crescem: +1, +2, +3, +4, +5 → próxima diferença +6 → 17 + 6 = 23.

---

## AULA 2.6 — ARITMÉTICA

🎯 **Por que cai:** 1 a 2 questões; base para porcentagem e problemas.

### 📖 Resumo Teórico
- **Ordem das operações:** parênteses → potências/raízes → multiplicação/divisão → soma/subtração.
- **Números primos:** divisíveis só por 1 e por si (2,3,5,7,11,13…). 2 é o único primo par.
- **Critérios de divisibilidade:** por 2 (termina em par); por 3 (soma dos dígitos divisível por 3); por 5 (termina em 0 ou 5); por 10 (termina em 0).
- **MDC** (máximo divisor comum) — "quantos cabem em ambos" / juntar em grupos iguais máximos.
- **MMC** (mínimo múltiplo comum) — "quando coincidem de novo" / eventos que se repetem.
- **Fração, decimal e porcentagem:** 1/2 = 0,5 = 50%; 1/4 = 0,25 = 25%; 3/4 = 0,75 = 75%; 1/5 = 0,2 = 20%.
- **Operações com frações:** soma/subtração exige mesmo denominador; multiplicação é "reto"; divisão é "repete a primeira e multiplica pelo inverso da segunda".

### 🧠 Mapa Mental
```
ARITMÉTICA
├── Ordem: ( ) → potência → ×÷ → +−
├── Primos: 2,3,5,7,11... (2 = único par)
├── Divisibilidade: 2(par) 3(soma) 5(0/5) 10(0)
├── MDC = junta em grupos máximos iguais
├── MMC = quando os ciclos coincidem
└── Frações: soma(mesmo denom.) ÷(inverte a 2ª)
```

### 🃏 Flashcards
1. P: Único número primo par? **R:** 2.
2. P: 3/4 em porcentagem? **R:** 75%.
3. P: MMC serve para qual tipo de problema? **R:** Eventos que se repetem e coincidem.
4. P: Como dividir frações? **R:** Repete a 1ª e multiplica pelo inverso da 2ª.
5. P: 252 é divisível por 3? **R:** Sim (2+5+2=9, divisível por 3).

### 🪄 Macetes & Pegadinhas IBFC
- **Macete MMC × MDC:** **MMC** ("Mínimo Múltiplo") → problemas de **encontro/repetição** (sinaleiras que piscam juntas, ônibus que partem juntos). **MDC** → problemas de **divisão em partes iguais máximas** (cortar barbantes, formar grupos).
- **Pegadinha da ordem das operações:** "2 + 3 × 4" = 14 (não 20). Multiplicação antes da soma.

### ✅ Questões Comentadas
**Q1.** Dois recenseadores partem da base juntos; um retorna a cada 6 dias e o outro a cada 8 dias. Em quantos dias se reencontram na base?
A) 14 B) 24 ✔️ C) 48 D) 12 E) 16
**Gabarito: B.** Problema de **MMC** (coincidência): MMC(6,8) = 24 dias.

**Q2.** O valor de 10 + 2 × (6 − 3)² é:
A) 28 ✔️ B) 36 C) 108 D) 24 E) 30
**Gabarito: A.** Parênteses: (6−3)=3; potência: 3²=9; multiplicação: 2×9=18; soma: 10+18=**28**.

---

## AULA 2.7 — RAZÃO, PROPORÇÃO, REGRA DE TRÊS E PORCENTAGEM

🎯 **Por que cai:** **a estrela do RLQ da IBFC** — 1 a 3 questões. Custo-benefício altíssimo.

### 📖 Resumo Teórico
- **Razão:** comparação por divisão (a/b). **Proporção:** igualdade de razões (a/b = c/d) → produto cruzado: a·d = b·c.
- **Regra de três simples:**
  - **Direta** (uma cresce, a outra cresce): multiplica em cruz.
  - **Inversa** (uma cresce, a outra diminui — ex.: mais pessoas, menos tempo): multiplica "em linha" (inverte uma fração).
- **Porcentagem:** "por cento" = dividir por 100. **10% de 200** = 200 × 0,10 = 20.
  - **Aumento de x%:** multiplique por (1 + x/100). +20% → ×1,20.
  - **Desconto de x%:** multiplique por (1 − x/100). −15% → ×0,85.
  - **Aumentos/descontos sucessivos** se **multiplicam** (não se somam): +10% depois −10% → ×1,1×0,9 = 0,99 → fica 1% **menor** que o original (pegadinha!).
- **Porcentagem inversa:** "210 é 105% de quanto?" → divida: 210 / 1,05 = 200.

### 🧠 Mapa Mental
```
RAZÃO / PROPORÇÃO / % 
├── Proporção: a/b = c/d → a·d = b·c (cruz)
├── Regra de 3
│   ├── DIRETA (↑↑) → cruz
│   └── INVERSA (↑↓) → inverte uma fração
├── Porcentagem: x% = x/100
│   ├── +x% → ×(1+x/100)
│   ├── −x% → ×(1−x/100)
│   └── sucessivos → MULTIPLICA (+10% e −10% = −1%)
└── "X é p% de quê?" → divide por (p/100)
```

### 🃏 Flashcards
1. P: 25% de 80? **R:** 20 (80 × 0,25).
2. P: Aumentar 30% = multiplicar por? **R:** 1,30.
3. P: Descontar 40% = multiplicar por? **R:** 0,60.
4. P: +10% e depois −10% volta ao valor original? **R:** Não — fica 1% menor (×1,1×0,9 = 0,99).
5. P: Mais máquinas, menos tempo é regra de três? **R:** Inversa.

### 🪄 Macetes & Pegadinhas IBFC
- **Macete do "fator multiplicativo":** transforme % em multiplicação. +18% = ×1,18; −25% = ×0,75. Resolve quase tudo de cabeça.
- **Pegadinha dos sucessivos:** descontos/aumentos **não somam**. "+50% e depois −50%" **não** volta ao original (×1,5×0,5 = 0,75 → perde 25%).
- **Macete da regra de três inversa:** se ao aumentar uma grandeza a outra **diminui** (pessoas × tempo, velocidade × tempo), **inverta** uma das frações antes de multiplicar em cruz.

### ✅ Questões Comentadas
**Q1.** Um produto que custava R$ 200,00 teve aumento de 15%. O novo preço é:
A) R$ 215,00 B) R$ 230,00 ✔️ C) R$ 240,00 D) R$ 300,00 E) R$ 220,00
**Gabarito: B.** 200 × 1,15 = **R$ 230,00**.

**Q2.** Se 4 recenseadores concluem a coleta de um setor em 9 dias, quantos dias levariam 6 recenseadores (mesmo ritmo)?
A) 13,5 B) 6 ✔️ C) 12 D) 4,5 E) 7
**Gabarito: B.** Regra de três **inversa** (mais gente → menos tempo): 4 × 9 = 6 × x → x = 36/6 = **6 dias**.

**Q3.** Numa cidade, 30% dos 1.200 candidatos faltaram à prova. Quantos compareceram?
A) 360 B) 840 ✔️ C) 900 D) 800 E) 760
**Gabarito: B.** Faltaram 30% → compareceram 70%: 1.200 × 0,70 = **840**.

---

## AULA 2.8 — ÁLGEBRA BÁSICA

🎯 **Por que cai:** 1 a 2 questões; problemas com "incógnita".

### 📖 Resumo Teórico
- **Equação do 1º grau:** isolar o x (o que está somando passa subtraindo; o que multiplica passa dividindo). *2x + 6 = 20 → 2x = 14 → x = 7.*
- **Tradução de problemas (português → equação):** "o dobro" = 2x; "a metade" = x/2; "a mais que" = +; "a menos" = −; "três números consecutivos" = x, x+1, x+2.
- **Sistemas de duas equações:** método da substituição ou da adição. Útil em "soma e diferença".
- **Equação do 2º grau (ax²+bx+c=0):** Bhaskara, x = [−b ± √(b²−4ac)] / 2a. (Noções; raro neste nível, mas pode aparecer.)

### 🧠 Mapa Mental
```
ÁLGEBRA
├── 1º grau: isola x (+ passa −, × passa ÷)
├── Traduzir: dobro=2x, metade=x/2, consecutivos=x,x+1,x+2
├── Sistemas: substituição ou adição
└── 2º grau: Bhaskara x=(−b±√Δ)/2a, Δ=b²−4ac
```

### 🃏 Flashcards
1. P: Resolva 3x − 5 = 16. **R:** x = 7.
2. P: "O triplo de um número mais 4" em álgebra? **R:** 3x + 4.
3. P: Δ na fórmula de Bhaskara? **R:** b² − 4ac.
4. P: Dois números consecutivos? **R:** x e x+1.
5. P: Como resolver sistema por adição? **R:** Somar as equações para cancelar uma incógnita.

### 🪄 Macetes & Pegadinhas IBFC
- **Macete da tradução:** monte a equação **frase por frase**. "Um número somado ao seu dobro é 18" → x + 2x = 18 → 3x = 18 → x = 6.
- **Pegadinha do "a menos que":** "5 a menos que o dobro" = 2x − 5 (a ordem importa).
- **Macete da conferência:** substitua a resposta na equação original para checar.

### ✅ Questões Comentadas
**Q1.** A soma de um número com o seu triplo é 48. Esse número é:
A) 16 B) 12 ✔️ C) 8 D) 24 E） 10
**Gabarito: B.** x + 3x = 48 → 4x = 48 → x = **12**.

**Q2.** Em um setor, o número de estabelecimentos visitados no 2º dia foi o dobro do 1º, e juntos somaram 90. Quantos foram visitados no 1º dia?
A) 30 ✔️ B) 45 C) 60 D) 20 E) 25
**Gabarito: A.** x + 2x = 90 → 3x = 90 → x = **30** (e 60 no 2º dia).

---

## AULA 2.9 — GEOMETRIA BÁSICA

🎯 **Por que cai:** 1 questão típica (perímetro, área, às vezes volume).

### 📖 Resumo Teórico
- **Perímetro:** soma dos lados (contorno).
- **Áreas:**
  - Quadrado: lado². Retângulo: base × altura.
  - Triângulo: (base × altura)/2.
  - Círculo: π × raio² (use π ≈ 3,14).
- **Volumes:**
  - Cubo: aresta³. Paralelepípedo (bloco): comprimento × largura × altura.
- **Conversões:** 1 m = 100 cm; 1 m² = 10.000 cm²; 1 hectare (ha) = 10.000 m² (útil em contexto agro!).

### 🧠 Mapa Mental
```
GEOMETRIA
├── Perímetro = soma dos lados
├── Áreas: quadrado=L² | retângulo=b×h
│        triângulo=b×h/2 | círculo=πr²
├── Volumes: cubo=a³ | bloco=c×l×h
└── 1 hectare = 10.000 m² (contexto agro!)
```

### 🃏 Flashcards
1. P: Área do retângulo? **R:** Base × altura.
2. P: Área do triângulo? **R:** (base × altura) / 2.
3. P: Área do círculo? **R:** π × raio².
4. P: 1 hectare equivale a quantos m²? **R:** 10.000 m².
5. P: Volume do cubo de aresta 3? **R:** 27 (3³).

### 🪄 Macetes & Pegadinhas IBFC
- **Pegadinha perímetro × área:** perímetro é "ao redor" (em metros); área é "dentro" (em m²). Leia o que a questão pede.
- **Macete agro:** problemas de fazenda costumam usar **hectare** — lembre que 1 ha = 10.000 m².
- **Pegadinha do raio × diâmetro:** raio é metade do diâmetro. Se a questão der o diâmetro, divida por 2 antes de usar na fórmula.

### ✅ Questões Comentadas
**Q1.** Um setor censitário retangular mede 200 m por 150 m. Sua área é:
A) 350 m² B) 700 m² C) 30.000 m² ✔️ D) 3.000 m² E) 35.000 m²
**Gabarito: C.** Área = base × altura = 200 × 150 = **30.000 m²** (ou 3 hectares).

**Q2.** Quantos metros de cerca são necessários para cercar um terreno quadrado de 25 m de lado?
A) 25 B) 50 C) 100 ✔️ D) 625 E) 75
**Gabarito: C.** Cerca = **perímetro** = 4 × 25 = **100 m**. (Atenção: 625 seria a área.)

---

## AULA 2.10 — ANÁLISE COMBINATÓRIA E PROBABILIDADE (NOÇÕES)

🎯 **Por que cai:** 0 a 1 questão; nível básico.

### 📖 Resumo Teórico
- **Princípio fundamental da contagem:** se uma escolha tem *m* opções e outra *n*, as duas juntas têm **m × n** possibilidades.
- **Permutação** (ordenar todos): n! (fatorial). 3 pessoas em fila = 3! = 6.
- **Probabilidade:** P = casos favoráveis / casos possíveis. Resultado entre 0 e 1 (ou 0% a 100%).
  - Dado: P(sair 4) = 1/6. Moeda: P(cara) = 1/2.
- **Probabilidade do "e" (eventos independentes):** multiplica. **Do "ou" (mutuamente exclusivos):** soma.

### 🧠 Mapa Mental
```
COMBINATÓRIA & PROBABILIDADE
├── Contagem: m × n (multiplica as etapas)
├── Permutação: n! (ordenar todos)
├── Probabilidade = favoráveis / possíveis (0 a 1)
└── "E" → multiplica | "OU" → soma
```

### 🃏 Flashcards
1. P: 4 camisas e 3 calças dão quantas combinações? **R:** 12 (4×3).
2. P: P(sair número par num dado)? **R:** 3/6 = 1/2.
3. P: Permutação de 4 elementos? **R:** 4! = 24.
4. P: Probabilidade de "A e B" independentes? **R:** P(A) × P(B).
5. P: Faixa de valores de uma probabilidade? **R:** De 0 a 1 (0% a 100%).

### 🪄 Macetes & Pegadinhas IBFC
- **Macete da contagem:** "para cada... há...". Multiplique as etapas independentes.
- **Pegadinha "e/ou":** "e" → multiplica; "ou" → soma. Identifique o conector.
- **Macete do dado/moeda:** sempre 6 e 2 casos possíveis, respectivamente.

### ✅ Questões Comentadas
**Q1.** Ao lançar um dado comum, a probabilidade de sair um número maior que 4 é:
A) 1/6 B) 1/3 ✔️ C) 1/2 D) 2/3 E) 5/6
**Gabarito: B.** Maiores que 4 = {5, 6} → 2 casos em 6 → 2/6 = **1/3**.

**Q2.** Um agente tem 3 rotas para o trecho A e 4 rotas para o trecho B. De quantas formas pode combinar uma rota A com uma B?
A) 7 B) 12 ✔️ C) 9 D) 16 E) 6
**Gabarito: B.** Princípio da contagem: 3 × 4 = **12**.

---

## ENCERRAMENTO DO MÓDULO 2

**Aulas-chave (mais retorno):** 2.7 (porcentagem/regra de três) e 2.1–2.2 (proposições/negações).
**Estratégia anti-zero:** mesmo quem não ama exatas garante os pontos de RLQ treinando **muitas questões** dos tipos clássicos da IBFC — porcentagem, sequência e diagramas. Meta realista: **5 a 7 das 10 questões**.

*Continua no Documento 4 (Módulo de Administração e Situações Gerenciais).*
