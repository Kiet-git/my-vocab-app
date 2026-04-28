// components/AIAssistant.tsx
// Component AI trợ lý học từ vựng cho người dùng
"use client"

import { useState, useRef, useEffect } from "react"
import { AudioButton } from "./AudioButton"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface AIAssistantProps {
  wordContext?: { word: string; language: string; definition: string } // context từ đang xem
  topicSlug?: string
}

export function AIAssistant({ wordContext, topicSlug }: AIAssistantProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"chat" | "explain">("chat")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Tự động giải thích từ đang xem
  useEffect(() => {
    if (open && wordContext && messages.length === 0) {
      handleExplainWord()
    }
  }, [open, wordContext])

  const handleExplainWord = async () => {
    if (!wordContext) return
    setLoading(true)
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "explain_word",
        payload: { word: wordContext.word, language: wordContext.language },
      }),
    })
    const data = await res.json()
    setMessages([{ role: "assistant", content: data.result }])
    setLoading(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: "user", content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "chat",
        payload: {
          message: input,
          history: messages,
          topic_slug: topicSlug,
        },
      }),
    })
    const data = await res.json()
    setMessages([...newMessages, { role: "assistant", content: data.result }])
    setLoading(false)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full px-5 py-3 shadow-lg hover:shadow-xl transition-all hover:scale-105 font-medium"
      >
        <span className="material-symbols-rounded text-[20px]">smart_toy</span>
        AI Trợ lý
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
            style={{ width: "min(420px, 95vw)", height: "min(600px, 85vh)" }}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded">smart_toy</span>
                <span className="font-semibold">AI Trợ lý Học từ vựng</span>
              </div>
              <button onClick={() => setOpen(false)} className="hover:bg-white/20 rounded-full p-1">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            {/* Quick actions */}
            {wordContext && (
              <div className="flex gap-2 px-4 py-2 border-b border-gray-100 bg-blue-50/50">
                <button
                  onClick={handleExplainWord}
                  className="text-xs bg-white border border-blue-200 text-blue-600 rounded-full px-3 py-1 hover:bg-blue-50"
                >
                  🔍 Giải thích "{wordContext.word}"
                </button>
                <button
                  onClick={() => {
                    setInput(`Tạo 5 câu ví dụ với từ "${wordContext.word}"`)
                    sendMessage()
                  }}
                  className="text-xs bg-white border border-green-200 text-green-600 rounded-full px-3 py-1 hover:bg-green-50"
                >
                  ✏️ Ví dụ câu
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && !loading && (
                <div className="text-center text-gray-400 text-sm py-8">
                  <div className="text-4xl mb-2">💬</div>
                  <p>Xin chào! Tôi có thể giúp bạn:</p>
                  <p className="mt-1 text-xs">• Giải thích nghĩa từ vựng</p>
                  <p className="text-xs">• Tạo câu ví dụ</p>
                  <p className="text-xs">• Gợi ý cách học hiệu quả</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === "user"
                      ? "bg-blue-500 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Hỏi về từ vựng..."
                className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-sm border border-gray-200 outline-none focus:border-blue-300"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="bg-blue-500 text-white rounded-full p-2.5 hover:bg-blue-600 disabled:opacity-40 transition-colors"
              >
                <span className="material-symbols-rounded text-[18px]">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
