// =====================================================================
//  lib/study/types.ts — Tipos do domínio (espelham o schema do banco)
// =====================================================================

export type PlanTier = 'basic' | 'premium' | 'lifetime';
export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';
export type Difficulty = 'facil' | 'medio' | 'dificil';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type SessionType = 'study' | 'revision' | 'exam';
export type SessionStatus = 'pending' | 'done' | 'missed' | 'rescheduled';
export type RevisionStatus = 'pending' | 'done' | 'late';
export type ExamAttemptStatus = 'in_progress' | 'finished' | 'abandoned';
export type FunctionTag = 'ACA' | 'ACI' | 'AOR' | 'ACR' | 'ACS';
export type Discipline =
  | 'Português' | 'RLQ' | 'Administração' | 'Informática' | 'Conhecimentos Técnicos';

export type UserLevel =
  | 'Iniciante' | 'Aprendiz' | 'Intermediário' | 'Avançado' | 'Especialista' | 'Aprovado';

// ---------- Conteúdo ----------
export interface Course {
  id: string; slug: string; title: string; description: string | null;
  orgao: string; banca: string; coverUrl: string | null;
  minPlan: PlanTier; position: number; isPublished: boolean;
}

export interface Module {
  id: string; courseId: string; title: string; description: string | null;
  functionTag: FunctionTag | null; position: number;
}

export interface Lesson {
  id: string; moduleId: string; slug: string; title: string;
  contentMd: string | null; summaryMd: string | null;
  videoUrl: string | null; pdfUrl: string | null;
  estimatedMinutes: number; difficulty: Difficulty;
  position: number; isPublished: boolean;
}

export interface ChecklistItem { id: string; lessonId: string; label: string; position: number; }
export interface Flashcard { id: string; lessonId: string | null; discipline: string | null; front: string; back: string; position: number; }

export interface Question {
  id: string; lessonId: string | null; discipline: Discipline; subject: string | null;
  banca: string; difficulty: Difficulty; statementMd: string; explanationMd: string | null; source: string | null;
}
export interface Answer { id: string; questionId: string; label: string; contentMd: string; isCorrect: boolean; position: number; }

export interface Exam {
  id: string; courseId: string | null; title: string; description: string | null;
  functionTag: FunctionTag | null; numQuestions: number; durationMinutes: number;
  minPlan: PlanTier; isPublished: boolean;
}

// ---------- Progresso / estudo ----------
export interface Profile {
  id: string; fullName: string | null; avatarUrl: string | null;
  targetExamDate: string | null; dailyHoursGoal: number; weeklyDaysGoal: number;
  knowledgeLevel: KnowledgeLevel; xp: number;
  currentStreak: number; longestStreak: number; lastActiveDate: string | null;
}

export interface LessonProgress {
  id: string; userId: string; lessonId: string; status: ProgressStatus;
  lastPosition: number; completedAt: string | null;
}

export interface StudyPlan {
  id: string; userId: string; courseId: string | null; examDate: string;
  dailyHours: number; weeklyDays: number; weekdays: number[]; // 0=Dom..6=Sáb
  knowledgeLevel: KnowledgeLevel; isActive: boolean; generatedAt: string;
}

export interface StudySession {
  id: string; userId: string; planId: string | null;
  lessonId: string | null; examId: string | null;
  type: SessionType; scheduledDate: string; // YYYY-MM-DD
  plannedMinutes: number; actualMinutes: number; status: SessionStatus;
}

export interface Revision {
  id: string; userId: string; lessonId: string;
  stage: 1 | 2 | 3 | 4 | 5; dueDate: string; completedAt: string | null; status: RevisionStatus;
}

// ---------- Tentativas ----------
export interface QuestionAttempt {
  id: string; userId: string; questionId: string;
  selectedAnswerId: string | null; isCorrect: boolean; timeSpentSeconds: number; createdAt: string;
}
export interface ExamAttempt {
  id: string; userId: string; examId: string; status: ExamAttemptStatus;
  score: number | null; correctCount: number; wrongCount: number; blankCount: number;
  timeSpentSeconds: number; startedAt: string; finishedAt: string | null;
}

// ---------- Gamificação ----------
export interface Achievement {
  id: string; code: string; title: string; description: string | null;
  icon: string | null; xpReward: number; criteria: Record<string, unknown> | null;
}

// ---------- Cobrança ----------
export interface Subscription {
  id: string; userId: string; planTier: PlanTier; status: string;
  currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean;
}

// ---------- Dashboard (view v_dashboard_stats) ----------
export interface DashboardStats {
  userId: string; xp: number; level: UserLevel;
  currentStreak: number; longestStreak: number;
  targetExamDate: string | null; daysToExam: number;
  lessonsCompleted: number; revisionsDone: number;
  revisionsLate: number; revisionsToday: number;
  questionsAnswered: number; overallAccuracyPct: number | null; minutesStudied: number;
}
