import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TopNavBar from "@/components/TopNavBar";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Lấy topics
  const { data: topics = [] } = await supabase
    .from("topics")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");

  // Lấy progress nếu đã đăng nhập
  let progressMap: Record<
    string,
    { words_seen: number; words_mastered: number }
  > = {};
  if (user) {
    const { data: progress } = await supabase
      .from("user_topic_progress")
      .select("topic_id, words_seen, words_mastered")
      .eq("user_id", user.id);
    progressMap = Object.fromEntries(
      (progress ?? []).map((p: any) => [p.topic_id, p]),
    );
  }

  // Lấy profile nếu đã đăng nhập
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const VARIANT_COLORS = [
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

  return (
    <>
      <TopNavBar />
      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24">
        {/* ── Hero ── */}
        <section className="max-w-7xl mx-auto mb-24">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
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
                Immerse yourself in a premium linguistic experience. Curated
                topics and spaced repetition transform vocabulary learning into
                natural flow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {user ? (
                  <Link href="/progress">
                    <button className="px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-[0_10px_20px_-5px_rgba(70,71,211,0.3)]">
                      Continue Learning
                    </button>
                  </Link>
                ) : (
                  <Link href="/register">
                    <button className="px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-[0_10px_20px_-5px_rgba(70,71,211,0.3)]">
                      Start Learning Free
                    </button>
                  </Link>
                )}
                <Link href="#topics">
                  <button className="px-8 py-4 bg-surface-container-highest text-primary rounded-xl font-bold text-lg hover:bg-surface-container-high transition-all">
                    Browse Topics
                  </button>
                </Link>
              </div>
            </div>
            <div className="flex-1 relative hidden lg:block">
              <div className="w-full aspect-square rounded-[3rem] overflow-hidden rotate-3 shadow-2xl relative z-10">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBO442YvritwHA8Z2EHonZDUKqhiyg2kZH6D5zokoC0-PEJbdWTUrPZWilbxcHArFPqWo584cK1VgnJXeieAKfhpRvAKtxTaYYXpXKH62nuKVmLqpL3k03SwMeO1o9Z992W7_AY-7cNhyav7MPHcUkpNk8hYNTOsQSQUmOVf0afb3g_n3-CB2wzo66t3LcxfsgDrozvNIswSGachzOLKO9knc0IZuIzYeVGXf5CHwHTH_ZLcBP_X1zQNpaXW7vSfNLZO5MFG8DgH1LF"
                  alt="Learning"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-tertiary-container/30 blur-3xl rounded-full" />
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-secondary-container/30 blur-3xl rounded-full" />
            </div>
          </div>
        </section>

        {/* ── Topics ── */}
        <section id="topics" className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold font-headline text-on-surface">
                Explore Topics
              </h2>
              <p className="text-on-surface-variant mt-1">
                Choose a category to expand your lexicon
              </p>
            </div>
          </div>

          {topics.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-4 block opacity-30">
                category
              </span>
              <p>No topics yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topics.map((t: any, i: number) => {
                const c = VARIANT_COLORS[i % VARIANT_COLORS.length];
                const prog = progressMap[t.id];
                const learned = prog?.words_mastered ?? 0;
                const total = t.word_count || 1;
                const pct = Math.round((learned / total) * 100);
                return (
                  <Link key={t.id} href={`/topic/${t.slug}`}>
                    <div className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:shadow-[0_20px_40px_-10px_rgba(32,48,68,0.1)] hover:-translate-y-2 transition-all duration-300 cursor-pointer h-full">
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
                      <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                        {t.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-on-surface-variant">
                            {learned}/{t.word_count} words mastered
                          </span>
                          <span className={c.pct}>{pct}%</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${c.grad} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Stats (nếu đã đăng nhập) ── */}
        {user && profile && (
          <section className="max-w-7xl mx-auto mt-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 bg-white/40 glass-refraction p-12 rounded-[2rem] flex flex-col justify-center space-y-6">
                <h3 className="text-4xl font-extrabold font-headline leading-tight">
                  Your cognitive momentum is strong,{" "}
                  {profile.display_name ?? profile.username}!
                </h3>
                <p className="text-on-surface-variant text-lg leading-relaxed">
                  Keep the streak alive to unlock advanced linguistic
                  certifications.
                </p>
                <div className="flex gap-8 pt-4">
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
                      Points Earned
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 bg-gradient-to-br from-indigo-600 to-cyan-500 p-1 rounded-[2rem]">
                <div className="bg-surface-container-lowest w-full h-full rounded-[1.9rem] p-10 flex flex-col items-center text-center justify-center">
                  <div className="w-24 h-24 bg-tertiary-container/30 rounded-full flex items-center justify-center mb-6">
                    <span
                      className="material-symbols-outlined text-tertiary text-5xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      workspace_premium
                    </span>
                  </div>
                  <h4 className="text-2xl font-bold font-headline mb-2">
                    Weekly Goal
                  </h4>
                  <p className="text-on-surface-variant mb-6 text-sm">
                    Daily goal: {profile.daily_goal} words per day
                  </p>
                  <Link href="/progress" className="w-full">
                    <button className="w-full py-4 bg-on-surface text-surface rounded-xl font-bold hover:opacity-90 transition-all">
                      View Progress
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── CTA nếu chưa đăng nhập ── */}
        {!user && (
          <section className="max-w-7xl mx-auto mt-32">
            <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-1 rounded-[2rem]">
              <div className="bg-surface-container-lowest rounded-[1.9rem] p-16 text-center space-y-6">
                <h3 className="text-4xl font-extrabold font-headline">
                  Ready to start your journey?
                </h3>
                <p className="text-on-surface-variant text-lg max-w-xl mx-auto">
                  Join thousands of learners mastering vocabulary with spaced
                  repetition and beautiful flashcards.
                </p>
                <div className="flex justify-center gap-4 pt-2">
                  <Link href="/register">
                    <button className="px-10 py-4 bg-primary text-on-primary font-bold rounded-xl text-lg hover:scale-105 transition-all shadow-lg">
                      Create Free Account
                    </button>
                  </Link>
                  <Link href="/login">
                    <button className="px-10 py-4 bg-surface-container-highest text-primary font-bold rounded-xl text-lg hover:bg-surface-container-high transition-all">
                      Sign In
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-surface-container-low py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-400 font-headline">
            Lucid Polyglot
          </span>
          <div className="flex gap-12 text-sm font-medium text-on-surface-variant">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
          </div>
          <p className="text-xs text-on-surface-variant/60">
            © 2024 Lucid Polyglot.
          </p>
        </div>
      </footer>
    </>
  );
}
