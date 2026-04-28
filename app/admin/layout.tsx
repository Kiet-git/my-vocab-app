// app/admin/layout.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/admin", label: "Tổng quan", icon: "dashboard" },
  { href: "/admin/stats", label: "Thống kê", icon: "bar_chart" },
  { href: "/admin/topics", label: "Topics & Từ vựng", icon: "folder" },
  { href: "/admin/import-vocab", label: "Import từ vựng", icon: "upload" },
  { href: "/admin/import-quiz", label: "Import câu hỏi", icon: "quiz" },
  { href: "/admin/ai-tools", label: "AI Tools", icon: "smart_toy" },
  { href: "/admin/users", label: "Người dùng", icon: "group" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col py-6 px-3 gap-1 fixed left-0 top-0 bottom-0 z-40">
        <div className="px-3 mb-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-blue-600">Lucid Polyglot</span>
          </Link>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Admin Panel</span>
        </div>
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
              <span className="material-symbols-rounded text-[20px]">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
        <div className="mt-auto px-3">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600">
            <span className="material-symbols-rounded text-[16px]">arrow_back</span>
            Về trang chủ
          </Link>
        </div>
      </aside>
      <main className="flex-1 ml-60 p-8">{children}</main>
    </div>
  )
}
