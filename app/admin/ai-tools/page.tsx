// app/admin/ai-tools/page.tsx
"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Tool = "generate_vocab" | "generate_quiz" | "analyze_platform" | "content_suggestions"

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState<Tool>("generate_vocab")
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<any>(null)
  const supabase = createClient()

  // States cho từng tool
  const [vocabConfig, setVocabConfig] = useState({ topic: "", topicSlug: "", language: "English", count: 10, difficulty: "beginner" })
  const [quizTopic, setQuizTopic] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState("")

  const callAI = async (action: string, payload: any) => {
    setLoading(true)
    setOutput(null)
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      })
      const data = await res.json()
      setOutput(data)
    } catch (e) {
      setOutput({ error: "Lỗi kết nối AI" })
    }
    setLoading(false)
  }

  const saveVocabToDb = async () => {
    if (!output?.result?.words) return
    setSaving(true)
    let success = 0
    for (const w of output.result.words) {
      const { error } = await supabase.from("words").insert({
        topic_slug: vocabConfig.topicSlug,
        word: w.word,
        language: w.language,
        definition: w.definition,
        example_sentence: w.example_sentence,
        icon: w.icon,
        pronunciation: w.pronunciation,
        difficulty: w.difficulty,
      })
      if (!error) success++
    }
    setSaveResult(`✅ Đã lưu ${success}/${output.result.words.length} từ vào database`)
    setSaving(false)
  }

  const tools = [
    { id: "generate_vocab", label: "Tạo từ vựng", icon: "translate", color: "blue" },
    { id: "generate_quiz", label: "Tạo câu hỏi", icon: "quiz", color: "purple" },
    { id: "content_suggestions", label: "Gợi ý nội dung", icon: "lightbulb", color: "amber" },
  ]

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Tools cho Admin</h1>
        <p className="text-gray-500 text-sm mt-1">Sử dụng Claude AI để tạo nội dung và phân tích dữ liệu</p>
      </div>

      {/* Tool selector */}
      <div className="flex gap-3">
        {tools.map(t => (
          <button key={t.id} onClick={() => { setActiveTool(t.id as Tool); setOutput(null); setSaveResult("") }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${activeTool === t.id ? "bg-blue-500 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:border-blue-200"}`}>
            <span className="material-symbols-rounded text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Generate Vocab */}
      {activeTool === "generate_vocab" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="font-semibold">🤖 Tạo từ vựng bằng AI</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Chủ đề mô tả</label>
              <input value={vocabConfig.topic} onChange={e => setVocabConfig(p => ({ ...p, topic: e.target.value }))}
                placeholder="VD: Từ vựng về cảm xúc và tâm trạng"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Topic Slug để lưu</label>
              <input value={vocabConfig.topicSlug} onChange={e => setVocabConfig(p => ({ ...p, topicSlug: e.target.value }))}
                placeholder="emotions"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngôn ngữ</label>
              <select value={vocabConfig.language} onChange={e => setVocabConfig(p => ({ ...p, language: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none">
                {["English", "French", "German", "Spanish", "Japanese", "Korean"].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số lượng từ</label>
              <input type="number" value={vocabConfig.count} min={1} max={30}
                onChange={e => setVocabConfig(p => ({ ...p, count: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none" />
            </div>
          </div>
          <button onClick={() => callAI("generate_vocab", { topic: vocabConfig.topic, language: vocabConfig.language, count: vocabConfig.count, difficulty: vocabConfig.difficulty })}
            disabled={loading || !vocabConfig.topic}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold disabled:opacity-50">
            {loading ? "Đang tạo..." : "✨ Tạo từ vựng"}
          </button>

          {output?.result?.words && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-green-600">✅ Tạo được {output.result.words.length} từ</p>
                <button onClick={saveVocabToDb} disabled={saving || !vocabConfig.topicSlug}
                  className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50">
                  {saving ? "Đang lưu..." : "💾 Lưu vào DB"}
                </button>
              </div>
              {saveResult && <p className="text-sm text-green-600">{saveResult}</p>}
              <div className="max-h-64 overflow-y-auto space-y-1">
                {output.result.words.map((w: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg text-sm">
                    <span className="text-xl">{w.icon}</span>
                    <span className="font-medium">{w.word}</span>
                    <span className="text-gray-400 text-xs">{w.language}</span>
                    <span className="text-gray-500 flex-1 truncate">{w.definition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Quiz */}
      {activeTool === "generate_quiz" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="font-semibold">📝 Tạo câu hỏi quiz bằng AI</h2>
          <p className="text-sm text-gray-500">Lấy từ vựng từ topic và tạo bộ câu hỏi trắc nghiệm tự động</p>
          <input value={quizTopic} onChange={e => setQuizTopic(e.target.value)}
            placeholder="Topic slug (VD: travel)"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400" />
          <button onClick={async () => {
            if (!quizTopic) return
            const { data: words } = await supabase.from("words").select("*").eq("topic_slug", quizTopic).limit(20)
            if (!words?.length) { alert("Không có từ vựng trong topic này"); return }
            callAI("generate_quiz", { words, count: 8, topic_slug: quizTopic })
          }} disabled={loading || !quizTopic}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold disabled:opacity-50">
            {loading ? "Đang tạo..." : "✨ Tạo câu hỏi"}
          </button>
          {output?.result?.questions && (
            <p className="text-sm text-green-600">✅ Tạo được {output.result.questions.length} câu hỏi. Dùng trang Import Quiz để lưu.</p>
          )}
        </div>
      )}

      {/* Content suggestions */}
      {activeTool === "content_suggestions" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="font-semibold">💡 Gợi ý nội dung mới</h2>
          <p className="text-sm text-gray-500">AI gợi ý các topic và từ vựng mới nên thêm vào hệ thống</p>
          <button onClick={() => callAI("chat", { message: "Gợi ý 5 chủ đề từ vựng tiếng Anh mới, thú vị và thực tế để thêm vào ứng dụng học từ vựng. Với mỗi chủ đề, mô tả ngắn gọn và liệt kê 3 từ mẫu.", history: [] })}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-xl font-semibold disabled:opacity-50">
            {loading ? "Đang phân tích..." : "💡 Gợi ý topic mới"}
          </button>
          {output?.result && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{output.result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
