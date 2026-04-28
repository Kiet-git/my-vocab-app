// app/topic/[slug]/flashcard/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AudioButton } from "@/components/AudioButton";

interface Word {
  id: string;
  word: string;
  language: string;
  definition: string;
  example_sentence: string;
  icon: string;
  pronunciation?: string;
}
const langMap: Record<string, string> = {
  English: "en-US",
  French: "fr-FR",
  German: "de-DE",
  Spanish: "es-ES",
  Japanese: "ja-JP",
  Korean: "ko-KR",
  Chinese: "zh-CN",
};
export default function FlashcardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [words, setWords] = useState<Word[]>([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [unknown, setUnknown] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("words")
        .select("*")
        .eq("topic_slug", slug)
        .order("created_at");
      if (data) setWords(data);
    };
    load();
  }, [slug, supabase]);

  const handleKnow = useCallback(async () => {
    const word = words[current];
    setKnown((prev) => new Set([...prev, word.id]));
    // Lưu tiến độ vào Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_progress").upsert(
        {
          user_id: user.id,
          word_id: word.id,
          topic_slug: slug,
          status: "mastered",
          review_count: 1,
          last_reviewed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,word_id" },
      );
    }
    next();
  }, [current, words, slug, supabase]);

  const handleDontKnow = useCallback(() => {
    const word = words[current];
    setUnknown((prev) => new Set([...prev, word.id]));
    next();
  }, [current, words]);

  const next = () => {
    setFlipped(false);
    setTimeout(() => {
      if (current + 1 >= words.length) setDone(true);
      else setCurrent((c) => c + 1);
    }, 200);
  };

  if (words.length === 0)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );

  if (done)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold">Hoàn thành!</h2>
        <div className="flex gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-green-500">
              {known.size}
            </div>
            <div className="text-sm text-gray-500">Đã biết</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-red-400">
              {unknown.size}
            </div>
            <div className="text-sm text-gray-500">Cần ôn thêm</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setCurrent(0);
              setDone(false);
              setKnown(new Set());
              setUnknown(new Set());
            }}
            className="px-6 py-2 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600"
          >
            Học lại
          </button>
          <button
            onClick={() => router.push(`/topic/${slug}`)}
            className="px-6 py-2 rounded-full border border-gray-200 hover:bg-gray-50 font-medium"
          >
            Quay lại
          </button>
          <button
            onClick={() => router.push(`/quiz/${slug}`)}
            className="px-6 py-2 rounded-full bg-green-500 text-white font-medium hover:bg-green-600"
          >
            Làm quiz
          </button>
        </div>
      </div>
    );

  const word = words[current];
  const langMap: Record<string, string> = {
    French: "fr-FR",
    German: "de-DE",
    English: "en-US",
    Spanish: "es-ES",
    Japanese: "ja-JP",
  };
  const lang = langMap[word.language] || "en-US";

  return (
    <div className="flex flex-col items-center min-h-screen py-12 px-4 gap-8">
      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="material-symbols-rounded">arrow_back</span>
        </button>
        <span className="text-sm text-gray-500">
          {current + 1} / {words.length}
        </span>
        <span className="text-sm text-green-500 font-medium">
          {known.size} đã biết
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xl h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-400 rounded-full transition-all duration-500"
          style={{ width: `${(current / words.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-xl" style={{ perspective: "1200px" }}>
        <div
          onClick={() => setFlipped((f) => !f)}
          className="relative w-full cursor-pointer"
          style={{
            height: "320px",
            transformStyle: "preserve-3d",
            transition: "transform 0.5s",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-3xl shadow-lg bg-white border border-gray-100 flex flex-col items-center justify-center gap-4 p-8"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="text-5xl">{word.icon || "📚"}</div>
            <h2 className="text-4xl font-bold tracking-tight">{word.word}</h2>
            <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
              {word.language}
            </span>
            {word.pronunciation && (
              <span className="text-gray-400 text-sm">
                /{word.pronunciation}/
              </span>
            )}
            <AudioButton
              text={word.word}
              lang={langMap[word.language] ?? "en-US"}
            />
            <p className="text-xs text-gray-400 mt-2">Nhấn để xem nghĩa</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-3xl shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex flex-col items-center justify-center gap-4 p-8"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-lg font-medium text-center text-gray-800">
              {word.definition}
            </p>
            <p className="text-sm text-gray-500 italic text-center">
              "{word.example_sentence}"
            </p>
            <AudioButton
              text={word.example_sentence}
              lang={langMap[word.language] ?? "en-US"}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 w-full max-w-xl justify-center">
        <button
          onClick={handleDontKnow}
          className="flex-1 py-3 rounded-2xl bg-red-50 text-red-500 font-semibold text-lg hover:bg-red-100 transition-colors border border-red-100"
        >
          ✗ Chưa biết
        </button>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="px-6 py-3 rounded-2xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors border border-gray-100"
        >
          Lật thẻ
        </button>
        <button
          onClick={handleKnow}
          className="flex-1 py-3 rounded-2xl bg-green-50 text-green-600 font-semibold text-lg hover:bg-green-100 transition-colors border border-green-100"
        >
          ✓ Đã biết
        </button>
      </div>
    </div>
  );
}
