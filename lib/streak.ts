// lib/streak.ts
// Utility để cập nhật streak của user
import { createClient } from "@/lib/supabase/client"

export async function updateUserStreak(userId: string) {
  const supabase = createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: existing } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (!existing) {
    await supabase.from("user_streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
      total_words_learned: 0,
      total_quiz_taken: 0,
    })
    return
  }

  const lastDate = existing.last_activity_date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  let newStreak = existing.current_streak
  if (lastDate === today) {
    // Đã học hôm nay rồi
    return
  } else if (lastDate === yesterdayStr) {
    // Học liên tiếp
    newStreak += 1
  } else {
    // Bị đứt chuỗi
    newStreak = 1
  }

  await supabase.from("user_streaks").update({
    current_streak: newStreak,
    longest_streak: Math.max(newStreak, existing.longest_streak),
    last_activity_date: today,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId)
}

export async function incrementWordCount(userId: string, count = 1) {
  const supabase = createClient()
  const { data } = await supabase
    .from("user_streaks")
    .select("total_words_learned")
    .eq("user_id", userId)
    .single()

  await supabase.from("user_streaks").upsert({
    user_id: userId,
    total_words_learned: (data?.total_words_learned || 0) + count,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" })
}

export async function incrementQuizCount(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("user_streaks")
    .select("total_quiz_taken")
    .eq("user_id", userId)
    .single()

  await supabase.from("user_streaks").upsert({
    user_id: userId,
    total_quiz_taken: (data?.total_quiz_taken || 0) + 1,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" })
}
