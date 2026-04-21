// lib/db.ts
// Tất cả queries & mutations — dùng trong Server Components / Actions

import { createClient } from "@/lib/supabase/server";
import type {
  Database,
  LearningStatus,
  WordStatus,
} from "@/lib/supabase/types";

type TopicRow = Database["public"]["Tables"]["topics"]["Row"];
type WordRow = Database["public"]["Tables"]["words"]["Row"];
type UserWordProgressRow =
  Database["public"]["Tables"]["user_word_progress"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type QuizAnswerInsert = Partial<
  Database["public"]["Tables"]["quiz_answers"]["Insert"]
>;
type StreakLogsInsert = Partial<
  Database["public"]["Tables"]["streak_logs"]["Insert"]
>;
type ProfilesUpdate = Partial<
  Database["public"]["Tables"]["profiles"]["Update"]
>;
type AiJobsInsert = Partial<Database["public"]["Tables"]["ai_jobs"]["Insert"]>;

// ═══════════════════════════════════════════
// TOPICS
// ═══════════════════════════════════════════

export async function getTopicsWithProgress() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: topics, error } = (await supabase
    .from("topics")
    .select("*")
    .eq("is_published", true)
    .order("sort_order")) as { data: TopicRow[] | null; error: any };

  if (error) throw error;
  const topicsList = topics ?? [];
  if (!user)
    return topicsList.map((t) => ({
      ...t,
      words_seen: 0,
      words_mastered: 0,
    }));

  const { data: progress } = (await supabase
    .from("user_topic_progress")
    .select("topic_id, words_seen, words_mastered")
    .eq("user_id", user.id)) as {
    data: Array<{
      topic_id: string;
      words_seen: number;
      words_mastered: number;
    }> | null;
  };

  const progressMap = Object.fromEntries(
    (progress ?? []).map((p: any) => [p.topic_id, p]),
  );

  return topicsList.map((t) => ({
    ...t,
    words_seen: progressMap[t.id]?.words_seen ?? 0,
    words_mastered: progressMap[t.id]?.words_mastered ?? 0,
  }));
}

export async function getTopicBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════
// WORDS
// ═══════════════════════════════════════════

export async function getWordsWithProgress(topicId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: words, error } = (await supabase
    .from("words")
    .select("*")
    .eq("topic_id", topicId)
    .eq("status", "published" as WordStatus)
    .order("sort_order")) as { data: WordRow[] | null; error: any };

  if (error) throw error;
  const wordList = words ?? [];
  if (!user)
    return wordList.map((w) => ({
      ...w,
      learning_status: "new" as LearningStatus,
    }));

  if (wordList.length === 0) return [];

  const wordIds = wordList.map((w) => w.id);
  const { data: progress } = (await supabase
    .from("user_word_progress")
    .select("word_id, status, times_correct, times_wrong, next_review_at")
    .eq("user_id", user.id)
    .in("word_id", wordIds)) as {
    data: Array<
      Pick<
        UserWordProgressRow,
        | "word_id"
        | "status"
        | "times_correct"
        | "times_wrong"
        | "next_review_at"
      >
    > | null;
  };

  const progressMap = Object.fromEntries(
    (progress ?? []).map((p: any) => [p.word_id, p]),
  );

  return wordList.map((w) => ({
    ...w,
    learning_status: (progressMap[w.id]?.status ?? "new") as LearningStatus,
    times_correct: progressMap[w.id]?.times_correct ?? 0,
    times_wrong: progressMap[w.id]?.times_wrong ?? 0,
    next_review_at: progressMap[w.id]?.next_review_at ?? null,
  }));
}

