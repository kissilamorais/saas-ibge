// types/database.ts - Gerado automaticamente do Supabase ou definido manualmente

import type { TrialCargo, TrialStatus } from '@/lib/trial/types'

// Valor JSON arbitrário (colunas jsonb).
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Cargos do edital nº 01/2026 (trilhas de estudo).
export type FunctionCode = 'aca' | 'aci' | 'aor' | 'acr' | 'acs'

// Estágio do lead no follow-up do admin (CRM básico).
export type LeadFollowupStatus = 'none' | 'contacted' | 'converted' | 'lost'

// Consentimento de e-mail promocional coletado pela Stripe no checkout.
// null = NÃO COLETADO (≠ recusado). A Stripe só exibe a caixa quando empresa
// e cliente estão nos EUA, então em BR o valor é sempre null.
export type PromoConsentStatus = 'opt_in' | 'opt_out' | null

// Depoimentos (prova social) — curadoria manual pelo admin.
export type TestimonialSource = 'whatsapp' | 'email' | 'platform'
export type TestimonialObjectionTag =
  | 'quality'
  | 'price'
  | 'trust'
  | 'time'
  | 'specific'
  | 'simulator'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          purchase_date: string | null
          stripe_customer_id: string | null
          subscription_status: 'inactive' | 'active' | 'cancelled' | 'expired'
          course_access_until: string | null
          target_function: FunctionCode | null
          exam_date: string | null
          daily_goal_hours: number
          weekly_goal_hours: number
          is_admin: boolean
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          lead_followup_status: LeadFollowupStatus
          lead_followup_note: string | null
          lead_followup_at: string | null
          whatsapp: string | null
          is_trial: boolean
          trial_cargo: TrialCargo | null
          trial_status: TrialStatus
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['profiles']['Row'],
          | 'id'
          | 'created_at'
          | 'updated_at'
          | 'target_function'
          | 'exam_date'
          | 'daily_goal_hours'
          | 'weekly_goal_hours'
          | 'is_admin'
          | 'lead_followup_status'
          | 'whatsapp'
          | 'is_trial'
          | 'trial_cargo'
          | 'trial_status'
        > & {
          whatsapp?: string | null
          is_trial?: boolean
          trial_cargo?: TrialCargo | null
          trial_status?: TrialStatus
          target_function?: FunctionCode | null
          exam_date?: string | null
          daily_goal_hours?: number
          weekly_goal_hours?: number
          is_admin?: boolean
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          lead_followup_status?: LeadFollowupStatus
          lead_followup_note?: string | null
          lead_followup_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
        Relationships: []
      }
      modules: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          order_index: number | null
          icon: string | null
          functions: FunctionCode[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['modules']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['modules']['Row']>
        Relationships: []
      }
      lessons: {
        Row: {
          id: string
          module_id: string
          slug: string
          title: string
          content: string | null
          video_url: string | null
          order_index: number | null
          duration_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['lessons']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['lessons']['Row']>
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          module_id: string | null
          lesson_id: string | null
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'essay'
          difficulty: 'easy' | 'medium' | 'hard' | null
          explanation: string | null
          source_ref: string | null
          order_index: number | null
          // Pool fixo do diagnóstico gratuito (0016/VUL-A06) — só estas
          // entram no sorteio de /api/trial/questions.
          is_trial_sample: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['questions']['Row'], 'id' | 'created_at' | 'updated_at' | 'is_trial_sample'> & {
          is_trial_sample?: boolean
        }
        Update: Partial<Database['public']['Tables']['questions']['Row']>
        Relationships: []
      }
      question_options: {
        Row: {
          id: string
          question_id: string
          text: string
          is_correct: boolean
          order_index: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['question_options']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['question_options']['Row']>
        Relationships: []
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string | null
          module_id: string | null
          completed: boolean
          completion_percentage: number
          last_accessed_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_progress']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_progress']['Row']>
        Relationships: []
      }
      user_answers: {
        Row: {
          id: string
          user_id: string
          question_id: string
          selected_option_id: string | null
          is_correct: boolean | null
          attempted_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_answers']['Row'], 'id' | 'created_at' | 'attempted_at'>
        Update: Partial<Database['public']['Tables']['user_answers']['Row']>
        Relationships: []
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          module_id: string | null
          lesson_id: string | null
          started_at: string
          ended_at: string | null
          duration_minutes: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['study_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['study_sessions']['Row']>
        Relationships: []
      }
      exams: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          exam_type: 'simulation' | 'practice' | null
          function_code: FunctionCode | null
          total_questions: number | null
          duration_minutes: number | null
          passing_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['exams']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['exams']['Row']>
        Relationships: []
      }
      user_exam_results: {
        Row: {
          id: string
          user_id: string
          exam_id: string
          score: number | null
          total_questions: number | null
          percentage: number | null
          passed: boolean | null
          time_spent_minutes: number | null
          started_at: string | null
          completed_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_exam_results']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['user_exam_results']['Row']>
        Relationships: []
      }
      exam_questions: {
        Row: {
          id: string
          exam_id: string
          question_id: string
          order_index: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['exam_questions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['exam_questions']['Row']>
        Relationships: []
      }
      stripe_events: {
        Row: {
          id: string
          type: string | null
          processed_at: string
        }
        Insert: Omit<Database['public']['Tables']['stripe_events']['Row'], 'processed_at'> & {
          processed_at?: string
        }
        Update: Partial<Database['public']['Tables']['stripe_events']['Row']>
        Relationships: []
      }
      complimentary_access: {
        Row: {
          id: string
          email: string
          note: string | null
          granted_by: string | null
          granted_at: string
          expires_at: string | null
          revoked_at: string | null
        }
        Insert: {
          id?: string
          email: string
          note?: string | null
          granted_by?: string | null
          granted_at?: string
          expires_at?: string | null
          revoked_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['complimentary_access']['Row']>
        Relationships: []
      }
      abandoned_checkouts: {
        Row: {
          id: string
          session_id: string
          email: string
          full_name: string | null
          recovery_url: string | null
          recovery_expires_at: string | null
          consent_status: PromoConsentStatus
          amount_cents: number | null
          currency: string
          expired_at: string
          recovered_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          email: string
          full_name?: string | null
          recovery_url?: string | null
          recovery_expires_at?: string | null
          consent_status?: PromoConsentStatus
          amount_cents?: number | null
          currency?: string
          expired_at: string
          recovered_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['abandoned_checkouts']['Row']>
        Relationships: []
      }
      pending_orders: {
        Row: {
          id: string
          order_nsu: string
          amount: number
          status: string
          customer_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_nsu: string
          amount: number
          status?: string
          customer_email?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['pending_orders']['Row']>
        Relationships: []
      }
      // Lead do teste gratuito. Vive FORA do auth.users: o visitante do trial
      // não tem conta (ver 0013 e lib/trial-session.ts) — ela só nasce se ele
      // comprar. Escrita/leitura exclusivamente via service_role.
      trial_leads: {
        Row: {
          id: string
          email: string
          full_name: string
          whatsapp: string | null
          trial_cargo: TrialCargo | null
          target_function: FunctionCode | null
          trial_status: TrialStatus
          converted_at: string | null
          // Sorteio do diagnóstico persistido (0016/VUL-A06) — os mesmos ids
          // voltam em qualquer chamada seguinte deste lead, em vez de
          // ampliar a amostra do pool a cada refresh.
          sampled_question_ids: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          whatsapp?: string | null
          trial_cargo?: TrialCargo | null
          target_function?: FunctionCode | null
          trial_status?: TrialStatus
          converted_at?: string | null
          sampled_question_ids?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['trial_leads']['Row']>
        Relationships: []
      }
      free_trial_results: {
        Row: {
          id: string
          // Exatamente um dos dois é preenchido: user_id nas linhas antigas
          // (quem tinha conta), lead_id no funil de convidado.
          user_id: string | null
          lead_id: string | null
          cargo: TrialCargo
          // Respostas já corrigidas NO SERVIDOR (TrialAnswer[]).
          answers: Json
          score_geral: number | null
          score_por_modulo: Json | null
          completed_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          lead_id?: string | null
          cargo: TrialCargo
          answers: Json
          score_geral?: number | null
          score_por_modulo?: Json | null
          completed_at?: string
        }
        Update: Partial<
          Database['public']['Tables']['free_trial_results']['Row']
        >
        Relationships: []
      }
      testimonials: {
        Row: {
          id: string
          author_name: string
          author_cargo: string | null
          content: string
          source: TestimonialSource
          image_url: string | null
          objection_tag: TestimonialObjectionTag | null
          is_active: boolean
          display_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_name: string
          author_cargo?: string | null
          content: string
          source?: TestimonialSource
          image_url?: string | null
          objection_tag?: TestimonialObjectionTag | null
          is_active?: boolean
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['testimonials']['Row']>
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      current_user_has_content_access: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {}
  }
}

// User profile com dados auth
export type UserProfile = Database['public']['Tables']['profiles']['Row']

// Module
export type Module = Database['public']['Tables']['modules']['Row']

// Lesson
export type Lesson = Database['public']['Tables']['lessons']['Row']

// Question
export type Question = Database['public']['Tables']['questions']['Row']

// Question Option
export type QuestionOption = Database['public']['Tables']['question_options']['Row']

// User Progress
export type UserProgress = Database['public']['Tables']['user_progress']['Row']

// User Answer
export type UserAnswer = Database['public']['Tables']['user_answers']['Row']

// Study Session
export type StudySession = Database['public']['Tables']['study_sessions']['Row']

// Exam
export type Exam = Database['public']['Tables']['exams']['Row']

// Exam Result
export type ExamResult = Database['public']['Tables']['user_exam_results']['Row']

// Exam Question (junção)
export type ExamQuestion = Database['public']['Tables']['exam_questions']['Row']

// Cortesia de parceiro (acesso grátis concedido pelo admin)
export type ComplimentaryAccess =
  Database['public']['Tables']['complimentary_access']['Row']

// Checkout abandonado (sessão da Stripe expirada sem pagamento)
export type AbandonedCheckout =
  Database['public']['Tables']['abandoned_checkouts']['Row']

// Lead do teste gratuito (sem conta no Auth até comprar)
export type TrialLead = Database['public']['Tables']['trial_leads']['Row']

// Depoimento (prova social) — curadoria manual pelo admin
export type Testimonial = Database['public']['Tables']['testimonials']['Row']

// Composite types
export type QuestionWithOptions = Question & {
  options?: QuestionOption[]
}

export type LessonWithProgress = Lesson & {
  progress?: UserProgress
}

export type ModuleWithLessons = Module & {
  lessons?: Lesson[]
  progress?: UserProgress[]
}
