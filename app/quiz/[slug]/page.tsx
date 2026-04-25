"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import TopNavBar from "@/components/TopNavBar";
import { createClient } from "@/lib/supabase/client";
import type { Word } from "@/lib/supabase/types";

type Answer = {
  wordId: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  timeTakenMs: number;
  distractors: string[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(correct: string, pool: string[]): string[] {
  const wrong = shuffle(pool.filter((d) => d !== correct)).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

// SM-2 helper
function sm2(
  current: {
    ease_factor?: number;
    repetitions?: number;
    interval_days?: number;
  } | null,
  quality: 0 | 1 | 2 | 3 | 4 | 5,
) {
  const ef = current?.ease_factor ?? 2.5;
  const reps = current?.repetitions ?? 0;
  const newEF = Math.max(
    1.3,
    ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
  );
  const newReps = quality >= 3 ? reps + 1 : 0;
  const interval =
    newReps <= 1
      ? 1
      : newReps === 2
        ? 6
        : Math.round((current?.interval_days ?? 1) * newEF);
  const status =
    newReps >= 5
      ? "mastered"
      : newReps >= 2
        ? "reviewing"
        : newReps >= 1
          ? "learning"
          : "new";
  const nextReview = new Date(Date.now() + interval * 86400000).toISOString();
  return { newEF, newReps, interval, status, nextReview };
}

export default function QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const supabase = createClient();

  const [words, setWords] = useState<Word[]>([]);
  const [allDefs, setAllDefs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicId, setTopicId] = useState("");
  const [current, setCurrent] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const startTimeRef = useRef(Date.now());
  const sessionStartRef = useRef(Date.now());

  const load = useCallback(async () => {
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!topic) {
      setLoading(false);
      return;
    }
    setTopicId(topic.id);

    // FIX: Bỏ `word_count` khỏi select — field này không có trong bảng `words`
    // (word_count thuộc bảng `topics`, không phải `words`)
    const { data: ws } = await supabase
      .from("words")
      .select(
        "id,topic_id,term,language,definition,pronunciation,example_sentence,icon,difficulty,sort_order,status,notes,image_url,audio_url,ai_generated,ai_model,created_by,created_at,updated_at",
      )
      .eq("topic_id", topic.id)
      .eq("status", "published")
      .order("sort_order");

    if (!ws || ws.length < 2) {
      setLoading(false);
      return;
    }

    const shuffled = shuffle(ws as Word[]).slice(0, Math.min(10, ws.length));
    const defs = ws.map((w) => w.definition);
    setWords(shuffled);
    setAllDefs(defs);
    setOptions(buildOptions(shuffled[0].definition, defs));
    startTimeRef.current = Date.now();
    sessionStartRef.current = Date.now();
    setLoading(false);
  }, [slug, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const q = words[current];
  const total = words.length;
  const correct = selected === q?.definition;
  const pct =
    total > 0 ? Math.round(((current + (confirmed ? 1 : 0)) / total) * 100) : 0;

  const handleConfirm = () => {
    if (!selected || confirmed) return;
    setConfirmed(true);
    if (correct) setScore((s) => s + 1);
  };

  const handleNext = async () => {
    if (!q) return;
    const ans: Answer = {
      wordId: q.id,
      correctAnswer: q.definition,
      userAnswer: selected ?? "",
      isCorrect: correct,
      timeTakenMs: Date.now() - startTimeRef.current,
      distractors: options.filter((o) => o !== q.definition),
    };
    const newAnswers = [...answers, ans];
    setAnswers(newAnswers);

    if (current + 1 >= total) {
      setSaving(true);
      const finalScore = score + (correct ? 1 : 0);

      // FIX: Dùng `user` thay vì `session` (biến session không còn tồn tại)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && topicId) {
        const userId = user.id;

        const { data: quizSession } = await supabase
          .from("quiz_sessions")
          .insert({
            user_id: userId,
            topic_id: topicId,
            total_questions: total,
            correct_answers: finalScore,
            score_points: finalScore * 10,
            duration_secs: Math.round(
              (Date.now() - sessionStartRef.current) / 1000,
            ),
            quiz_type: "multiple_choice",
          })
          .select("id")
          .single();

        const wordIds = newAnswers.map((a) => a.wordId);

        const [, { data: existingProgress }] = await Promise.all([
          quizSession?.id
            ? supabase.from("quiz_answers").insert(
                newAnswers.map((a) => ({
                  session_id: quizSession.id,
                  word_id: a.wordId,
                  question_type: "multiple_choice",
                  correct_answer: a.correctAnswer,
                  user_answer: a.userAnswer,
                  is_correct: a.isCorrect,
                  time_taken_ms: a.timeTakenMs,
                  distractors: a.distractors,
                })),
              )
            : Promise.resolve(),
          supabase
            .from("user_word_progress")
            .select("word_id,ease_factor,repetitions,interval_days")
            .eq("user_id", userId)
            .in("word_id", wordIds),
        ]);

        const progressByWord = Object.fromEntries(
          (existingProgress ?? []).map((p) => [p.word_id, p]),
        );

        const upsertPayload = newAnswers.map((a) => {
          const cur = progressByWord[a.wordId] ?? null;
          const quality: 0 | 1 | 2 | 3 | 4 | 5 = a.isCorrect ? 4 : 1;
          const { newEF, newReps, interval, status, nextReview } = sm2(
            cur,
            quality,
          );
          return {
            user_id: userId,
            word_id: a.wordId,
            status,
            ease_factor: newEF,
            interval_days: interval,
            repetitions: newReps,
            next_review_at: nextReview,
            times_seen: (cur?.repetitions ?? 0) + 1,
            times_correct: a.isCorrect ? 1 : 0,
            times_wrong: a.isCorrect ? 0 : 1,
            last_seen_at: new Date().toISOString(),
          };
        });

        await Promise.all([
          supabase
            .from("user_word_progress")
            .upsert(upsertPayload, { onConflict: "user_id,word_id" }),
          supabase.rpc("increment_points", {
            p_user_id: userId,
            p_points: finalScore * 10,
          }),
        ]);
      }

      setSaving(false);
      setFinished(true);
    } else {
      const next = current + 1;
      setCurrent(next);
      setSelected(null);
      setConfirmed(false);
      startTimeRef.current = Date.now();
      setOptions(buildOptions(words[next].definition, allDefs));
    }
  };

  const handleRestart = () => {
    const reshuffled = shuffle(words);
    setWords(reshuffled);
    setCurrent(0);
    setSelected(null);
    setConfirmed(false);
    setScore(0);
    setFinished(false);
    setAnswers([]);
    setOptions(buildOptions(reshuffled[0].definition, allDefs));
    startTimeRef.current = Date.now();
    sessionStartRef.current = Date.now();
  };

  // ── Loading ──
  if (loading)
    return (
      <>
        <TopNavBar />
        <div className="bg-mesh min-h-screen flex items-center justify-center pt-20">
          <div className="text-center space-y-4">
            <span className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
            <p className="text-on-surface-variant text-sm font-medium">
              Loading quiz...
            </p>
          </div>
        </div>
      </>
    );

  if (words.length < 2)
    return (
      <>
        <TopNavBar />
        <div className="bg-mesh min-h-screen flex items-center justify-center pt-20 px-6">
          <div className="text-center space-y-5 max-w-sm">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 block">
              quiz
            </span>
            <h2 className="text-2xl font-bold font-headline">
              Not enough words
            </h2>
            <p className="text-on-surface-variant">
              Add at least 2 published words to this topic first.
            </p>
            <Link href={`/topic/${slug}`} prefetch={true}>
              <button className="mt-2 px-8 py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity">
                Back to Topic
              </button>
            </Link>
          </div>
        </div>
      </>
    );

  // ── Finished ──
  if (finished) {
    const finalScore = answers.filter((a) => a.isCorrect).length;
    const finalPct = Math.round((finalScore / total) * 100);
    return (
      <>
        <TopNavBar />
        <div className="bg-mesh min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
          <div className="max-w-md w-full">
            <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-1 rounded-[2rem]">
              <div className="bg-surface-container-lowest rounded-[1.9rem] p-10 space-y-6 text-center">
                <div className="w-24 h-24 bg-tertiary-container/30 rounded-full flex items-center justify-center mx-auto">
                  <span
                    className="material-symbols-outlined text-tertiary text-5xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {finalPct >= 80
                      ? "workspace_premium"
                      : finalPct >= 50
                        ? "auto_awesome"
                        : "sentiment_satisfied"}
                  </span>
                </div>
                <div>
                  <h2 className="text-4xl font-extrabold font-headline">
                    {finalPct >= 80
                      ? "Excellent!"
                      : finalPct >= 50
                        ? "Good Job!"
                        : "Keep Going!"}
                  </h2>
                  <p className="text-on-surface-variant mt-2">
                    <span className="text-primary font-bold">
                      {finalScore}/{total}
                    </span>{" "}
                    correct {" · "}
                    <span className="text-tertiary font-bold">
                      +{finalScore * 10} pts
                    </span>
                  </p>
                </div>

                <div className="flex justify-center gap-2 flex-wrap">
                  {answers.map((a, i) => (
                    <div
                      key={i}
                      title={words[i]?.term ?? ""}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 ${a.isCorrect ? "bg-tertiary-container text-tertiary" : "bg-error-container/30 text-error"}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                {saving ? (
                  <div className="flex justify-center py-2">
                    <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pt-1">
                    <button
                      onClick={handleRestart}
                      className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
                    >
                      Try Again
                    </button>
                    <Link href={`/topic/${slug}`} prefetch={true}>
                      <button className="w-full py-4 bg-surface-container-highest text-primary font-bold rounded-xl hover:bg-surface-container-high transition-colors">
                        Back to Flashcards
                      </button>
                    </Link>
                    <Link href="/progress" prefetch={true}>
                      <button className="w-full py-3 text-on-surface-variant text-sm font-medium hover:text-primary transition-colors">
                        View Full Progress →
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Quiz ──
  return (
    <>
      <TopNavBar />
      <div className="bg-mesh min-h-screen pt-20 pb-16 px-4 md:px-6">
        <div className="max-w-2xl mx-auto space-y-6 pt-6">
          {/* Progress bar + score */}
          <div className="flex items-center justify-between gap-4">
            <Link href={`/topic/${slug}`} prefetch={true}>
              <button className="group flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-sm font-bold">
                <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
                  arrow_back
                </span>
                Back
              </button>
            </Link>
            <div className="flex items-center gap-3 flex-1">
              <span className="text-sm font-bold text-on-surface-variant whitespace-nowrap">
                {current + 1}/{total}
              </span>
              <div className="flex-1 h-2.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary-fixed transition-all duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-tertiary whitespace-nowrap">
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                stars
              </span>
              {score * 10} pts
            </div>
          </div>

          {/* Word card */}
          <div className="glass-card rounded-[2rem] p-8 md:p-10 text-center space-y-3 shadow-xl">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-primary-container/20 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">
                  {q.icon}
                </span>
              </div>
            </div>
            <p className="text-xs font-bold text-primary tracking-[0.2em] uppercase">
              {q.language}
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold font-headline text-on-surface">
              {q.term}
            </h2>
            {q.pronunciation && (
              <p className="text-on-surface-variant text-sm italic">
                {q.pronunciation}
              </p>
            )}
            {q.example_sentence && (
              <p className="text-on-surface-variant text-sm max-w-sm mx-auto leading-relaxed">
                &ldquo;{q.example_sentence}&rdquo;
              </p>
            )}
          </div>

          <p className="text-center text-sm font-semibold text-on-surface-variant">
            Select the correct definition
          </p>

          {/* Options */}
          <div className="space-y-2.5">
            {options.map((opt, idx) => {
              const isCorrectOpt = opt === q.definition;
              const isSelected = opt === selected;
              let cls =
                "bg-surface-container-lowest border-outline-variant/20 hover:border-primary/40 hover:bg-primary-container/5 cursor-pointer";
              if (confirmed) {
                if (isCorrectOpt)
                  cls =
                    "bg-tertiary-container/25 border-tertiary cursor-default";
                else if (isSelected)
                  cls =
                    "bg-error-container/20 border-error/60 opacity-80 cursor-default";
                else cls = "opacity-35 cursor-default border-outline-variant/10";
              } else if (isSelected) {
                cls = "bg-primary-container/20 border-primary";
              }

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (!confirmed) setSelected(opt);
                  }}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-150 font-medium text-on-surface ${cls}`}
                  disabled={confirmed}
                >
                  <div className="flex items-start gap-3">
                    {confirmed && isCorrectOpt && (
                      <span
                        className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    )}
                    {confirmed && isSelected && !isCorrectOpt && (
                      <span
                        className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        cancel
                      </span>
                    )}
                    <span className="leading-relaxed text-sm md:text-base">
                      {opt}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action */}
          {!confirmed ? (
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-lg rounded-xl transition-all disabled:opacity-35 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary/20"
            >
              Check Answer
            </button>
          ) : (
            <div
              className={`rounded-2xl p-4 flex items-center justify-between gap-4 ${correct ? "bg-tertiary-container/20" : "bg-error-container/10"}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`material-symbols-outlined text-2xl shrink-0 ${correct ? "text-tertiary" : "text-error"}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {correct ? "check_circle" : "cancel"}
                </span>
                <div className="min-w-0">
                  <p
                    className={`font-bold ${correct ? "text-tertiary" : "text-error"}`}
                  >
                    {correct ? "Correct! +10 pts" : "Not quite."}
                  </p>
                  {!correct && (
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      Answer: {q.definition.slice(0, 55)}
                      {q.definition.length > 55 ? "…" : ""}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-on-surface text-surface rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all shrink-0 text-sm"
              >
                {current + 1 >= total ? "Results →" : "Next →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
