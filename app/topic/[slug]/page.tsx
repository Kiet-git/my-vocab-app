import Link from "next/link";
import Flashcard from "@/components/Flashcard";

/* ─── Dữ liệu mẫu – thay bằng fetch Supabase theo slug ─── */
const TOPIC_DATA: Record<string, {
  title: string; level: string; subtitle: string;
  totalWords: number; learnedWords: number;
  cards: React.ComponentProps<typeof Flashcard>[];
}> = {
  travel: {
    title: "Travel Vocabulary",
    level: "Explorer",
    subtitle: "Mastering 45 essential phrases for your next journey",
    totalWords: 45,
    learnedWords: 12,
    cards: [
      { word: "Dépaysement", language: "French",        icon: "translate", variant: "primary",   definition: "The feeling of being in a foreign country; change of scenery.",             example: "J'adore le dépaysement quand je voyage en Asie." },
      { word: "Fernweh",     language: "German",         icon: "luggage",   variant: "secondary", definition: "A longing for far-off places; homesickness for a place you've never been.", example: "I have constant fernweh for the mountains of Chile." },
      { word: "Wanderlust",  language: "German/English", icon: "explore",   variant: "tertiary",  definition: "A strong desire or impulse to wander or travel and explore the world.",      example: "Her wanderlust led her to 50 countries by age 30.", isMastered: true },
      { word: "Itinerary",   language: "English",        icon: "map",       variant: "primary",   definition: "A planned route or journey; a list of places to visit.",                    example: "We need to finalize our itinerary for Paris next week." },
      { word: "Accommodation", language: "English",      icon: "bed",       variant: "secondary", definition: "A room, group of rooms, or building in which someone may live or stay.",    example: "The hostel provided excellent accommodation for travelers." },
      { word: "Voyage",      language: "French",         icon: "train",     variant: "primary",   definition: "A long journey involving travel by sea or in space.",                       example: "Bon voyage! Have a wonderful trip to Iceland." },
    ],
  },
};

/* ─── Fallback cho slug chưa có data ─── */
const FALLBACK = TOPIC_DATA.travel;

export default function TopicPage({ params }: { params: { slug: string } }) {
  const topic = TOPIC_DATA[params.slug] ?? FALLBACK;
  const pct = Math.round((topic.learnedWords / topic.totalWords) * 100);

  return (
    <div className="bg-mesh min-h-screen font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 glass-card border-b border-outline-variant/10 px-6 py-4 md:px-10">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-8 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" fillRule="evenodd" fill="currentColor"
                  d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
                />
              </svg>
            </div>
            <h2 className="text-on-background text-xl font-headline font-bold leading-tight tracking-tight">
              LingoLearn
            </h2>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-on-surface text-sm font-medium hover:text-primary transition-colors">Home</Link>
            <a href="#" className="text-on-surface text-sm font-medium hover:text-primary transition-colors">Library</a>
            <a href="#" className="text-primary text-sm font-bold border-b-2 border-primary pb-1">Flashcards</a>
            <a href="#" className="text-on-surface text-sm font-medium hover:text-primary transition-colors">Profile</a>
          </nav>

          <button className="p-2 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined block">settings</span>
          </button>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-6 py-10 md:px-10 pb-40">

        {/* ── Breadcrumb ── */}
        <div className="mb-8">
          <Link href="/">
            <button className="group flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all mb-4">
              <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
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
                <p className="text-on-surface-variant font-medium">{topic.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="glass-card px-6 py-3 rounded-2xl flex flex-col items-center">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Total Words</span>
                <span className="text-2xl font-black text-primary">{topic.totalWords}</span>
              </div>
              <button className="h-14 px-8 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-headline font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                Start Quiz
              </button>
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
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Session Progress</span>
            <span className="text-sm font-black text-on-surface">{topic.learnedWords} / {topic.totalWords} Word Mastered</span>
          </div>
        </div>
        <div className="h-8 w-px bg-outline-variant/30" />
        <div className="w-32 h-2 bg-surface-container rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-secondary-fixed-dim" style={{ width: `${pct}%` }} />
        </div>
      </div>

    </div>
  );
}
