// app/dashboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Stats {
  streak: number
  longest_streak: number
  total_words_learned: number
  total_quiz_taken: number
  recent_quizzes: Array<{ topic_slug: string; score: number; total_questions: number; created_at: string }>
  mastered_by_topic: Array<{ topic_slug: string; count: number }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [aiInsight, setAiInsight] = useState("")
  const [loadingInsight, setLoadingInsight] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return
      setUser({ email: u.email })

      const [streakRes, quizRes, progressRes] = await Promise.all([
        supabase.from("user_streaks").select("*").eq("user_id", u.id).single(),
        supabase.from("quiz_results").select("*").eq("user_id", u.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("user_progress").select("topic_slug, status").eq("user_id", u.id).eq("status", "mastered"),
      ])

      // Count mastered by topic
      const topicCounts: Record<string, number> = {}
      progressRes.data?.forEach(p => {
        topicCounts[p.topic_slug] = (topicCounts[p.topic_slug] || 0) + 1
      })

      setStats({
        streak: streakRes.data?.current_streak || 0,
        longest_streak: streakRes.data?.longest_streak || 0,
        total_words_learned: streakRes.data?.total_words_learned || 0,
        total_quiz_taken: streakRes.data?.total_quiz_taken || 0,
        recent_quizzes: quizRes.data || [],
        mastered_by_topic: Object.entries(topicCounts).map(([topic_slug, count]) => ({ topic_slug, count })),
      })
    }
    load()
  }, [supabase])

  const getAiInsight = async () => {
    if (!stats) return
    setLoadingInsight(true)
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "analyze_progress",
        payload: { stats },
      }),
    })
    const data = await res.json()
    setAiInsight(data.result)
    setLoadingInsight(false)
  }

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"/>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard của bạn</h1>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
        <Link href="/" className="text-sm text-blue-500 hover:underline">← Về trang chủ</Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "🔥", label: "Chuỗi hiện tại", value: `${stats.streak} ngày`, color: "from-orange-400 to-red-400" },
          { icon: "⭐", label: "Chuỗi dài nhất", value: `${stats.longest_streak} ngày`, color: "from-yellow-400 to-orange-400" },
          { icon: "📚", label: "Từ đã học", value: stats.total_words_learned, color: "from-blue-400 to-indigo-400" },
          { icon: "📝", label: "Quiz đã làm", value: stats.total_quiz_taken, color: "from-green-400 to-teal-400" },
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-4 text-white`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-white/80">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* AI Insight */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <span className="material-symbols-rounded text-blue-500">smart_toy</span>
            Nhận xét từ AI
          </h2>
          <button
            onClick={getAiInsight}
            disabled={loadingInsight}
            className="text-sm bg-blue-500 text-white rounded-full px-4 py-1.5 hover:bg-blue-600 disabled:opacity-50"
          >
            {loadingInsight ? "Đang phân tích..." : "Phân tích ngay"}
          </button>
        </div>
        {aiInsight ? (
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{aiInsight}</p>
        ) : (
          <p className="text-sm text-gray-400">Nhấn "Phân tích ngay" để nhận gợi ý học tập cá nhân hóa từ AI.</p>
        )}
      </div>

      {/* Recent quizzes */}
      {stats.recent_quizzes.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Quiz gần đây</h2>
          <div className="space-y-2">
            {stats.recent_quizzes.map((q, i) => {
              const pct = Math.round((q.score / q.total_questions) * 100)
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="font-medium capitalize">{q.topic_slug.replace(/-/g, " ")}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 80 ? "bg-green-400" : pct >= 60 ? "bg-yellow-400" : "bg-red-400"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-600 w-12 text-right">{q.score}/{q.total_questions}</span>
                    <span className="text-xs text-gray-400">{new Date(q.created_at).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mastered by topic */}
      {stats.mastered_by_topic.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Từ đã thuộc theo topic</h2>
          <div className="flex flex-wrap gap-2">
            {stats.mastered_by_topic.map((t, i) => (
              <Link key={i} href={`/topic/${t.topic_slug}`}
                className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 text-sm text-green-700 hover:bg-green-100">
                <span className="font-medium capitalize">{t.topic_slug.replace(/-/g, " ")}</span>
                <span className="bg-green-200 rounded-full px-1.5 py-0.5 text-xs">{t.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
