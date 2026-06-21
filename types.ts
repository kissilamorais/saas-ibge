// types/database.ts - Gerado automaticamente do Supabase ou definido manualmente

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
          subscription_status: 'active' | 'cancelled' | 'expired'
          course_access_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      modules: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          order_index: number | null
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['modules']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['modules']['Row']>
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
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['questions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['questions']['Row']>
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
      }
      exams: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          exam_type: 'simulation' | 'practice' | null
          total_questions: number | null
          duration_minutes: number | null
          passing_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['exams']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['exams']['Row']>
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
      }
    }
    Views: {}
    Functions: {}
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
