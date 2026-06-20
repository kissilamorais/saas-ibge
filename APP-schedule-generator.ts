// =====================================================================
//  lib/study/schedule-generator.ts
//  Gera study_sessions a partir de {data da prova, horas/dia, dias/semana,
//  nível} e redistribui automaticamente quando o aluno perde um dia.
//  Funções puras → testáveis sem banco. Persistir o resultado em
//  study_plans + study_sessions.
// =====================================================================

import type { KnowledgeLevel, SessionStatus, SessionType } from './types';

const LOG = '[StudyPlatform][Schedule]';
const DAY_MS = 86_400_000;

/** Aula simplificada para o planejamento. */
export interface PlannableLesson {
  id: string;
  moduleOrder: number;     // ordem do módulo
  order: number;           // ordem da aula no módulo
  estimatedMinutes: number;
  /** peso opcional (1 = normal). Disciplinas de maior peso podem receber >1. */
  weight?: number;
}

export interface ExamRef { id: string; durationMinutes: number; }

export interface GenerateInput {
  planId: string;
  userId: string;
  examDate: string;            // YYYY-MM-DD
  dailyHours: number;          // ex.: 2
  weekdays: number[];          // dias disponíveis: 0=Dom .. 6=Sáb
  knowledgeLevel: KnowledgeLevel;
  lessons: PlannableLesson[];
  exams?: ExamRef[];           // simulados a encaixar na reta final
  startDate?: string;          // padrão: hoje
  /** fração do tempo reservada para revisões (padrão 0.3). */
  revisionReserveRatio?: number;
}

export interface GeneratedSession {
  planId: string;
  userId: string;
  type: SessionType;
  lessonId: string | null;
  examId: string | null;
  scheduledDate: string;       // YYYY-MM-DD
  plannedMinutes: number;
  status: SessionStatus;       // sempre 'pending' na geração
}

// ---------- utilidades de data ----------
function parseISO(d: string): Date { const x = new Date(d + 'T00:00:00'); return x; }
function toISO(d: Date): string { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number): Date { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }

/** Lista as datas de estudo disponíveis (respeitando os dias da semana). */
export function availableStudyDates(startISO: string, examISO: string, weekdays: number[]): string[] {
  const start = parseISO(startISO);
  const exam = parseISO(examISO);
  const set = new Set(weekdays);
  const dates: string[] = [];
  for (let t = start.getTime(); t < exam.getTime(); t += DAY_MS) {
    const d = new Date(t);
    if (set.has(d.getDay())) dates.push(toISO(d));
  }
  return dates;
}

/** Ajuste de cobertura conforme o nível: avançado comprime o básico. */
function levelWeight(level: KnowledgeLevel): number {
  return level === 'advanced' ? 0.7 : level === 'intermediate' ? 0.85 : 1.0;
}

/**
 * Gera o cronograma completo. As views "semanal" e "mensal" são apenas
 * agregações por data sobre a mesma lista (ver groupByWeek/Month).
 */
export function generateSchedule(input: GenerateInput): GeneratedSession[] {
  const {
    planId, userId, examDate, dailyHours, weekdays, knowledgeLevel,
    lessons, exams = [], startDate, revisionReserveRatio = 0.3,
  } = input;

  const startISO = startDate ?? toISO(new Date());
  const dates = availableStudyDates(startISO, examDate, weekdays);

  if (dates.length === 0) {
    console.warn(LOG, 'no available study dates before exam');
    return [];
  }

  const dailyBudget = Math.round(dailyHours * 60);                 // min/dia
  const lessonBudgetRatio = 1 - revisionReserveRatio;             // resto p/ revisão
  const compress = levelWeight(knowledgeLevel);

  // ordena aulas por módulo/posição
  const ordered = [...lessons].sort(
    (a, b) => a.moduleOrder - b.moduleOrder || a.order - b.order,
  );

  // reserva os últimos N dias para simulados (1 dia por simulado)
  const examDays = Math.min(exams.length, Math.max(0, dates.length - 1));
  const studyDates = dates.slice(0, dates.length - examDays);
  const finalExamDates = dates.slice(dates.length - examDays);

  const sessions: GeneratedSession[] = [];
  let di = 0;                 // índice do dia
  let remaining = dailyBudget * lessonBudgetRatio;

  for (const lesson of ordered) {
    let minutes = Math.max(5, Math.round(lesson.estimatedMinutes * compress));

    // se a aula não cabe no dia, avança de dia (quebrando aulas longas)
    while (minutes > 0 && di < studyDates.length) {
      if (remaining <= 0) { di++; remaining = dailyBudget * lessonBudgetRatio; continue; }
      const chunk = Math.min(minutes, remaining);
      sessions.push({
        planId, userId, type: 'study', lessonId: lesson.id, examId: null,
        scheduledDate: studyDates[Math.min(di, studyDates.length - 1)],
        plannedMinutes: chunk, status: 'pending',
      });
      minutes -= chunk;
      remaining -= chunk;
    }
    if (di >= studyDates.length) {
      console.warn(LOG, 'ran out of study days; remaining lessons unscheduled from', lesson.id);
      break;
    }
  }

  // encaixa os simulados nos dias finais
  finalExamDates.forEach((date, i) => {
    const ex = exams[i];
    if (!ex) return;
    sessions.push({
      planId, userId, type: 'exam', lessonId: null, examId: ex.id,
      scheduledDate: date, plannedMinutes: ex.durationMinutes, status: 'pending',
    });
  });

  console.log(LOG, 'generated', sessions.length, 'sessions over', dates.length, 'days');
  return sessions;
}

