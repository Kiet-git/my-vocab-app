// app/admin/topics/page.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Topic {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  difficulty: string
  is_published: boolean
  sort_order: number
}

interface Word {
  id: string
  word: string
  language: string
  definition: string
  example_sentence: string
  icon: string
  pronunciation?: string
  difficulty?: string
}

type Panel = "topics" | "words"

const EMPTY_TOPIC: Omit<Topic, "id"> = {
  slug: "", name: "", description: "", icon: "📚",
  difficulty: "beginner", is_published: true, sort_order: 0,
}

const EMPTY_WORD: Omit<Word, "id"> & { topic_slug: string } = {
  word: "", language: "English", definition: "",
  example_sentence: "", icon: "📖", pronunciation: "",
  difficulty: "beginner", topic_slug: "",
}

export default function AdminTopicsPage() {
  const [panel, setPanel] = useState<Panel>("topics")
  const [topics, setTopics] = useState<Topic[]>([])
  const [words, setWords] = useState<Word[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [editingTopic, setEditingTopic] = useState<Partial<Topic> | null>(null)
  const [editingWord, setEditingWord] = useState<Partial<Word> & { topic_slug?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchWord, setSearchWord] = useState("")
  const supabase = createClient()

  // Load topics
  useEffect(() => {
    loadTopics()
  }, [])

  // Load words when topic selected
  useEffect(() => {
    if (selectedTopic) loadWords(selectedTopic.slug)
  }, [selectedTopic])

  const loadTopics = async () => {
    setLoading(true)
    const { data } = await supabase.from("topics").select("*").order("sort_order")
    setTopics(data || [])
    setLoading(false)
  }

  const loadWords = async (slug: string) => {
    const { data } = await supabase.from("words").select("*").eq("topic_slug", slug).order("created_at")
    setWords(data || [])
  }

  // ---- TOPIC CRUD ----
  const saveTopic = async () => {
    if (!editingTopic) return
    setSaving(true)
    if (editingTopic.id) {
      await supabase.from("topics").update(editingTopic).eq("id", editingTopic.id)
    } else {
      await supabase.from("topics").insert(editingTopic)
    }
    setEditingTopic(null)
    await loadTopics()
    setSaving(false)
  }

  const deleteTopic = async (id: string) => {
    if (!confirm("Xóa topic này? Từ vựng thuộc topic sẽ bị ảnh hưởng.")) return
    await supabase.from("topics").delete().eq("id", id)
    if (selectedTopic?.id === id) setSelectedTopic(null)
    await loadTopics()
  }

  const togglePublish = async (t: Topic) => {
    await supabase.from("topics").update({ is_published: !t.is_published }).eq("id", t.id)
    setTopics(prev => prev.map(x => x.id === t.id ? { ...x, is_published: !x.is_published } : x))
  }

  // ---- WORD CRUD ----
  const saveWord = async () => {
    if (!editingWord || !selectedTopic) return
    setSaving(true)
    const payload = { ...editingWord, topic_slug: selectedTopic.slug }
    if ((editingWord as any).id) {
      await supabase.from("words").update(payload).eq("id", (editingWord as any).id)
    } else {
      await supabase.from("words").insert(payload)
    }
    setEditingWord(null)
    await loadWords(selectedTopic.slug)
    setSaving(false)
  }

  const deleteWord = async (id: string) => {
    if (!confirm("Xóa từ này?")) return
    await supabase.from("words").delete().eq("id", id)
    if (selectedTopic) await loadWords(selectedTopic.slug)
  }

  const filteredWords = words.filter(w =>
    w.word.toLowerCase().includes(searchWord.toLowerCase()) ||
    w.definition.toLowerCase().includes(searchWord.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  )

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý Topics & Từ vựng</h1>
        <div className="flex gap-2">
          {(["topics", "words"] as Panel[]).map(p => (
            <button key={p} onClick={() => setPanel(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${panel === p ? "bg-blue-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-blue-200"}`}>
              {p === "topics" ? "📁 Topics" : "📝 Từ vựng"}
            </button>
          ))}
        </div>
      </div>

      {/* ===== TOPICS PANEL ===== */}
      {panel === "topics" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setEditingTopic({ ...EMPTY_TOPIC })}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600">
              <span className="material-symbols-rounded text-[18px]">add</span>
              Thêm Topic
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topics.map(t => (
              <div key={t.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm transition-all
                  ${selectedTopic?.id === t.id ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-100 hover:border-gray-200"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-3xl">{t.icon}</span>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{t.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{t.slug}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{t.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => togglePublish(t)}
                      className={`text-xs px-2 py-1 rounded-full font-medium
                        ${t.is_published ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                      {t.is_published ? "Hiện" : "Ẩn"}
                    </button>
                    <button onClick={() => { setSelectedTopic(t); setPanel("words") }}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500" title="Xem từ vựng">
                      <span className="material-symbols-rounded text-[18px]">list</span>
                    </button>
                    <button onClick={() => setEditingTopic(t)}
                      className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400">
                      <span className="material-symbols-rounded text-[18px]">edit</span>
                    </button>
                    <button onClick={() => deleteTopic(t.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                      <span className="material-symbols-rounded text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{t.difficulty}</span>
                  <span className="text-xs text-gray-400">Thứ tự: {t.sort_order}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== WORDS PANEL ===== */}
      {panel === "words" && (
        <div className="space-y-4">
          {/* Topic selector */}
          <div className="flex items-center gap-3">
            <select
              value={selectedTopic?.slug || ""}
              onChange={e => {
                const t = topics.find(x => x.slug === e.target.value)
                setSelectedTopic(t || null)
              }}
              className="px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400 flex-1">
              <option value="">-- Chọn Topic --</option>
              {topics.map(t => <option key={t.slug} value={t.slug}>{t.icon} {t.name}</option>)}
            </select>
            {selectedTopic && (
              <>
                <input value={searchWord} onChange={e => setSearchWord(e.target.value)}
                  placeholder="Tìm từ..."
                  className="px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400 w-48" />
                <button
                  onClick={() => setEditingWord({ ...EMPTY_WORD, topic_slug: selectedTopic.slug })}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 shrink-0">
                  <span className="material-symbols-rounded text-[18px]">add</span>
                  Thêm từ
                </button>
              </>
            )}
          </div>

          {selectedTopic ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-sm font-medium">{filteredWords.length} từ trong "{selectedTopic.name}"</span>
              </div>
              <div className="divide-y divide-gray-50">
                {filteredWords.map(w => (
                  <div key={w.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
                    <span className="text-xl shrink-0">{w.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{w.word}</span>
                        <span className="text-xs bg-blue-50 text-blue-500 rounded-full px-2 py-0.5">{w.language}</span>
                        {w.difficulty && <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{w.difficulty}</span>}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{w.definition}</p>
                      {w.pronunciation && <p className="text-xs text-gray-400">/{w.pronunciation}/</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingWord(w)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                        <span className="material-symbols-rounded text-[18px]">edit</span>
                      </button>
                      <button onClick={() => deleteWord(w.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                        <span className="material-symbols-rounded text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
                {filteredWords.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    {words.length === 0 ? "Chưa có từ vựng nào. Nhấn \"Thêm từ\" hoặc dùng Import." : "Không tìm thấy từ"}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">Chọn một topic để xem và quản lý từ vựng</div>
          )}
        </div>
      )}

      {/* ===== TOPIC EDIT MODAL ===== */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditingTopic(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold">{editingTopic.id ? "Chỉnh sửa Topic" : "Thêm Topic mới"}</h2>
            {[
              { key: "slug", label: "Slug *", placeholder: "travel" },
              { key: "name", label: "Tên hiển thị *", placeholder: "Travel" },
              { key: "icon", label: "Icon (emoji)", placeholder: "✈️" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium mb-1">{f.label}</label>
                <input value={(editingTopic as any)[f.key] || ""} placeholder={f.placeholder}
                  onChange={e => setEditingTopic(p => ({ ...p!, [f.key]: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-1">Mô tả</label>
              <textarea value={editingTopic.description || ""} rows={2}
                onChange={e => setEditingTopic(p => ({ ...p!, description: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Độ khó</label>
                <select value={editingTopic.difficulty || "beginner"}
                  onChange={e => setEditingTopic(p => ({ ...p!, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none">
                  <option value="beginner">Cơ bản</option>
                  <option value="intermediate">Trung cấp</option>
                  <option value="advanced">Nâng cao</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thứ tự hiển thị</label>
                <input type="number" value={editingTopic.sort_order || 0}
                  onChange={e => setEditingTopic(p => ({ ...p!, sort_order: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editingTopic.is_published ?? true}
                onChange={e => setEditingTopic(p => ({ ...p!, is_published: e.target.checked }))}
                className="w-4 h-4 accent-blue-500" />
              <span className="text-sm font-medium">Hiển thị cho người dùng</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingTopic(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={saveTopic} disabled={saving}
                className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-50">
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== WORD EDIT MODAL ===== */}
      {editingWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditingWord(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold">{(editingWord as any).id ? "Chỉnh sửa từ" : "Thêm từ mới"}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Từ *</label>
                <input value={editingWord.word || ""} placeholder="wanderlust"
                  onChange={e => setEditingWord(p => ({ ...p!, word: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ngôn ngữ</label>
                <select value={editingWord.language || "English"}
                  onChange={e => setEditingWord(p => ({ ...p!, language: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none">
                  {["English", "French", "German", "Spanish", "Japanese", "Korean", "Chinese"].map(l => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Định nghĩa *</label>
              <textarea value={editingWord.definition || ""} rows={2}
                onChange={e => setEditingWord(p => ({ ...p!, definition: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Câu ví dụ *</label>
              <textarea value={editingWord.example_sentence || ""} rows={2}
                onChange={e => setEditingWord(p => ({ ...p!, example_sentence: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-400 resize-none" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Icon (emoji)</label>
                <input value={editingWord.icon || ""}
                  onChange={e => setEditingWord(p => ({ ...p!, icon: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-center text-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phiên âm</label>
                <input value={editingWord.pronunciation || ""} placeholder="/ˈwɒndə/"
                  onChange={e => setEditingWord(p => ({ ...p!, pronunciation: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Độ khó</label>
                <select value={(editingWord as any).difficulty || "beginner"}
                  onChange={e => setEditingWord(p => ({ ...p!, difficulty: e.target.value } as any))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none">
                  <option value="beginner">Cơ bản</option>
                  <option value="intermediate">Trung cấp</option>
                  <option value="advanced">Nâng cao</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingWord(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={saveWord} disabled={saving}
                className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-50">
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
