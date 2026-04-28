// app/admin/stats/page.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface DailyActivity {
  date: string
  quizzes: number
  words_learned: number
}

interface TopicStat {
  topic_slug: string
  quiz_count: number
  avg_score: number
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<any>(null)
  const [daily, setDaily] = useState<DailyActivity[]>([])
  const [topicStats, setTopicStats] = useState<TopicStat[]>([])
  const [aiUsage, setAiUsage] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      // Tổng quan — gọi RPC function thay vì query trực tiếp auth.users (bảo mật hơn)
      const [statsRpc, wordsRes, topicsRes, quizRes, progressRes] = await Promise.all([
        supabase.rpc("get_admin_stats").single(),
        supabase.from("words").select("id", { count: "exact", head: true }),
        supabase.from("topics").select("id", { count: "exact", head: true }),
        supabase.from("quiz_results").select("id", { count: "exact", head: true }),
        supabase.from("user_progress").select("id", { count: "exact", head: true }).eq("status", "mastered"),
      ])

      setStats({
        total_users: (statsRpc.data as any)?.total_users || 0,
        total_words: wordsRes.count || 0,
        total_topics: topicsRes.count || 0,
        total_quizzes: quizRes.count || 0,
        total_mastered: progressRes.count || 0,
      })

      // Quiz theo topic
      const { data: quizData } = await supabase
        .from("quiz_results")
        .select("topic_slug, score, total_questions")
        .order("created_at", { ascending: false })
        .limit(200)

      if (quizData) {
        const grouped: Record<string, { total: number; sum: number }> = {}
        quizData.forEach(q => {
          if (!grouped[q.topic_slug]) grouped[q.topic_slug] = { total: 0, sum: 0 }
          grouped[q.topic_slug].total++
          grouped[q.topic_slug].sum += Math.round((q.score / q.total_questions) * 100)
        })
        setTopicStats(
          Object.entries(grouped).map(([topic_slug, v]) => ({
            topic_slug,
            quiz_count: v.total,
            avg_score: Math.round(v.sum / v.total),
          })).sort((a, b) => b.quiz_count - a.quiz_count)
        )
      }

      // AI usage
      const { data: aiData } = await supabase
        .from("ai_usage_logs")
        .select("action_type, created_at, input_tokens, output_tokens")
        .order("created_at", { ascending: false })
        .limit(100)
      if (aiData) setAiUsage(aiData)

      // Daily activity (7 ngày)
      const days: DailyActivity[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().slice(0, 10)
        const { count: qCount } = await supabase
          .from("quiz_results")
          .select("id", { count: "exact", head: true })
          .gte("created_at", `${dateStr}T00:00:00`)
          .lte("created_at", `${dateStr}T23:59:59`)
        const { count: wCount } = await supabase
          .from("user_progress")
          .select("id", { count: "exact", head: true })
          .eq("status", "mastered")
          .gte("last_reviewed_at", `${dateStr}T00:00:00`)
        days.push({ date: dateStr, quizzes: qCount || 0, words_learned: wCount || 0 })
      }
      setDaily(days)
    }
    load()
  }, [supabase])

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"/>
    </div>
  )

  const maxQuizzes = Math.max(...daily.map(d => d.quizzes), 1)

  return (
    <div className="space-y-8 max-w-5xl">
      <h1 className="text-2xl font-bold">Thống kê hệ thống</h1>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Người dùng", value: stats.total_users, icon: "group", color: "blue" },
          { label: "Từ vựng", value: stats.total_words, icon: "translate", color: "indigo" },
          { label: "Topics", value: stats.total_topics, icon: "folder", color: "purple" },
          { label: "Quiz đã làm", value: stats.total_quizzes, icon: "quiz", color: "green" },
          { label: "Từ đã thuộc", value: stats.total_mastered, icon: "star", color: "yellow" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className={`material-symbols-rounded text-[20px] text-${s.color}-500 mb-2`}>{s.icon}</div>
            <div className="text-2xl font-bold">{s.value.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Daily activity chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-semibold mb-4">Hoạt động 7 ngày qua</h2>
        <div className="flex items-end gap-3 h-40">
          {daily.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-xs text-gray-400">{d.quizzes}</div>
              <div
                className="w-full bg-blue-400 rounded-t-lg transition-all"
                style={{ height: `${(d.quizzes / maxQuizzes) * 100}%`, minHeight: "4px" }}
              />
              <div className="text-xs text-gray-400 text-center">
                {new Date(d.date).toLocaleDateString("vi-VN", { weekday: "short" })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-400 rounded inline-block"/>Số quiz</span>
        </div>
      </div>

      {/* Topic performance */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-semibold mb-4">Hiệu suất theo Topic</h2>
        <div className="space-y-3">
          {topicStats.map((t, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-32 text-sm font-medium capitalize truncate">{t.topic_slug.replace(/-/g, " ")}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${t.avg_score >= 80 ? "bg-green-400" : t.avg_score >= 60 ? "bg-yellow-400" : "bg-red-400"}`}
                  style={{ width: `${t.avg_score}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 w-20 text-right">{t.avg_score}% avg</span>
              <span className="text-xs text-gray-400 w-16 text-right">{t.quiz_count} lần</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI usage */}
      {aiUsage.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Sử dụng AI gần đây</h2>
          <div className="space-y-2">
            {aiUsage.slice(0, 10).map((log, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50">
                <span className="font-medium text-blue-600">{log.action_type}</span>
                <span className="text-gray-400">{log.input_tokens + log.output_tokens} tokens</span>
                <span className="text-gray-400 text-xs">{new Date(log.created_at).toLocaleString("vi-VN")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
