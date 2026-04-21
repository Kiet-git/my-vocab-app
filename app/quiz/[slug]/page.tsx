"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildOptions(correct: string, allDefs: string[]): string[] {
  const wrong = shuffle(allDefs.filter((d) => d !== correct)).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

export default function QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [sessionStart] = useState(Date.now());
  const [topicId, setTopicId] = useState("");
  const [saving, setSaving] = useState(false);

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

    const { data: ws } = await supabase
      .from("words")
      .select("*")
      .eq("topic_id", topic.id)
      .eq("status", "published")
      .order("sort_order");
    if (!ws || ws.length < 2) {
      setLoading(false);
      return;
    }

    const shuffled = shuffle((ws as Word[]) || []).slice(0, 10);
    setWords(shuffled as Word[]);
    const allDefs = (ws as Word[]).map((w: any) => w.definition);
    setOptions(buildOptions(shuffled[0].definition, allDefs));
    setLoading(false);
    setStartTime(Date.now());
  }, [slug, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const q = words[current];
  const allDefs = words.map((w) => w.definition);
  const isCorrect = selected === q?.definition;
  const total = words.length;
  const pct =
    total > 0 ? Math.round(((current + (confirmed ? 1 : 0)) / total) * 100) : 0;

  const handleSelect = (opt: string) => {
    if (confirmed) return;
    setSelected(opt);
  };

  const handleConfirm = () => {
    if (!selected || !q) return;
    setConfirmed(true);
    if (isCorrect) setScore((s) => s + 1);
  };

  const handleNext = async () => {
    if (!q) return;
    const ans: Answer = {
      wordId: q.id,
      correctAnswer: q.definition,
      userAnswer: selected ?? "",
      isCorrect,
      timeTakenMs: Date.now() - startTime,
      distractors: options.filter((o) => o !== q.definition),
    };
    const newAnswers = [...answers, ans];
    setAnswers(newAnswers);

    if (current + 1 >= total) {
      // Save results
      setSaving(true);
      const finalScore = score + (isCorrect ? 1 : 0);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && topicId) {
        // Save quiz session
        const { data: session } = await supabase
          .from("quiz_sessions")
          .insert({
            user_id: user.id,
            topic_id: topicId,
            total_questions: total,
            correct_answers: finalScore,
            score_points: finalScore * 10,
            duration_secs: Math.round((Date.now() - sessionStart) / 1000),
            quiz_type: "multiple_choice",
          })
          .select()
          .single();

        if (session) {
          await supabase.from("quiz_answers").insert(
            newAnswers.map((a) => ({
              session_id: session.id,
              word_id: a.wordId,
              question_type: "multiple_choice",
              correct_answer: a.correctAnswer,
              user_answer: a.userAnswer,
              is_correct: a.isCorrect,
              time_taken_ms: a.timeTakenMs,
              distractors: a.distractors,
            })),
          );
        }

        // Update word progress
        await Promise.all(
          newAnswers.map(async (a) => {
            const q = a.isCorrect ? 4 : 1;
            const { data: cur } = await supabase
              .from("user_word_progress")
              .select("*")
              .eq("user_id", user.id)
              .eq("word_id", a.wordId)
              .single();
            const ef = cur?.ease_factor ?? 2.5;
            const reps = cur?.repetitions ?? 0;
            const newEF = Math.max(
              1.3,
              ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02),
            );
            const newReps = q >= 3 ? reps + 1 : 0;
            const interval =
              newReps <= 1
                ? 1
                : newReps === 2
                  ? 6
                  : Math.round((cur?.interval_days ?? 1) * newEF);
            const status =
              newReps >= 5
                ? "mastered"
                : newReps >= 2
                  ? "reviewing"
                  : newReps >= 1
                    ? "learning"
                    : "new";
            await supabase.from("user_word_progress").upsert(
              {
                user_id: user.id,
                word_id: a.wordId,
                status,
                ease_factor: newEF,
                interval_days: interval,
                repetitions: newReps,
                next_review_at: new Date(
                  Date.now() + interval * 86400000,
                ).toISOString(),
                times_seen: (cur?.times_seen ?? 0) + 1,
                times_correct:
                  (cur?.times_correct ?? 0) + (a.isCorrect ? 1 : 0),
                times_wrong: (cur?.times_wrong ?? 0) + (a.isCorrect ? 0 : 1),
                last_seen_at: new Date().toISOString(),
              },
              { onConflict: "user_id,word_id" },
            );
          }),
        );

        // Add points
        await supabase.rpc("increment_points", {
          p_user_id: user.id,
          p_points: finalScore * 10,
        });
      }
      setSaving(false);
      setFinished(true);
    } else {
      const next = current + 1;
      setCurrent(next);
      setSelected(null);
      setConfirmed(false);
      setStartTime(Date.now());
      setOptions(buildOptions(words[next].definition, allDefs));
    }
  };

  const handleRestart = () => {
    const shuffled = shuffle(words);
    setWords(shuffled);
    setCurrent(0);
    setSelected(null);
    setConfirmed(false);
    setScore(0);
    setFinished(false);
    setAnswers([]);
    setOptions(buildOptions(shuffled[0].definition, allDefs));
    setStartTime(Date.now());
  };

  // ── Loading ──
  if (loading)
    return (
      <>
        <TopNavBar />
        <div className="bg-mesh min-h-screen flex items-center justify-center pt-20">
          <div className="text-center space-y-4">
            <span className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
            <p className="text-on-surface-variant font-medium">
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
        <div className="bg-mesh min-h-screen flex items-center justify-center pt-20">
          <div className="text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 block">
              quiz
            </span>
            <p className="text-on-surface-variant font-medium">
              Not enough words for a quiz yet.
            </p>
            <Link href={`/topic/${slug}`}>
              <button className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold">
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
        <div className="bg-mesh min-h-screen flex items-center justify-center px-6 pt-20">
          <div className="max-w-lg w-full space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-1 rounded-[2rem]">
              <div className="bg-surface-container-lowest rounded-[1.9rem] p-12 space-y-6 text-center">
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
                        : "Keep Practicing!"}
                  </h2>
                  <p className="text-on-surface-variant mt-2">
                    You scored{" "}
                    <span className="text-primary font-bold">
                      {finalScore}/{total}
                    </span>{" "}
                    ·{" "}
                    <span className="text-tertiary font-bold">
                      +{finalScore * 10} pts
                    </span>
                  </p>
                </div>
                {/* Breakdown */}
                <div className="flex justify-center gap-2 flex-wrap">
                  {answers.map((a, i) => (
                    <div
                      key={i}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${a.isCorrect ? "bg-tertiary-container text-tertiary" : "bg-error-container/30 text-error"}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  {saving ? (
                    <div className="flex justify-center py-2">
                      <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleRestart}
                        className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-xl hover:scale-[1.02] transition-all shadow-lg"
                      >
                        Try Again
                      </button>
                      <Link href={`/topic/${slug}`}>
                        <button className="w-full py-4 bg-surface-container-highest text-primary font-bold rounded-xl hover:bg-surface-container-high transition-all">
                          Back to Flashcards
                        </button>
                      </Link>
                    </>
                  )}
                </div>
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
      <div className="bg-mesh min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href={`/topic/${slug}`}>
              <button className="group flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all">
                <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
                  arrow_back
                </span>
                <span className="text-sm font-bold">Back</span>
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-on-surface-variant">
                {current + 1} / {total}
              </span>
              <div className="w-32 h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary-fixed transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-tertiary">
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                stars
              </span>
              {score * 10} pts
            </div>
          </div>

          {/* Word card */}
          <div className="glass-card rounded-[2rem] p-10 text-center space-y-3 shadow-xl">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-primary-container/20 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">
                  {q.icon}
                </span>
              </div>
            </div>
            <p className="text-xs font-bold text-primary tracking-[0.2em] uppercase">
              {q.language}
            </p>
            <h2 className="text-5xl font-extrabold font-headline text-on-surface">
              {q.term}
            </h2>
            {q.pronunciation && (
              <p className="text-on-surface-variant italic text-sm">
                {q.pronunciation}
              </p>
            )}
            {q.example_sentence && (
              <p className="text-on-surface-variant text-sm">
                &ldquo;{q.example_sentence}&rdquo;
              </p>
            )}
          </div>

          <p className="text-center font-semibold text-on-surface-variant">
            What is the correct definition?
          </p>

          {/* Options */}
          <div className="space-y-3">
            {options.map((opt) => {
              let style =
                "bg-surface-container-lowest border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container-low";
              if (confirmed) {
                if (opt === q.definition)
                  style = "bg-tertiary-container/30 border-tertiary";
                else if (opt === selected)
                  style = "bg-error-container/20 border-error opacity-80";
                else
                  style =
                    "bg-surface-container-lowest border-outline-variant/10 opacity-40";
              } else if (opt === selected)
                style = "bg-primary-container/20 border-primary";

              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all duration-150 font-medium text-on-surface ${style}`}
                >
                  <div className="flex items-start gap-3">
                    {confirmed && opt === q.definition && (
                      <span
                        className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    )}
                    {confirmed && opt === selected && opt !== q.definition && (
                      <span
                        className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        cancel
                      </span>
                    )}
                    <span className="leading-relaxed">{opt}</span>
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
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-lg rounded-xl hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              Check Answer
            </button>
          ) : (
            <div
              className={`rounded-xl p-5 flex items-center justify-between gap-4 ${isCorrect ? "bg-tertiary-container/20" : "bg-error-container/10"}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-2xl ${isCorrect ? "text-tertiary" : "text-error"}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {isCorrect ? "check_circle" : "cancel"}
                </span>
                <div>
                  <p
                    className={`font-bold ${isCorrect ? "text-tertiary" : "text-error"}`}
                  >
                    {isCorrect ? "Correct! +10 pts" : "Not quite."}
                  </p>
                  {!isCorrect && (
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      The answer was: {q.definition.slice(0, 60)}...
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-on-surface text-surface rounded-xl font-bold hover:opacity-90 transition-all shrink-0"
              >
                {current + 1 >= total ? "See Results" : "Next →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
