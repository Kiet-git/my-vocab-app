// app/admin/import-quiz/page.tsx
"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface QuizQuestion {
  question: string
  correct_answer: string
  options: string[]
  explanation?: string
  topic_slug: string
}

export default function ImportQuizPage() {
  const [mode, setMode] = useState<"ai-from-topic" | "ai-from-words" | "manual">("ai-from-topic")
  const [topicSlug, setTopicSlug] = useState("")
  const [count, setCount] = useState(5)
  const [preview, setPreview] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ success: number; error: number } | null>(null)
  const [manualText, setManualText] = useState("")
  const supabase = createClient()

  const generateFromTopic = async () => {
    if (!topicSlug) return
    setLoading(true)
    setPreview([])

    // Lấy từ vựng của topic
    const { data: words } = await supabase
      .from("words")
      .select("*")
      .eq("topic_slug", topicSlug)
      .limit(30)

    if (!words?.length) {
      alert("Topic này chưa có từ vựng. Hãy import từ vựng trước.")
      setLoading(false)
      return
    }

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate_quiz",
        payload: { words: words.slice(0, 15), count, topic_slug: topicSlug },
      }),
    })
    const data = await res.json()
    if (data.result?.questions) {
      setPreview(data.result.questions.map((q: any) => ({ ...q, topic_slug: topicSlug })))
    } else {
      alert("Không thể tạo câu hỏi. Kiểm tra lại topic hoặc thử lại.")
    }
    setLoading(false)
  }

  const generateFromText = async () => {
    if (!topicSlug || !manualText) return
    setLoading(true)

    // Parse text thành danh sách từ đơn giản
    const lines = manualText.split("\n").filter(l => l.trim())
    const fakeWords = lines.map(l => ({ word: l.trim(), definition: l.trim(), language: "English" }))

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate_quiz",
        payload: { words: fakeWords, count, topic_slug: topicSlug },
      }),
    })
    const data = await res.json()
    if (data.result?.questions) {
      setPreview(data.result.questions.map((q: any) => ({ ...q, topic_slug: topicSlug })))
    }
    setLoading(false)
  }

  const saveAll = async () => {
    if (!preview.length) return
    setSaving(true)
    let success = 0, error = 0

    for (const q of preview) {
      const { error: err } = await supabase.from("quiz_questions").insert({
        topic_slug: q.topic_slug,
        question: q.question,
        correct_answer: q.correct_answer,
        options: q.options,
        explanation: q.explanation,
      })
      if (err) error++; else success++
    }

    setResult({ success, error })
    setSaving(false)
    if (success > 0) setPreview([])
  }

  const editQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    setPreview(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q))
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import câu hỏi quiz nhanh</h1>
        <p className="text-gray-500 text-sm mt-1">AI tự động tạo câu hỏi trắc nghiệm từ từ vựng có sẵn</p>
      </div>

      {/* Mode */}
      <div className="flex gap-2">
        {[
          { id: "ai-from-topic", label: "🤖 AI từ Topic", desc: "Tạo từ từ vựng của topic" },
          { id: "ai-from-words", label: "📝 AI từ danh sách", desc: "Paste danh sách từ tự do" },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id as any)}
            className={`flex-1 p-4 rounded-2xl border-2 text-left transition-all
              ${mode === m.id ? "border-blue-400 bg-blue-50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
            <div className="font-semibold text-sm">{m.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Config */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Topic Slug *</label>
            <input value={topicSlug} onChange={e => setTopicSlug(e.target.value)}
              placeholder="travel, food, sports..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Số câu hỏi</label>
            <input type="number" value={count} onChange={e => setCount(Number(e.target.value))}
              min={1} max={20}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none" />
          </div>
        </div>

        {mode === "ai-from-words" && (
          <div>
            <label className="block text-sm font-medium mb-1">Danh sách từ (mỗi dòng một từ)</label>
            <textarea value={manualText} onChange={e => setManualText(e.target.value)}
              rows={5}
              placeholder={"wanderlust\nfernweh\ndépaysement\nitinerary"}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-400 font-mono text-sm resize-none" />
          </div>
        )}

        <button
          onClick={mode === "ai-from-topic" ? generateFromTopic : generateFromText}
          disabled={loading || !topicSlug}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold disabled:opacity-50 hover:opacity-90">
          {loading ? "🤖 Đang tạo câu hỏi..." : "✨ Tạo câu hỏi với AI"}
        </button>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{preview.length} câu hỏi sẵn sàng</h2>
            <button onClick={saveAll} disabled={saving}
              className="px-6 py-2.5 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50">
              {saving ? "Đang lưu..." : `💾 Lưu tất cả`}
            </button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {preview.map((q, i) => (
              <div key={i} className="p-4 rounded-xl bg-gray-50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-blue-500 shrink-0">Q{i + 1}</span>
                  <input
                    value={q.question}
                    onChange={e => editQuestion(i, "question", e.target.value)}
                    className="flex-1 text-sm font-medium bg-transparent outline-none"
                  />
                  <button onClick={() => setPreview(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-red-400 hover:text-red-600 shrink-0">
                    <span className="material-symbols-rounded text-[16px]">delete</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {q.options.map((opt, j) => (
                    <div key={j} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                      ${opt === q.correct_answer ? "bg-green-100 border border-green-300" : "bg-white border border-gray-200"}`}>
                      <span className="text-xs font-bold text-gray-400">{["A", "B", "C", "D"][j]}</span>
                      <input
                        value={opt}
                        onChange={e => {
                          const newOpts = [...q.options]
                          newOpts[j] = e.target.value
                          editQuestion(i, "options", newOpts)
                        }}
                        className="flex-1 bg-transparent outline-none text-sm"
                      />
                      <button onClick={() => editQuestion(i, "correct_answer", opt)}
                        className={`text-xs ${opt === q.correct_answer ? "text-green-600 font-bold" : "text-gray-300 hover:text-green-500"}`}>
                        ✓
                      </button>
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <p className="text-xs text-gray-400 italic mt-1">💡 {q.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-2xl p-4 bg-green-50 border border-green-200">
          <p className="font-semibold">✅ Đã lưu {result.success} câu hỏi{result.error > 0 ? ` (${result.error} lỗi)` : ""}</p>
        </div>
      )}
    </div>
  )
}
