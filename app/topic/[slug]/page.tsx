import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TopNavBar from "@/components/TopNavBar";
import Flashcard from "@/components/Flashcard";
import type { Word } from "@/lib/supabase/types";

type Variant = "primary" | "secondary" | "tertiary";
const VARIANTS: Variant[] = ["primary", "secondary", "tertiary"];

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // getUser — validates JWT securely (Next.js 16 best practice for server components)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  // topic query first (blocking — need id for words)
  const { data: topic } = await supabase
    .from("topics")
    .select("id,slug,title,description,icon,difficulty,word_count")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!topic) notFound();

  // words + progress in parallel
  const [{ data: wordsRaw }, progressResult, topicProgResult] =
    await Promise.all([
      supabase
        .from("words")
        .select(
          "id,topic_id,term,language,definition,pronunciation,example_sentence,icon,difficulty,sort_order",
        )
        .eq("topic_id", topic.id)
        .eq("status", "published")
        .order("sort_order"),
      userId && topic.id
        ? supabase
            .from("user_word_progress")
            .select("word_id,status")
            .eq("user_id", userId)
            .not("word_id", "is", null)
        : Promise.resolve({ data: null }),
      userId
        ? supabase
            .from("user_topic_progress")
            .select("words_seen,words_mastered")
            .eq("user_id", userId)
            .eq("topic_id", topic.id)
            .single()
        : Promise.resolve({ data: null }),
    ]);

  const words = (wordsRaw ?? []) as Word[];
  const wordIds = words.map((w) => w.id);

  // Filter progress to only this topic's words
  let progressMap: Record<string, string> = {};
  if (userId && wordIds.length > 0) {
    const { data: prog } = await supabase
      .from("user_word_progress")
      .select("word_id,status")
      .eq("user_id", userId)
      .in("word_id", wordIds);
    progressMap = Object.fromEntries(
      (prog ?? []).map((p) => [p.word_id, p.status]),
    );
  }

  const topicProgress = (
    topicProgResult as {
      data: { words_seen: number; words_mastered: number } | null;
    }
  ).data ?? { words_seen: 0, words_mastered: 0 };
  const pct =
    topic.word_count > 0
      ? Math.round((topicProgress.words_mastered / topic.word_count) * 100)
      : 0;

  return (
    <div className="bg-mesh min-h-screen text-on-surface">
      <TopNavBar />
      <main className="max-w-[1280px] mx-auto px-6 pt-24 md:pt-28 md:px-10 pb-36">
        {/* Breadcrumb + Header */}
        <div className="mb-10">
          <Link href="/" prefetch={true}>
            <button className="group flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6">
              <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span className="text-sm font-bold">Back to Home</span>
            </button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-primary-container/20 rounded-xl flex items-center justify-center shrink-0 mt-1">
                <span className="material-symbols-outlined text-primary text-2xl">
                  {topic.icon}
                </span>
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-headline font-black text-on-background tracking-tighter">
                  {topic.title}
                </h1>
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-wider capitalize">
                    {topic.difficulty}
                  </span>
                  {topic.description && (
                    <p className="text-on-surface-variant text-sm">
                      {topic.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="glass-card px-5 py-2.5 rounded-2xl flex flex-col items-center">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Words
                </span>
                <span className="text-2xl font-black text-primary">
                  {topic.word_count}
                </span>
              </div>
              {words.length >= 2 && (
                <Link href={`/quiz/${slug}`} prefetch={true}>
                  <button className="h-12 md:h-14 px-6 md:px-8 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-base md:text-lg shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2">
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

        {/* Flashcards */}
        {words.length === 0 ? (
          <div className="text-center py-24 text-on-surface-variant">
            <span className="material-symbols-outlined text-6xl mb-4 block opacity-20">
              menu_book
            </span>
            <p className="text-lg font-medium">No words in this topic yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {words.map((w, i) => (
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

      {/* Floating Progress — only for logged-in */}
      {userId && topic.word_count > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 glass-card rounded-full px-6 py-3 shadow-2xl flex items-center gap-5 border border-white/40 z-40">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-primary text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Progress
              </span>
              <span className="text-sm font-black text-on-surface">
                {topicProgress.words_mastered}/{topic.word_count}
              </span>
            </div>
          </div>
          <div className="h-6 w-px bg-outline-variant/30" />
          <div className="w-24 h-2 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary-fixed-dim"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-primary w-8 text-right">
            {pct}%
          </span>
        </div>
      )}
    </div>
  );
}