export async function searchWords(query: string, limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("words")
    .select("*, topics(slug, title)")
    .eq("status", "published")
    .or(`term.ilike.%${query}%,definition.ilike.%${query}%`)
    .limit(limit);

  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════
// LEARNING PROGRESS (SM-2)
// ═══════════════════════════════════════════

export async function updateWordProgress(
  wordId: string,
  isCorrect: boolean,
  responseQuality: 0 | 1 | 2 | 3 | 4 | 5 = isCorrect ? 4 : 1,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { data: current } = (await supabase
    .from("user_word_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("word_id", wordId)
    .single()) as { data: UserWordProgressRow | null; error: any };

  const ef = current?.ease_factor ?? 2.5;
  const reps = current?.repetitions ?? 0;

  const newEF = Math.max(
    1.3,
    ef + 0.1 - (5 - responseQuality) * (0.08 + (5 - responseQuality) * 0.02),
  );
  const newReps = responseQuality >= 3 ? reps + 1 : 0;
  const newInterval =
    newReps <= 1
      ? 1
      : newReps === 2
        ? 6
        : Math.round((current?.interval_days ?? 1) * newEF);
  const nextReview = new Date(
    Date.now() + newInterval * 86400000,
  ).toISOString();

  const newStatus: LearningStatus =
    newReps >= 5
      ? "mastered"
      : newReps >= 2
        ? "reviewing"
        : newReps >= 1
          ? "learning"
          : "new";

  const { error } = await supabase.from("user_word_progress").upsert(
    {
      user_id: user.id,
      word_id: wordId,
      status: newStatus,
      ease_factor: newEF,
      interval_days: newInterval,
      repetitions: newReps,
      next_review_at: nextReview,
      times_seen: (current?.times_seen ?? 0) + 1,
      times_correct: (current?.times_correct ?? 0) + (isCorrect ? 1 : 0),
      times_wrong: (current?.times_wrong ?? 0) + (isCorrect ? 0 : 1),
      last_seen_at: new Date().toISOString(),
    } as Partial<UserWordProgressRow>,
    { onConflict: "user_id,word_id" },
  );

  if (error) throw error;
}

export async function getWordsDueToday(limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("words_due_today")
    .select("*")
    .limit(limit);

  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════

export async function saveQuizSession(payload: {
  topicId: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePoints: number;
  durationSecs: number;
  quizType?: "multiple_choice" | "fill_blank" | "true_false" | "matching";
  answers: {
    wordId: string;
    correctAnswer: string;
    userAnswer: string;
    isCorrect: boolean;
    timeTakenMs: number;
    distractors?: string[];
  }[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { data: session, error: sessionErr } = await supabase
    .from("quiz_sessions")
    .insert({
      user_id: user.id,
      topic_id: payload.topicId,
      total_questions: payload.totalQuestions,
      correct_answers: payload.correctAnswers,
      score_points: payload.scorePoints,
      duration_secs: payload.durationSecs,
      quiz_type: payload.quizType ?? "multiple_choice",
    })
    .select()
    .single();

  if (sessionErr) throw sessionErr;

  const { error: answersErr } = await supabase.from("quiz_answers").insert(
    payload.answers.map(
      (a) =>
        ({
          session_id: session.id,
          word_id: a.wordId,
          question_type: payload.quizType ?? "multiple_choice",
          correct_answer: a.correctAnswer,
          user_answer: a.userAnswer,
          is_correct: a.isCorrect,
          time_taken_ms: a.timeTakenMs,
          distractors: a.distractors ?? [],
        }) as QuizAnswerInsert,
    ),
  );

  if (answersErr) throw answersErr;

  await Promise.all(
    payload.answers.map((a) => updateWordProgress(a.wordId, a.isCorrect)),
  );

  await supabase.rpc("increment_points", {
    p_user_id: user.id,
    p_points: payload.scorePoints,
  });

  return session;
}

// ═══════════════════════════════════════════
// PROFILE & STREAK
// ═══════════════════════════════════════════

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateDailyStreak(
  wordsStudied: number,
  quizzesDone: number,
  pointsEarned: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const today = new Date().toISOString().split("T")[0];
  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_goal")
    .eq("id", user.id)
    .single();

  const dailyGoal =
    (profile as { daily_goal?: number } | null)?.daily_goal ?? 10;
  const goalReached = wordsStudied >= dailyGoal;

  await supabase.from("streak_logs").upsert(
    {
      user_id: user.id,
      log_date: today,
      words_studied: wordsStudied,
      quizzes_done: quizzesDone,
      points_earned: pointsEarned,
      goal_reached: goalReached,
    } as StreakLogsInsert,
    { onConflict: "user_id,log_date" },
  );

  if (goalReached) {
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];
    const { data: yLog } = await supabase
      .from("streak_logs")
      .select("goal_reached")
      .eq("user_id", user.id)
      .eq("log_date", yesterday)
      .single();

    const { data: p2 } = await supabase
      .from("profiles")
      .select("current_streak, longest_streak")
      .eq("id", user.id)
      .single();

    const newStreak = yLog?.goal_reached ? (p2?.current_streak ?? 0) + 1 : 1;
    const longestStreak = Math.max(newStreak, p2?.longest_streak ?? 0);

    await supabase
      .from("profiles")
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_activity_at: today,
      } as ProfilesUpdate)
      .eq("id", user.id);
  }
}

export async function getLeaderboard() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("leaderboard").select("*");
  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════
// AI JOBS
// ═══════════════════════════════════════════

export async function createGenerateWordsJob(
  topicId: string,
  options: {
    count: number;
    difficulty: "beginner" | "intermediate" | "advanced";
    language: string;
    style?: string;
  },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { data, error } = await supabase
    .from("ai_jobs")
    .insert({
      job_type: "generate_words",
      topic_id: topicId,
      requested_by: user.id,
      input_payload: {
        count: options.count,
        difficulty: options.difficulty,
        language: options.language,
        style: options.style ?? "educational",
      },
      ai_provider: "anthropic",
      ai_model: "claude-sonnet-4-20250514",
    } as AiJobsInsert)
    .select()
    .single();

  if (error) throw error;
  return data;
}
