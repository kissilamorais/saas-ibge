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
  // ►►► CRONOGRAMA DE ESTUDOS — cole o markdown no lugar do `null`. ◄◄◄
  // Exemplo do formato esperado:
  //   'cronograma': `
  //   ## Semana 1 — Fundamentos
  //   | Dia | Matéria | Foco |
  //   | --- | ------- | ---- |
  //   | Seg | Português | ... |
  //   `,
  cronograma: null,

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