// ---------- agregações para as visões semanal/mensal ----------
export function groupByWeek(sessions: GeneratedSession[]): Record<string, GeneratedSession[]> {
  const out: Record<string, GeneratedSession[]> = {};
  for (const s of sessions) {
    const d = parseISO(s.scheduledDate);
    const monday = addDays(d, ((d.getDay() + 6) % 7) * -1);   // segunda da semana
    const key = toISO(monday);
    (out[key] ??= []).push(s);
  }
  return out;
}

export function groupByMonth(sessions: GeneratedSession[]): Record<string, GeneratedSession[]> {
  const out: Record<string, GeneratedSession[]> = {};
  for (const s of sessions) {
    const key = s.scheduledDate.slice(0, 7);                  // YYYY-MM
    (out[key] ??= []).push(s);
  }
  return out;
}

// =====================================================================
//  REDISTRIBUIÇÃO — "perdi um dia"
//  Move as sessões não feitas de uma data para os próximos dias com
//  capacidade, sem ultrapassar a data da prova. Reage também a revisões
//  atrasadas (basta reprogramá-las via spaced-repetition.ts).
// =====================================================================

export interface RedistributeInput {
  sessions: GeneratedSession[];   // sessões atuais (do plano)
  missedDate: string;             // YYYY-MM-DD que foi perdido
  examDate: string;               // limite rígido
  dailyHours: number;
  weekdays: number[];
}

export interface RedistributeResult {
  updated: GeneratedSession[];    // lista completa já reorganizada
  movedCount: number;
  overflow: GeneratedSession[];   // não couberam antes da prova (alertar o aluno)
}

export function redistributeAfterMissedDay(input: RedistributeInput): RedistributeResult {
  const { sessions, missedDate, examDate, dailyHours, weekdays } = input;
  const dailyBudget = Math.round(dailyHours * 60);

  // 1) separa as sessões perdidas (pendentes naquele dia)
  const missed = sessions.filter(s => s.scheduledDate === missedDate && s.status === 'pending');
  const kept = sessions.filter(s => !(s.scheduledDate === missedDate && s.status === 'pending'));
  if (missed.length === 0) {
    return { updated: sessions, movedCount: 0, overflow: [] };
  }

  // 2) capacidade já ocupada por dia (datas futuras disponíveis)
  const futureDates = availableStudyDates(missedDate, examDate, weekdays)
    .filter(d => d > missedDate);
  const load: Record<string, number> = {};
  for (const s of kept) {
    if (s.scheduledDate > missedDate) load[s.scheduledDate] = (load[s.scheduledDate] ?? 0) + s.plannedMinutes;
  }

  // 3) empurra cada sessão perdida para o primeiro dia com espaço
  const overflow: GeneratedSession[] = [];
  for (const s of missed) {
    let placed = false;
    for (const date of futureDates) {
      const used = load[date] ?? 0;
      if (used + s.plannedMinutes <= dailyBudget) {
        kept.push({ ...s, scheduledDate: date, status: 'pending' });
        load[date] = used + s.plannedMinutes;
        placed = true;
        break;
      }
    }
    if (!placed) overflow.push(s);
  }

  // 4) marca a sessão original do dia perdido como 'missed' (histórico)
  for (const s of missed) {
    kept.push({ ...s, status: 'missed' });
  }

  kept.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  console.log(LOG, 'redistributed', missed.length - overflow.length, 'of', missed.length,
    'sessions from', missedDate, overflow.length ? `(overflow: ${overflow.length})` : '');

  return { updated: kept, movedCount: missed.length - overflow.length, overflow };
}
