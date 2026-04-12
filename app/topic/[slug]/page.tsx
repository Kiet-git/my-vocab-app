import { use } from "react";
import Link from "next/link";
import TopNavBar from "@/components/TopNavBar";
import Flashcard from "@/components/Flashcard";

const TOPIC_DATA: Record<
  string,
  {
    title: string;
    level: string;
    subtitle: string;
    totalWords: number;
    learnedWords: number;
    cards: React.ComponentProps<typeof Flashcard>[];
  }
> = {
  travel: {
    title: "Travel Vocabulary",
    level: "Explorer",
    subtitle: "Mastering 45 essential phrases for your next journey",
    totalWords: 45,
    learnedWords: 12,
    cards: [
      {
        word: "Dépaysement",
        language: "French",
        icon: "translate",
        variant: "primary",
        definition:
          "The feeling of being in a foreign country; change of scenery.",
        example: "J'adore le dépaysement quand je voyage en Asie.",
      },
      {
        word: "Fernweh",
        language: "German",
        icon: "luggage",
        variant: "secondary",
        definition:
          "A longing for far-off places; homesickness for a place you've never been.",
        example: "I have constant fernweh for the mountains of Chile.",
      },
      {
        word: "Wanderlust",
        language: "German/English",
        icon: "explore",
        variant: "tertiary",
        definition:
          "A strong desire or impulse to wander or travel and explore the world.",
        example: "Her wanderlust led her to 50 countries by age 30.",
        isMastered: true,
      },
      {
        word: "Itinerary",
        language: "English",
        icon: "map",
        variant: "primary",
        definition: "A planned route or journey; a list of places to visit.",
        example: "We need to finalize our itinerary for Paris next week.",
      },
      {
        word: "Accommodation",
        language: "English",
        icon: "bed",
        variant: "secondary",
        definition:
          "A room, group of rooms, or building in which someone may live or stay.",
        example: "The hostel provided excellent accommodation for travelers.",
      },
      {
        word: "Voyage",
        language: "French",
        icon: "train",
        variant: "primary",
        definition: "A long journey involving travel by sea or in space.",
        example: "Bon voyage! Have a wonderful trip to Iceland.",
      },
    ],
  },
};

const FALLBACK = TOPIC_DATA.travel;

export default function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // ✅ Next.js 15: unwrap params với React.use()
  const { slug } = use(params);
  const topic = TOPIC_DATA[slug] ?? FALLBACK;
  const pct = Math.round((topic.learnedWords / topic.totalWords) * 100);

  return (
    <div className="bg-mesh min-h-screen font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <TopNavBar />

      <main className="max-w-[1280px] mx-auto px-6 pt-28 md:px-10 pb-40">
        {/* ── Breadcrumb ── */}
        <div className="mb-8">
          <Link href="/">
            <button className="group flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all mb-4">
              <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span className="text-sm font-bold">Back to Home</span>
            </button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-headline font-black text-on-background tracking-tighter">
                {topic.title}
              </h1>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-wider">
                  Level: {topic.level}
                </span>
                <p className="text-on-surface-variant font-medium">
                  {topic.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="glass-card px-6 py-3 rounded-2xl flex flex-col items-center">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Total Words
                </span>
                <span className="text-2xl font-black text-primary">
                  {topic.totalWords}
                </span>
              </div>
              <Link href={`/quiz/${slug}`}>
                <button className="h-14 px-8 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-headline font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontVariationSettings:
                        "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                    }}
                  >
                    play_arrow
                  </span>
                  Start Quiz
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Flashcards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {topic.cards.map((card, i) => (
            <Flashcard key={i} {...card} />
          ))}
        </div>

        {/* ── Pagination ── */}
        <div className="mt-16 flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary" />
            <div className="size-2 rounded-full bg-outline-variant" />
            <div className="size-2 rounded-full bg-outline-variant" />
            <div className="size-2 rounded-full bg-outline-variant" />
          </div>
          <button className="text-sm font-bold text-primary border-b-2 border-primary/20 hover:border-primary transition-all pb-1">
            View All {topic.totalWords} Words
          </button>
        </div>
      </main>

      {/* ── Floating Progress ── */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 glass-card rounded-full px-8 py-4 shadow-2xl flex items-center gap-6 border border-white/40">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-primary text-xl"
              style={{
                fontVariationSettings:
                  "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
              }}
            >
              auto_awesome
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Session Progress
            </span>
            <span className="text-sm font-black text-on-surface">
              {topic.learnedWords} / {topic.totalWords} Word Mastered
            </span>
          </div>
        </div>
        <div className="h-8 w-px bg-outline-variant/30" />
        <div className="w-32 h-2 bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary-fixed-dim"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
