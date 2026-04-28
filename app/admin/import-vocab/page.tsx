// app/admin/import-vocab/page.tsx
"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface WordPreview {
  word: string
  language: string
  definition: string
  example_sentence: string
  icon: string
  pronunciation?: string
  difficulty?: string
  topic_slug: string
}

export default function ImportVocabPage() {
  const [mode, setMode] = useState<"json" | "ai">("ai")
  const [topicSlug, setTopicSlug] = useState("")
  const [jsonInput, setJsonInput] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [language, setLanguage] = useState("English")
  const [count, setCount] = useState(10)
  const [difficulty, setDifficulty] = useState("beginner")
  const [preview, setPreview] = useState<WordPreview[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ success: number; error: number } | null>(null)
  const supabase = createClient()

  const generateWithAI = async () => {
    if (!topicSlug || !aiPrompt) return
    setLoading(true)
    setPreview([])
    setResult(null)

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate_vocab",
        payload: { topic: aiPrompt, language, count, difficulty, topic_slug: topicSlug },
      }),
    })
    const data = await res.json()
    if (data.result?.words) {
      setPreview(data.result.words.map((w: any) => ({ ...w, topic_slug: topicSlug })))
    } else {
      alert("AI không thể tạo từ vựng. Thử lại với prompt khác.")
    }
    setLoading(false)
  }

  const parseJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      const words = Array.isArray(parsed) ? parsed : parsed.words
      if (!Array.isArray(words)) throw new Error("Cần mảng words")
      setPreview(words.map((w: any) => ({ ...w, topic_slug: topicSlug || w.topic_slug })))
    } catch (e) {
      alert("JSON không hợp lệ: " + (e as Error).message)
    }
  }

  const saveAll = async () => {
    if (!preview.length) return
    setSaving(true)
    let success = 0, error = 0

    for (const word of preview) {
      const { error: err } = await supabase.from("words").insert({
        topic_slug: word.topic_slug,
        word: word.word,
        language: word.language,
        definition: word.definition,
        example_sentence: word.example_sentence,
        icon: word.icon,
        pronunciation: word.pronunciation,
        difficulty: word.difficulty,
      })
      if (err) error++; else success++
    }

    setResult({ success, error })
    setSaving(false)
    if (success > 0) setPreview([])
  }

  const removeWord = (index: number) => {
    setPreview(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import từ vựng nhanh</h1>
        <p className="text-gray-500 text-sm mt-1">Dùng AI tạo tự động hoặc paste JSON để import hàng loạt</p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2">
        {[
          { id: "ai", label: "🤖 AI tạo tự động", desc: "Nhập chủ đề, AI tạo từ vựng" },
          { id: "json", label: "📄 Paste JSON", desc: "Import từ file JSON sẵn có" },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id as any)}
            className={`flex-1 p-4 rounded-2xl border-2 text-left transition-all
              ${mode === m.id ? "border-blue-400 bg-blue-50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
            <div className="font-semibold text-sm">{m.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Topic slug */}
      <div>
        <label className="block text-sm font-medium mb-1">Topic Slug *</label>
        <input
          value={topicSlug}
          onChange={e => setTopicSlug(e.target.value)}
          placeholder="travel, food, sports, ..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400"
        />
      </div>

      {/* AI mode */}
      {mode === "ai" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold flex items-center gap-2">
            <span className="material-symbols-rounded text-blue-500 text-[20px]">smart_toy</span>
            Cấu hình AI
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1">Chủ đề / Mô tả từ vựng muốn tạo</label>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              rows={2}
              placeholder="VD: Từ vựng về du lịch tại sân bay và khách sạn"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400 resize-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ngôn ngữ</label>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none">
                {["English", "French", "German", "Spanish", "Japanese", "Korean", "Chinese"].map(l => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số lượng</label>
              <input type="number" value={count} onChange={e => setCount(Number(e.target.value))}
                min={1} max={30}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Độ khó</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none">
                <option value="beginner">Cơ bản</option>
                <option value="intermediate">Trung cấp</option>
                <option value="advanced">Nâng cao</option>
              </select>
            </div>
          </div>
          <button onClick={generateWithAI} disabled={loading || !topicSlug || !aiPrompt}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity">
            {loading ? "🤖 Đang tạo..." : "✨ Tạo từ vựng với AI"}
          </button>
        </div>
      )}

      {/* JSON mode */}
      {mode === "json" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold">Paste JSON</h2>
          <p className="text-xs text-gray-400">Format: {`[{"word": "...", "language": "...", "definition": "...", "example_sentence": "...", "icon": "..."}]`}</p>
          <textarea
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
            rows={8}
            placeholder='[{"word": "Wanderlust", "language": "German", ...}]'
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-400 font-mono text-sm resize-none"
          />
          <button onClick={parseJSON} className="px-6 py-2.5 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700">
            Parse & Preview
          </button>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{preview.length} từ sẵn sàng import</h2>
            <button onClick={saveAll} disabled={saving}
              className="px-6 py-2.5 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50">
              {saving ? "Đang lưu..." : `💾 Lưu tất cả (${preview.length})`}
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {preview.map((w, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 group">
                <span className="text-2xl">{w.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{w.word}</span>
                    <span className="text-xs bg-blue-100 text-blue-600 rounded-full px-2 py-0.5">{w.language}</span>
                    {w.difficulty && (
                      <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{w.difficulty}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{w.definition}</p>
                  <p className="text-xs text-gray-400 italic mt-0.5">{w.example_sentence}</p>
                </div>
                <button onClick={() => removeWord(i)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                  <span className="material-symbols-rounded text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-2xl p-4 ${result.error === 0 ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
          <p className="font-semibold">
            ✅ Đã lưu {result.success} từ{result.error > 0 ? ` (${result.error} lỗi)` : ""}
          </p>
        </div>
      )}
    </div>
  )
}
