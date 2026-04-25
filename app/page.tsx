import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import TopNavBar from "@/components/TopNavBar";
import { TopicsGridSkeleton } from "@/components/Skeleton";

const COLORS = [
  {
    iconBg: "bg-primary-container/20",
    iconColor: "text-primary",
    pct: "text-primary",
    grad: "from-primary to-secondary-fixed",
  },
  {
    iconBg: "bg-secondary-container/20",
    iconColor: "text-secondary",
    pct: "text-secondary",
    grad: "from-primary to-secondary-fixed",
  },
  {
    iconBg: "bg-tertiary-container/20",
    iconColor: "text-tertiary",
    pct: "text-tertiary",
    grad: "from-tertiary to-tertiary-container",
  },
  {
    iconBg: "bg-primary-container/10",
    iconColor: "text-primary",
    pct: "text-primary",
    grad: "from-primary to-secondary-fixed",
  },
];

// ── Async sub-components (streamed via Suspense) ──────────────────

async function TopicsSection({ userId }: { userId?: string }) {
  const supabase = await createClient();

  const [{ data: topics }, progressResult] = await Promise.all([
    supabase
      .from("topics")
      .select("id,slug,title,description,icon,word_count,sort_order")
      .eq("is_published", true)
      .order("sort_order"),
    userId
      ? supabase
          .from("user_topic_progress")
          .select("topic_id,words_mastered")
          .eq("user_id", userId)
      : Promise.resolve({ data: null }),
  ]);

  const progressMap = Object.fromEntries(
    (
      (progressResult.data ?? []) as {
        topic_id: string;
        words_mastered: number;
      }[]
    ).map((p) => [p.topic_id, p.words_mastered]),
  );

  if (!topics || topics.length === 0) {
    return (
      <div className="text-center py-20 text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl mb-4 block opacity-30">
          category
        </span>
        <p>No topics yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {topics.map((t, i) => {
        const c = COLORS[i % COLORS.length];
        const mastered = progressMap[t.id] ?? 0;
        const total = t.word_count || 1;
        const pct = Math.round((mastered / total) * 100);
        return (
          <Link key={t.id} href={`/topic/${t.slug}`} prefetch={true}>
            <div className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:shadow-[0_20px_40px_-10px_rgba(32,48,68,0.1)] hover:-translate-y-2 transition-all duration-300 cursor-pointer h-full will-change-transform">
              <div
                className={`w-14 h-14 ${c.iconBg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
              >
                <span
                  className={`material-symbols-outlined ${c.iconColor} text-3xl`}
                >
                  {t.icon}
                </span>
              </div>
              <h3 className="text-2xl font-bold font-headline text-on-surface mb-3">
                {t.title}
              </h3>
              <p className="text-on-surface-variant text-sm mb-6 leading-relaxed line-clamp-3">
                {t.description}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-on-surface-variant">
                    {mastered}/{t.word_count} mastered
                  </span>
                  <span className={c.pct}>{pct}%</span>
                </div>
                <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${c.grad}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

async function UserStatsSection({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,username,current_streak,total_points,daily_goal")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  return (
    <section className="max-w-7xl mx-auto mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white/40 glass-refraction p-10 md:p-12 rounded-[2rem] flex flex-col justify-center space-y-5">
          <h3 className="text-3xl md:text-4xl font-extrabold font-headline leading-tight">
            Welcome back,{" "}
            <span className="text-primary">
              {profile.display_name ?? profile.username}
            </span>
            !
          </h3>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            Keep the streak alive to unlock advanced certifications.
          </p>
          <div className="flex gap-8 pt-2">
            <div>
              <div className="text-3xl font-bold font-headline text-primary">
                {profile.current_streak}
              </div>
              <div className="text-sm text-on-surface-variant font-medium">
                Day Streak
              </div>
            </div>
            <div className="w-px h-12 bg-outline-variant/20" />
            <div>
              <div className="text-3xl font-bold font-headline text-secondary">
                {profile.total_points.toLocaleString()}
              </div>
              <div className="text-sm text-on-surface-variant font-medium">
                Points
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-600 to-cyan-500 p-1 rounded-[2rem]">
          <div className="bg-surface-container-lowest h-full rounded-[1.9rem] p-10 flex flex-col items-center text-center justify-center gap-4">
            <div className="w-20 h-20 bg-tertiary-container/30 rounded-full flex items-center justify-center">
              <span
                className="material-symbols-outlined text-tertiary text-5xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                workspace_premium
              </span>
            </div>
            <h4 className="text-2xl font-bold font-headline">Weekly Goal</h4>
            <p className="text-on-surface-variant text-sm">
              Daily: {profile.daily_goal} words/day
            </p>
            <Link href="/progress" className="w-full" prefetch={true}>
              <button className="w-full py-3.5 bg-on-surface text-surface rounded-xl font-bold hover:opacity-90 transition-opacity">
                View Progress →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Root session check ─────────────────────────────────────────────

async function SessionCheck() {
  const supabase = await createClient();
  // Use getUser() for secure auth check in server components
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  return (
    <main className="pt-28 md:pt-32 pb-24 px-6 md:px-12 lg:px-24">
      {/* Hero — fully static HTML */}
      <section className="max-w-7xl mx-auto mb-20 md:mb-24">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
          <div className="flex-1 space-y-7">
            <div className="inline-flex items-center px-4 py-2 bg-secondary-container/20 rounded-full border border-secondary-container/10">
              <span className="text-secondary font-semibold text-sm tracking-wide font-headline">
                START YOUR JOURNEY
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold font-headline leading-[1.1] tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary-fixed">
                Master Your Vocabulary
              </span>
              <br />
              <span className="text-on-surface">Effortlessly.</span>
            </h1>
            <p className="text-on-surface-variant text-xl max-w-2xl leading-relaxed">
              Curated topics and spaced repetition transform vocabulary learning
              into natural flow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {userId ? (
                <Link href="/progress" prefetch={true}>
                  <button className="px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
                    Continue Learning
                  </button>
                </Link>
              ) : (
                <Link href="/register" prefetch={true}>
                  <button className="px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
                    Start Learning Free
                  </button>
                </Link>
              )}
              <Link href="#topics">
                <button className="px-8 py-4 bg-surface-container-highest text-primary rounded-xl font-bold text-lg hover:bg-surface-container-high transition-colors">
                  Browse Topics
                </button>
              </Link>
            </div>
          </div>
          <div className="flex-1 relative hidden lg:block">
            <div className="w-full aspect-square rounded-[3rem] overflow-hidden rotate-3 shadow-2xl z-10 relative">
              {/* ✅ Next.js 16: use next/image instead of <img> */}
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBO442YvritwHA8Z2EHonZDUKqhiyg2kZH6D5zokoC0-PEJbdWTUrPZWilbxcHArFPqWo584cK1VgnJXeieAKfhpRvAKtxTaYYXpXKH62nuKVmLqpL3k03SwMeO1o9Z992W7_AY-7cNhyav7MPHcUkpNk8hYNTOsQSQUmOVf0afb3g_n3-CB2wzo66t3LcxfsgDrozvNIswSGachzOLKO9knc0IZuIzYeVGXf5CHwHTH_ZLcBP_X1zQNpaXW7vSfNLZO5MFG8DgH1LF"
                alt="Students studying"
                width={600}
                height={600}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-tertiary-container/30 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-secondary-container/30 blur-3xl rounded-full pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Topics — streamed */}
      <section id="topics" className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-bold font-headline text-on-surface">
            Explore Topics
          </h2>
          <p className="text-on-surface-variant mt-1">
            Choose a category to expand your lexicon
          </p>
        </div>
        <Suspense fallback={<TopicsGridSkeleton />}>
          <TopicsSection userId={userId} />
        </Suspense>
      </section>

      {/* User stats — streamed */}
      {userId ? (
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto mt-24">
              <div className="skeleton h-56 rounded-[2rem]" />
            </div>
          }
        >
          <UserStatsSection userId={userId} />
        </Suspense>
      ) : (
        <section className="max-w-7xl mx-auto mt-24">
          <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-1 rounded-[2rem]">
            <div className="bg-surface-container-lowest rounded-[1.9rem] p-12 md:p-16 text-center space-y-6">
              <h3 className="text-3xl md:text-4xl font-extrabold font-headline">
                Ready to start?
              </h3>
              <p className="text-on-surface-variant text-lg max-w-xl mx-auto">
                Join thousands of learners mastering vocabulary with spaced
                repetition.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Link href="/register" prefetch={true}>
                  <button className="px-10 py-4 bg-primary text-on-primary font-bold rounded-xl text-lg hover:opacity-90 transition-opacity shadow-lg">
                    Create Free Account
                  </button>
                </Link>
                <Link href="/login" prefetch={true}>
                  <button className="px-10 py-4 bg-surface-container-highest text-primary font-bold rounded-xl text-lg hover:bg-surface-container-high transition-colors">
                    Sign In
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

// ── Page export ───────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <TopNavBar />
      <Suspense
        fallback={
          <main className="pt-28 md:pt-32 pb-24 px-6 md:px-12 lg:px-24">
            <div className="max-w-7xl mx-auto space-y-20">
              <div className="skeleton h-64 rounded-[2rem]" />
              <TopicsGridSkeleton />
            </div>
          </main>
        }
      >
        <SessionCheck />
      </Suspense>
      <footer className="bg-surface-container-low py-10 px-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-400 font-headline">
            Lucid Polyglot
          </span>
          <div className="flex gap-8 text-sm font-medium text-on-surface-variant">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
          </div>
          <p className="text-xs text-on-surface-variant/60">
            © 2025 Lucid Polyglot.
          </p>
        </div>
      </footer>
    </>
  );
}
