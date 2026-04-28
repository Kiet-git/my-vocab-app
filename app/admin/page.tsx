// app/admin/page.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function AdminPage() {
  const [stats, setStats] = useState({ users: 0, words: 0, topics: 0, quizzes: 0, aiCalls: 0 })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const [statsRpc, w, t, q, ai] = await Promise.all([
        supabase.rpc("get_admin_stats").single(),
        supabase.from("words").select("id", { count: "exact", head: true }),
        supabase.from("topics").select("id", { count: "exact", head: true }),
        supabase.from("quiz_results").select("id", { count: "exact", head: true }),
        supabase.from("ai_usage_logs").select("id", { count: "exact", head: true }),
      ])
      setStats({
        users: (statsRpc.data as any)?.total_users || 0,
        words: w.count || 0,
        topics: t.count || 0,
        quizzes: q.count || 0,
        aiCalls: ai.count || 0,
      })

      const { data: activity } = await supabase
        .from("quiz_results")
        .select("topic_slug, score, total_questions, created_at")
        .order("created_at", { ascending: false })
        .limit(5)
      setRecentActivity(activity || [])
    }
    load()
  }, [supabase])

  const quickLinks = [
    { href: "/admin/import-vocab", icon: "upload", label: "Import từ vựng", color: "blue", desc: "Thêm từ vựng mới" },
    { href: "/admin/import-quiz", icon: "quiz", label: "Import quiz", color: "purple", desc: "Tạo câu hỏi trắc nghiệm" },
    { href: "/admin/ai-tools", icon: "smart_toy", label: "AI Tools", color: "indigo", desc: "Dùng AI tạo nội dung" },
    { href: "/admin/stats", icon: "bar_chart", label: "Thống kê", color: "green", desc: "Xem báo cáo chi tiết" },
    { href: "/admin/topics", icon: "folder", label: "Topics", color: "amber", desc: "Quản lý chủ đề" },
    { href: "/admin/users", icon: "group", label: "Users", color: "red", desc: "Quản lý người dùng" },
  ]

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tổng quan Admin</h1>
        <p className="text-gray-500 text-sm mt-1">Chào mừng đến với trang quản trị Lucid Polyglot</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Người dùng", value: stats.users, icon: "group" },
          { label: "Từ vựng", value: stats.words, icon: "translate" },
          { label: "Topics", value: stats.topics, icon: "folder" },
          { label: "Quiz làm", value: stats.quizzes, icon: "quiz" },
          { label: "AI calls", value: stats.aiCalls, icon: "smart_toy" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <span className="material-symbols-rounded text-[20px] text-blue-400">{s.icon}</span>
            <div className="text-2xl font-bold mt-1">{s.value.toLocaleString()}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Truy cập nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickLinks.map(link => (
            <Link key={link.href} href={link.href}
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group">
              <div className={`w-10 h-10 rounded-xl bg-${link.color}-50 flex items-center justify-center`}>
                <span className={`material-symbols-rounded text-${link.color}-500 text-[20px]`}>{link.icon}</span>
              </div>
              <div>
                <div className="font-semibold text-sm">{link.label}</div>
                <div className="text-xs text-gray-400">{link.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Hoạt động gần đây</h2>
          <div className="space-y-2">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-1.5">
                <span className="material-symbols-rounded text-[16px] text-gray-300">quiz</span>
                <span>Ai đó vừa làm quiz <span className="font-medium capitalize">{a.topic_slug.replace(/-/g, " ")}</span></span>
                <span className={`ml-auto font-medium ${a.score / a.total_questions >= 0.8 ? "text-green-500" : "text-amber-500"}`}>
                  {a.score}/{a.total_questions}
                </span>
                <span className="text-xs text-gray-300">{new Date(a.created_at).toLocaleTimeString("vi-VN")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
