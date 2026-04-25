// lib/supabase/queries.ts
// Tất cả queries tập trung — dễ cache, dễ test, không duplicate

import { createClient } from "./server";

// ─── Topics ───────────────────────────────
export async function getPublishedTopics() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id,slug,title,description,icon,difficulty,word_count,sort_order")
    .eq("is_published", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getTopicBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  if (error) return null;
  return data;
}

// ─── Words ────────────────────────────────
export async function getPublishedWords(topicId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("words")
    .select(
      "id,topic_id,term,language,definition,pronunciation,example_sentence,icon,difficulty,sort_order",
    )
    .eq("topic_id", topicId)
    .eq("status", "published")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

// ─── User data — parallel fetch pattern ───
export async function getHomePageData(userId?: string) {
  const supabase = await createClient();

  const topicsPromise = supabase
    .from("topics")
    .select("id,slug,title,description,icon,difficulty,word_count,sort_order")
    .eq("is_published", true)
    .order("sort_order");

  if (!userId) {
    const { data: topics } = await topicsPromise;
    return { topics: topics ?? [], progressMap: {}, profile: null };
  }

  const [{ data: topics }, { data: progress }, { data: profile }] =
    await Promise.all([
      topicsPromise,
      supabase
        .from("user_topic_progress")
        .select("topic_id,words_seen,words_mastered")
        .eq("user_id", userId),
      supabase
        .from("profiles")
        .select(
          "id,username,display_name,avatar_url,current_streak,total_points,daily_goal",
        )
        .eq("id", userId)
        .single(),
    ]);

  const progressMap = Object.fromEntries(
    (progress ?? []).map((p) => [p.topic_id, p]),
  );

  return { topics: topics ?? [], progressMap, profile };
}

export async function getTopicPageData(slug: string, userId?: string) {
  const supabase = await createClient();

  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!topic) return null;

  const wordsPromise = supabase
    .from("words")
    .select(
      "id,topic_id,term,language,definition,pronunciation,example_sentence,icon,difficulty,sort_order",
    )
    .eq("topic_id", topic.id)
    .eq("status", "published")
    .order("sort_order");

  if (!userId) {
    const { data: words } = await wordsPromise;
    return {
      topic,
      words: words ?? [],
      progressMap: {},
      topicProgress: { words_seen: 0, words_mastered: 0 },
    };
  }

  // FIX: Bỏ subquery không hợp lệ. Fetch words trước, rồi dùng .in() với wordIds.
  const [{ data: words }, { data: topicProg }] = await Promise.all([
    wordsPromise,
    supabase
      .from("user_topic_progress")
      .select("words_seen,words_mastered")
      .eq("user_id", userId)
      .eq("topic_id", topic.id)
      .single(),
  ]);

  const wordIds = (words ?? []).map((w) => w.id);
  let progressMap: Record<string, string> = {};
  if (wordIds.length > 0) {
    const { data: prog } = await supabase
      .from("user_word_progress")
      .select("word_id,status")
      .eq("user_id", userId)
      .in("word_id", wordIds);
    progressMap = Object.fromEntries(
      (prog ?? []).map((p) => [p.word_id, p.status]),
    );
  }

  return {
    topic,
    words: words ?? [],
    progressMap,
    topicProgress: topicProg ?? { words_seen: 0, words_mastered: 0 },
  };
}

export async function getProgressPageData(userId: string) {
  const supabase = await createClient();

  const [profile, topics, topicProgress, recentSessions, streakLogs] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase
        .from("topics")
        .select("id,slug,title,icon,difficulty,word_count,sort_order")
        .eq("is_published", true)
        .order("sort_order"),
      supabase
        .from("user_topic_progress")
        .select("topic_id,words_seen,words_mastered")
        .eq("user_id", userId),
      supabase
        .from("quiz_sessions")
        .select("id,correct_answers,total_questions,score_points,completed_at,topics(title,icon)")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(5),
      supabase
        .from("streak_logs")
        .select("log_date,goal_reached")
        .eq("user_id", userId)
        .order("log_date", { ascending: false })
        .limit(7),
    ]);

  return {
    profile: profile.data,
    topics: topics.data ?? [],
    topicProgress: topicProgress.data ?? [],
    recentSessions: recentSessions.data ?? [],
    streakLogs: streakLogs.data ?? [],
  };
}
