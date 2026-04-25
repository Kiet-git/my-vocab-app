// lib/supabase/types.ts

export type WordStatus = "draft" | "published" | "archived";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type QuestionType =
  | "multiple_choice"
  | "fill_blank"
  | "true_false"
  | "matching";
export type AiJobStatus = "pending" | "processing" | "done" | "failed";
export type LearningStatus = "new" | "learning" | "reviewing" | "mastered";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  last_activity_at: string | null;
  daily_goal: number;
  ui_language: string;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string;
  difficulty: DifficultyLevel;
  is_published: boolean;
  sort_order: number;
  word_count: number;
  ai_generated: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Word {
  id: string;
  topic_id: string;
  term: string;
  language: string;
  definition: string;
  pronunciation: string | null;
  example_sentence: string | null;
  notes: string | null;
  image_url: string | null;
  audio_url: string | null;
  status: WordStatus;
  difficulty: DifficultyLevel;
  icon: string;
  sort_order: number;
  ai_generated: boolean;
  ai_model: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWordProgress {
  id: string;
  user_id: string;
  word_id: string;
  status: LearningStatus;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  times_seen: number;
  times_correct: number;
  times_wrong: number;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserTopicProgress {
  id: string;
  user_id: string;
  topic_id: string;
  words_seen: number;
  words_mastered: number;
  last_studied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizSession {
  id: string;
  user_id: string;
  topic_id: string;
  total_questions: number;
  correct_answers: number;
  score_points: number;
  duration_secs: number | null;
  quiz_type: QuestionType;
  completed_at: string;
  created_at: string;
}

export interface QuizAnswer {
  id: string;
  session_id: string;
  word_id: string;
  question_type: QuestionType;
  correct_answer: string;
  user_answer: string;
  is_correct: boolean;
  time_taken_ms: number | null;
  distractors: string[] | null;
  created_at: string;
}

export interface StreakLog {
  id: string;
  user_id: string;
  log_date: string;
  words_studied: number;
  quizzes_done: number;
  points_earned: number;
  goal_reached: boolean;
  created_at: string;
}

export interface AiJob {
  id: string;
  job_type: string;
  status: AiJobStatus;
  topic_id: string | null;
  word_id: string | null;
  requested_by: string | null;
  input_payload: Record<string, unknown>;
  output_payload: Record<string, unknown> | null;
  error_message: string | null;
  ai_provider: string;
  ai_model: string;
  tokens_used: number | null;
  cost_usd: number | null;
  attempt_count: number;
  max_attempts: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Helper type: QuizSession với topic join ─────────────────────────────────
// Dùng khi query: quiz_sessions.select("..., topics(title,icon)")
export type QuizSessionWithTopic = QuizSession & {
  topics: Pick<Topic, "title" | "icon"> | null;
};

// ─── Helper type: Word với topic join ────────────────────────────────────────
export type WordWithTopic = Word & {
  topics: Pick<Topic, "title"> | null;
};

// ─── Database schema ─────────────────────────────────────────────────────────
// FIX: Thêm Relationships đúng để TypeScript hiểu các foreign-key join.
// Thiếu Relationships → TypeScript infer field join là `never`.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      topics: {
        Row: Topic;
        Insert: Partial<Topic>;
        Update: Partial<Topic>;
        Relationships: [];
      };
      words: {
        Row: Word;
        Insert: Partial<Word>;
        Update: Partial<Word>;
        Relationships: [
          {
            foreignKeyName: "words_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          }
        ];
      };
      user_word_progress: {
        Row: UserWordProgress;
        Insert: Partial<UserWordProgress>;
        Update: Partial<UserWordProgress>;
        Relationships: [
          {
            foreignKeyName: "user_word_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_word_progress_word_id_fkey";
            columns: ["word_id"];
            isOneToOne: false;
            referencedRelation: "words";
            referencedColumns: ["id"];
          }
        ];
      };
      user_topic_progress: {
        Row: UserTopicProgress;
        Insert: Partial<UserTopicProgress>;
        Update: Partial<UserTopicProgress>;
        Relationships: [
          {
            foreignKeyName: "user_topic_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_topic_progress_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          }
        ];
      };
      quiz_sessions: {
        Row: QuizSession;
        Insert: Partial<QuizSession>;
        Update: Partial<QuizSession>;
        Relationships: [
          {
            foreignKeyName: "quiz_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_sessions_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          }
        ];
      };
      quiz_answers: {
        Row: QuizAnswer;
        Insert: Partial<QuizAnswer>;
        Update: Partial<QuizAnswer>;
        Relationships: [
          {
            foreignKeyName: "quiz_answers_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "quiz_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_answers_word_id_fkey";
            columns: ["word_id"];
            isOneToOne: false;
            referencedRelation: "words";
            referencedColumns: ["id"];
          }
        ];
      };
      streak_logs: {
        Row: StreakLog;
        Insert: Partial<StreakLog>;
        Update: Partial<StreakLog>;
        Relationships: [
          {
            foreignKeyName: "streak_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_jobs: {
        Row: AiJob;
        Insert: Partial<AiJob>;
        Update: Partial<AiJob>;
        Relationships: [];
      };
    };
    Views: {
      leaderboard: {
        Row: Pick<
          Profile,
          | "id"
          | "username"
          | "display_name"
          | "avatar_url"
          | "total_points"
          | "current_streak"
        > & { rank: number };
        Relationships: [];
      };
      words_due_today: {
        Row: Word &
          Pick<
            UserWordProgress,
            | "ease_factor"
            | "interval_days"
            | "repetitions"
            | "next_review_at"
            | "times_correct"
            | "times_wrong"
          > & {
            topic_title: string;
            topic_slug: string;
            learning_status: LearningStatus;
          };
        Relationships: [];
      };
    };
    Functions: {
      increment_points: {
        Args: {
          p_user_id: string;
          p_points: number;
        };
        Returns: null;
      };
    };
  };
};
