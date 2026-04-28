"use client";

import { useState } from "react";

type Variant = "primary" | "secondary" | "tertiary";

interface FlashcardProps {
  word: string;
  language: string;
  definition: string;
  example: string;
  icon: string;
  variant?: Variant;
  isMastered?: boolean;
}

const S: Record<
  Variant,
  { icon: string; lang: string; border: string; audio: string }
> = {
  primary: {
    icon: "opacity-40 text-primary",
    lang: "text-primary",
    border: "border-primary/15",
    audio: "text-primary",
  },
  secondary: {
    icon: "opacity-40 text-secondary",
    lang: "text-secondary",
    border: "border-secondary/15",
    audio: "text-secondary",
  },
  tertiary: {
    icon: "opacity-40 text-tertiary",
    lang: "text-tertiary",
    border: "border-tertiary/15",
    audio: "text-tertiary",
  },
};

const langMap: Record<string, string> = {
  English: "en-US",
  French: "fr-FR",
  German: "de-DE",
  Spanish: "es-ES",
  Japanese: "ja-JP",
  Korean: "ko-KR",
  Chinese: "zh-CN",
  Italian: "it-IT",
  Portuguese: "pt-BR",
  Russian: "ru-RU",
};

export default function Flashcard({
  word,
  language,
  definition,
  example,
  icon,
  variant = "primary",
  isMastered = false,
}: FlashcardProps) {
  const s = S[variant];
  const [flipped, setFlipped] = useState(false);
  const [playing, setPlaying] = useState(false);

  const speak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation(); // Không bubble lên card
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langMap[language] ?? "en-US";
    u.rate = 0.85;
    u.onstart = () => setPlaying(true);
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="card-scene h-[280px]">
      {/* card-inner nhận class "flipped" theo state — KHÔNG dùng hover nữa */}
      <div
        className={`card-inner cursor-pointer ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
      >
        {/* ── FRONT ── */}
        <div className="card-face glass-card rounded-[2rem] flex flex-col items-center justify-center p-8 shadow-xl shadow-surface-container/40">
          {isMastered && (
            <div className="absolute top-5 right-5">
              <span
                className="material-symbols-outlined text-tertiary text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                stars
              </span>
            </div>
          )}

          <span
            className={`material-symbols-outlined mb-4 ${s.icon}`}
            style={{ fontSize: "36px" }}
          >
            {icon}
          </span>

          <h3 className="text-2xl md:text-3xl font-headline font-bold text-on-surface text-center leading-tight">
            {word}
          </h3>

          <p
            className={`mt-2 text-xs font-bold tracking-[0.2em] uppercase ${s.lang}`}
          >
            {language}
          </p>

          {/* Nút phát âm — stopPropagation giúp KHÔNG lật thẻ khi bấm */}
          <button
            onClick={(e) => speak(e, word)}
            className={`mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
              transition-all active:scale-95 select-none
              bg-white/60 hover:bg-white/90 ${s.audio}`}
            title={`Nghe phát âm: ${word}`}
          >
            <span
              className="material-symbols-outlined text-[17px]"
              style={{
                fontVariationSettings: playing ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              {playing ? "graphic_eq" : "volume_up"}
            </span>
            {playing ? "Playing…" : "Listen"}
          </button>

          <p className="mt-3 text-[11px] text-on-surface-variant/50 select-none">
            Tap to flip
          </p>
        </div>

        {/* ── BACK ── */}
        <div
          className={`card-face card-face-back bg-surface-container-lowest rounded-[2rem] flex flex-col items-center justify-center p-8 border-2 ${s.border} shadow-2xl`}
        >
          <p className="text-on-surface font-medium text-base md:text-lg text-center leading-relaxed italic">
            &ldquo;{definition}&rdquo;
          </p>

          {example && (
            <div className="mt-5 w-full pt-5 border-t border-outline-variant/20">
              <p className="text-on-surface-variant text-sm text-center leading-relaxed">
                {example}
              </p>
            </div>
          )}

          {isMastered && (
            <div className="absolute bottom-5 left-6">
              <span className="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary-container text-[10px] font-bold uppercase">
                Mastered
              </span>
            </div>
          )}

          {/* Nút phát câu ví dụ — góc phải dưới */}
          <button
            onClick={(e) => speak(e, example || word)}
            className={`absolute bottom-4 right-5 flex items-center gap-1 px-2.5 py-1.5 rounded-full
              transition-all active:scale-95 select-none
              bg-white/60 hover:bg-white/90 ${s.audio}`}
            title="Nghe câu ví dụ"
          >
            <span
              className="material-symbols-outlined text-[17px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {playing ? "graphic_eq" : "volume_up"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
