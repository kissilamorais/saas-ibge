// =====================================================================
//  lib/study/spaced-repetition.ts
//  Revisão espaçada com intervalos fixos: 24h → 7d → 15d → 30d → 60d
//  Funções puras (fáceis de testar). A criação inicial das revisões
//  também ocorre por trigger no banco ao concluir a aula; aqui ficam o
//  cálculo de datas, o status (pendente/atrasada) e a reprogramação.
// =====================================================================

import type { Revision, RevisionStatus } from './types';

/** Intervalos em DIAS por estágio (índice 0 = estágio 1). */
export const REVISION_INTERVALS_DAYS = [1, 7, 15, 30, 60] as const;
export type RevisionStage = 1 | 2 | 3 | 4 | 5;

const DAY_MS = 86_400_000;
const LOG = '[StudyPlatform][SR]';

/** Soma `days` a uma data (sem mutar) e zera o horário (date-only). */
function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysBetween(a: Date, b: Date): number {
  const a0 = new Date(a); a0.setHours(0, 0, 0, 0);
  const b0 = new Date(b); b0.setHours(0, 0, 0, 0);
  return Math.round((b0.getTime() - a0.getTime()) / DAY_MS);
}

export interface PlannedRevision {
  lessonId: string;
  stage: RevisionStage;
  dueDate: string; // YYYY-MM-DD
}

/**
 * Gera as 5 revisões de uma aula a partir da data de conclusão.
 * Use no client para preview; o banco também cria via trigger.
 */
export function scheduleRevisions(lessonId: string, completedAt: Date = new Date()): PlannedRevision[] {
  const plan = REVISION_INTERVALS_DAYS.map((interval, i) => ({
    lessonId,
    stage: (i + 1) as RevisionStage,
    dueDate: toISODate(addDays(completedAt, interval)),
  }));
  console.log(LOG, 'scheduled', plan.length, 'revisions for lesson', lessonId);
  return plan;
}

/** Deriva o status de uma revisão pendente em relação a "hoje". */
export function deriveStatus(dueDateISO: string, today: Date = new Date()): RevisionStatus {
  const due = new Date(dueDateISO + 'T00:00:00');
  const diff = daysBetween(today, due); // <0 = venceu
  return diff < 0 ? 'late' : 'pending';
}

export interface RevisionBuckets {
  today: Revision[];
  late: Revision[];
  upcoming: Revision[];
  done: Revision[];
}

/** Agrupa revisões para o dashboard (Fase 5). */
export function bucketRevisions(revisions: Revision[], today: Date = new Date()): RevisionBuckets {
  const buckets: RevisionBuckets = { today: [], late: [], upcoming: [], done: [] };
  for (const r of revisions) {
    if (r.status === 'done') { buckets.done.push(r); continue; }
    const diff = daysBetween(today, new Date(r.dueDate + 'T00:00:00'));
    if (diff < 0) buckets.late.push(r);
    else if (diff === 0) buckets.today.push(r);
    else buckets.upcoming.push(r);
  }
  // atrasadas primeiro, mais antigas no topo
  buckets.late.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  buckets.upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return buckets;
}

/** Patch a aplicar no banco ao concluir uma revisão. */
export function completeRevision(now: Date = new Date()): Pick<Revision, 'status' | 'completedAt'> {
  return { status: 'done', completedAt: now.toISOString() };
}

/**
 * Reprograma uma revisão atrasada para hoje (mantendo o estágio).
 * Política simples e alinhada ao método de intervalos fixos do produto:
 * a revisão atrasada deve ser feita o quanto antes, sem "pular" o estágio.
 */
export function rescheduleOverdue(revision: Revision, today: Date = new Date()): Partial<Revision> {
  if (revision.status === 'done') return {};
  const patch: Partial<Revision> = { dueDate: toISODate(today), status: 'pending' };
  console.log(LOG, 'rescheduled overdue revision', revision.id, '->', patch.dueDate);
  return patch;
}

/**
 * (Opcional) Variante SM-2-like: se o aluno acertar tudo numa revisão,
 * pode-se ESTENDER o próximo intervalo; se errar, ENCURTAR. O produto
 * usa intervalos fixos por padrão, mas deixo o helper pronto.
 */
export function adaptiveNextInterval(baseStage: RevisionStage, performance: 'easy' | 'good' | 'hard'): number {
  const base = REVISION_INTERVALS_DAYS[baseStage - 1];
  const factor = performance === 'easy' ? 1.3 : performance === 'hard' ? 0.6 : 1.0;
  return Math.max(1, Math.round(base * factor));
}
