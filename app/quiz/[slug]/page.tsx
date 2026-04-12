"use client";

import { use, useState } from "react";
import Link from "next/link";
import TopNavBar from "@/components/TopNavBar";

const QUIZ_DATA: Record<
  string,
  {
    title: string;
    questions: {
      word: string;
      language: string;
      correct: string;
      options: string[];
      example: string;
    }[];
  }
> = {
  travel: {
    title: "Travel Vocabulary",
    questions: [
      {
        word: "Wanderlust",
        language: "German/English",
        correct: "A strong desire to travel and explore the world.",
        options: [
          "A strong desire to travel and explore the world.",
          "The feeling of being lost in a foreign city.",
          "Homesickness for your home country.",
          "A type of German passport document.",
        ],
        example: "Her wanderlust led her to 50 countries by age 30.",
      },
      {
        word: "Dépaysement",
        language: "French",
        correct:
          "The feeling of being in a foreign country; change of scenery.",
        options: [
          "A French word for homesickness.",
          "The feeling of being in a foreign country; change of scenery.",
          "The excitement of arriving at a new destination.",
          "A long and exhausting journey.",
        ],
        example: "J'adore le dépaysement quand je voyage en Asie.",
      },
      {
        word: "Itinerary",
        language: "English",
        correct: "A planned route or journey; a list of places to visit.",
        options: [
          "A type of travel insurance.",
          "The luggage you bring on a trip.",
          "A planned route or journey; a list of places to visit.",
          "A travel guidebook for tourists.",
        ],
        example: "We need to finalize our itinerary for Paris next week.",
      },
      {
        word: "Fernweh",
        language: "German",
        correct:
          "A longing for far-off places; homesickness for a place you've never been.",
        options: [
          "Fear of traveling alone.",
          "A souvenir brought back from a trip.",
          "A longing for far-off places; homesickness for a place you've never been.",
          "The comfort of returning home after a long journey.",
        ],
        example: "I have constant fernweh for the mountains of Chile.",
      },
      {
        word: "Voyage",
        language: "French",
        correct: "A long journey involving travel by sea or in space.",
        options: [
          "A short day trip to a nearby city.",
          "A long journey involving travel by sea or in space.",
          "The process of packing your bags.",
          "A farewell ceremony before a journey.",
        ],
        example: "Bon voyage! Have a wonderful trip to Iceland.",
      },
    ],
  },
};

const FALLBACK_QUIZ = QUIZ_DATA.travel;

export default function QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // ✅ Next.js 15: unwrap params với React.use()
  const { slug } = use(params);
  const quiz = QUIZ_DATA[slug] ?? FALLBACK_QUIZ;
  const total = quiz.questions.length;

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const q = quiz.questions[current];
  const isCorrect = selected === q?.correct;

  const handleSelect = (opt: string) => {
    if (confirmed) return;
    setSelected(opt);
  };

  const handleConfirm = () => {
    if (!selected) return;
    setConfirmed(true);
    if (isCorrect) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setAnswers((a) => [...a, isCorrect]);
    if (current + 1 >= total) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setConfirmed(false);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setConfirmed(false);
    setScore(0);
    setFinished(false);
    setAnswers([]);
  };

  const pct = Math.round(((current + (confirmed ? 1 : 0)) / total) * 100);

  // ── FINISHED ──
  if (finished) {
    const finalPct = Math.round((score / total) * 100);
    return (
      <>
        <TopNavBar />
        <div className="bg-mesh min-h-screen flex items-center justify-center px-6 pt-20">
          <div className="max-w-lg w-full text-center space-y-8">
            <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-1 rounded-[2rem]">
              <div className="bg-surface-container-lowest rounded-[1.9rem] p-12 space-y-6">
                <div className="w-24 h-24 bg-tertiary-container/30 rounded-full flex items-center justify-center mx-auto">
                  <span
                    className="material-symbols-outlined text-tertiary text-5xl"
                    style={{
                      fontVariationSettings:
                        "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                    }}
                  >
                    {finalPct >= 80
                      ? "workspace_premium"
                      : finalPct >= 50
                        ? "auto_awesome"
                        : "sentiment_satisfied"}
                  </span>
                </div>
                <div>
                  <h2 className="text-4xl font-extrabold font-headline mb-2">
                    {finalPct >= 80
                      ? "Excellent!"
                      : finalPct >= 50
                        ? "Good Job!"
                        : "Keep Practicing!"}
                  </h2>
                  <p className="text-on-surface-variant">
                    You scored{" "}
                    <span className="text-primary font-bold">
                      {score}/{total}
                    </span>{" "}
                    correct answers.
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  {answers.map((correct, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${correct ? "bg-tertiary-container" : "bg-error-container/20"}`}
                    >
                      <span
                        className={`material-symbols-outlined text-[16px] ${correct ? "text-tertiary" : "text-error"}`}
                        style={{
                          fontVariationSettings:
                            "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                        }}
                      >
                        {correct ? "check" : "close"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={handleRestart}
                    className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg"
                  >
                    Try Again
                  </button>
                  <Link href={`/topic/${slug}`}>
                    <button className="w-full py-4 bg-surface-container-highest text-primary rounded-xl font-bold hover:bg-surface-container-high transition-all">
                      Back to Flashcards
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── QUIZ ──
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
                style={{
                  fontVariationSettings:
                    "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}
              >
                stars
              </span>
              {score} pts
            </div>
          </div>

          {/* Word Card */}
          <div className="glass-card rounded-[2rem] p-10 text-center space-y-3 shadow-xl">
            <p className="text-xs font-bold text-primary tracking-[0.2em] uppercase">
              {q.language}
            </p>
            <h2 className="text-5xl font-extrabold font-headline text-on-surface">
              {q.word}
            </h2>
            <p className="text-on-surface-variant text-sm italic">
              &ldquo;{q.example}&rdquo;
            </p>
          </div>

          <p className="text-center font-semibold text-on-surface-variant">
            What is the correct definition?
          </p>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((opt) => {
              let style =
                "bg-surface-container-lowest border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container-low";
              if (confirmed) {
                if (opt === q.correct)
                  style =
                    "bg-tertiary-container/30 border-tertiary text-on-surface";
                else if (opt === selected)
                  style = "bg-error-container/20 border-error text-on-surface";
                else
                  style =
                    "bg-surface-container-lowest border-outline-variant/10 opacity-50";
              } else if (opt === selected) {
                style = "bg-primary-container/20 border-primary";
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all duration-200 font-medium text-on-surface ${style}`}
                >
                  <div className="flex items-center gap-3">
                    {confirmed && opt === q.correct && (
                      <span
                        className="material-symbols-outlined text-tertiary text-[20px] shrink-0"
                        style={{
                          fontVariationSettings:
                            "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                        }}
                      >
                        check_circle
                      </span>
                    )}
                    {confirmed && opt === selected && opt !== q.correct && (
                      <span
                        className="material-symbols-outlined text-error text-[20px] shrink-0"
                        style={{
                          fontVariationSettings:
                            "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                        }}
                      >
                        cancel
                      </span>
                    )}
                    <span>{opt}</span>
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
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] shadow-lg shadow-primary/20"
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
                  style={{
                    fontVariationSettings:
                      "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                  }}
                >
                  {isCorrect ? "check_circle" : "cancel"}
                </span>
                <p
                  className={`font-bold ${isCorrect ? "text-tertiary" : "text-error"}`}
                >
                  {isCorrect
                    ? "Correct! Great job."
                    : "Not quite. Keep learning!"}
                </p>
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
