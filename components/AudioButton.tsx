// components/AudioButton.tsx
"use client"

import { useState } from "react"

interface AudioButtonProps {
  text: string
  lang?: string
  className?: string
}

export function AudioButton({ text, lang = "en-US", className = "" }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false)

  const speak = (e: React.MouseEvent) => {
    e.stopPropagation() // Ngăn event bubble lên card (tránh lật thẻ khi bấm nghe)
    if (!("speechSynthesis" in window)) {
      alert("Trình duyệt không hỗ trợ phát âm")
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.85
    utterance.pitch = 1
    utterance.onstart = () => setPlaying(true)
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button
      onClick={speak}
      disabled={playing}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all
        ${playing
          ? "bg-blue-100 text-blue-600 cursor-wait"
          : "bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 cursor-pointer"
        } ${className}`}
      title={`Phát âm: ${text}`}
    >
      <span className="material-symbols-rounded text-[18px]">
        {playing ? "graphic_eq" : "volume_up"}
      </span>
      {playing ? "Đang phát..." : "Nghe"}
    </button>
  )
}

// Hook để phát âm programmatically
export function useSpeech() {
  const speak = (text: string, lang = "en-US") => {
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)
  }
  const stop = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel()
  }
  return { speak, stop }
}
