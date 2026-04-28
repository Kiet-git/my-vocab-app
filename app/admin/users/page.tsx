// app/admin/users/page.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  email: string
  role: string
  created_at: string
  quiz_count?: number
  words_learned?: number
  last_active?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      // Lấy danh sách users từ profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, role, created_at")
        .order("created_at", { ascending: false })

      if (!profiles) { setLoading(false); return }

      // Lấy thêm thống kê cho từng user
      const enriched = await Promise.all(profiles.map(async p => {
        const [{ count: qCount }, streakRes] = await Promise.all([
          supabase.from("quiz_results").select("id", { count: "exact", head: true }).eq("user_id", p.id),
          supabase.from("user_streaks").select("total_words_learned, updated_at").eq("user_id", p.id).single(),
        ])
        return {
          ...p,
          quiz_count: qCount || 0,
          words_learned: streakRes.data?.total_words_learned || 0,
          last_active: streakRes.data?.updated_at,
        }
      }))

      setUsers(enriched)
      setLoading(false)
    }
    load()
  }, [supabase])

  const updateRole = async (userId: string, newRole: string) => {
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"/>
    </div>
  )

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
          <p className="text-gray-500 text-sm">{users.length} người dùng</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo email..."
          className="px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-blue-400 w-64"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["Email", "Role", "Quiz đã làm", "Từ đã học", "Lần cuối active", ""].map((h, i) => (
                <th key={i} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white text-sm font-bold">
                      {user.email?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-sm font-medium truncate max-w-[200px]">{user.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.role || "user"}
                    onChange={e => updateRole(user.id, e.target.value)}
                    className={`text-xs font-medium rounded-full px-2 py-1 border outline-none cursor-pointer
                      ${user.role === "admin" ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.quiz_count}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.words_learned}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {user.last_active ? new Date(user.last_active).toLocaleDateString("vi-VN") : "Chưa hoạt động"}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-300">
                    {new Date(user.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">Không tìm thấy người dùng</div>
        )}
      </div>
    </div>
  )
}
