import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TopNavBar from "@/components/TopNavBar";
import Flashcard from "@/components/Flashcard";
import type { Word } from "@/lib/supabase/types";

export const revalidate = 60;

type Variant = "primary" | "secondary" | "tertiary";
const VARIANTS: Variant[] = ["primary", "secondary", "tertiary"];

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Lấy topic
  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!topic) notFound();

  // Lấy words
  const { data: words = [] } = await supabase
    .from("words")
    .select("*")
    .eq("topic_id", topic.id)
    .eq("status", "published")
    .order("sort_order");

  const typedWords = words as Word[];

  // Lấy progress
  let progressMap: Record<string, string> = {};
  if (user && typedWords.length > 0) {
    const { data: prog } = await supabase
      .from("user_word_progress")
      .select("word_id, status")
      .eq("user_id", user.id)
      .in(
        "word_id",
        typedWords.map((w) => w.id),
      );
    const typedProg = (prog ?? []) as { word_id: string; status: string }[];
    progressMap = Object.fromEntries(
      typedProg.map((p) => [p.word_id, p.status]),
    );
  }

  // Lấy topic progress
  let topicProgress = { words_seen: 0, words_mastered: 0 };
  if (user) {
    const { data: tp } = await supabase
      .from("user_topic_progress")
      .select("words_seen, words_mastered")
      .eq("user_id", user.id)
      .eq("topic_id", topic.id)
      .single();
    if (tp) topicProgress = tp;
  }

  const pct =
    topic.word_count > 0
      ? Math.round((topicProgress.words_mastered / topic.word_count) * 100)
      : 0;

  return (
    <div className="bg-mesh min-h-screen text-on-surface">
      <TopNavBar />

      <main className="max-w-[1280px] mx-auto px-6 pt-28 md:px-10 pb-40">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/">
            <button className="group flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all mb-6">
              <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span className="text-sm font-bold">Back to Home</span>
            </button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-container/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    {topic.icon}
                  </span>
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-headline font-black text-on-background tracking-tighter">
                    {topic.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-wider capitalize">
                      {topic.difficulty}
                    </span>
                    <p className="text-on-surface-variant text-sm">
                      {topic.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="glass-card px-6 py-3 rounded-2xl flex flex-col items-center">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Words
                </span>
                <span className="text-2xl font-black text-primary">
                  {topic.word_count}
                </span>
              </div>
              {typedWords.length > 0 && (
                <Link href={`/quiz/${slug}`}>
                  <button className="h-14 px-8 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-headline font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      play_arrow
                    </span>
                    Start Quiz
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Cards */}
        {typedWords.length === 0 ? (
          <div className="text-center py-24 text-on-surface-variant">
            <span className="material-symbols-outlined text-6xl mb-4 block opacity-20">
              menu_book
            </span>
            <p className="text-lg font-medium">No words in this topic yet.</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {typedWords.map((w: Word, i: number) => (
              <Flashcard
                key={w.id}
                word={w.term}
                language={w.language}
                definition={w.definition}
                example={w.example_sentence ?? ""}
                icon={w.icon}
                variant={VARIANTS[i % 3]}
                isMastered={progressMap[w.id] === "mastered"}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Progress */}
      {user && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 glass-card rounded-full px-8 py-4 shadow-2xl flex items-center gap-6 border border-white/40">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-primary text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Progress
              </span>
              <span className="text-sm font-black text-on-surface">
                {topicProgress.words_mastered} / {topic.word_count} Mastered
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-outline-variant/30" />
          <div className="w-32 h-2 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary-fixed-dim transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-primary">{pct}%</span>
        </div>
      )}
    </div>
  );
}
