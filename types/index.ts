// types/index.ts — Thêm vào file types hiện có hoặc tạo mới

export interface Word {
  id: string
  topic_slug: string
  word: string
  language: string
  definition: string
  example_sentence: string
  icon: string
  audio_url?: string
  pronunciation?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[]
  created_at: string
}

export interface Topic {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  difficulty?: string
  tags?: string[]
  thumbnail_url?: string
  is_published?: boolean
  sort_order?: number
}

export interface QuizQuestion {
  id: string
  topic_slug: string
  question: string
  correct_answer: string
  options: string[]
  explanation?: string
  difficulty?: string
}

export interface UserProgress {
  id: string
  user_id: string
  word_id: string
  topic_slug: string
  status: 'new' | 'learning' | 'mastered'
  review_count: number
  last_reviewed_at?: string
  next_review_at?: string
}

export interface UserStreak {
  user_id: string
  current_streak: number
  longest_streak: number
  last_activity_date?: string
  total_words_learned: number
  total_quiz_taken: number
}

export interface QuizResult {
  id: string
  user_id: string
  topic_slug: string
  score: number
  total_questions: number
  time_taken_seconds?: number
  answers: Array<{ question_id: string; selected: string; correct: boolean }>
  created_at: string
}

export interface AdminStats {
  total_users: number
  total_words: number
  total_topics: number
  total_quizzes_taken: number
  quizzes_last_7_days: number
  total_words_mastered: number
  active_users_last_7_days: number
}
