import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TopNavBar from "@/components/TopNavBar";

export const revalidate = 0;

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: topics },
    { data: topicProgress },
    { data: recentSessions },
    { data: streakLogs },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("topics")
      .select("*")
      .eq("is_published", true)
      .order("sort_order"),
    supabase.from("user_topic_progress").select("*").eq("user_id", user.id),
    supabase
      .from("quiz_sessions")
      .select("*, topics(title,icon)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("streak_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(7),
  ]);

  const progressMap = Object.fromEntries(
    (topicProgress ?? []).map((p: any) => [p.topic_id, p]),
  );

  const totalLearned = (topicProgress ?? []).reduce(
    (a: number, p: any) => a + p.words_seen,
    0,
  );
  const totalMastered = (topicProgress ?? []).reduce(
    (a: number, p: any) => a + p.words_mastered,
    0,
  );
  const totalWords = (topics ?? []).reduce((a: number, t: any) => a + t.word_count, 0);
  const overallPct =
    totalWords > 0 ? Math.round((totalMastered / totalWords) * 100) : 0;

  // Streak last 7 days
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const log = (streakLogs ?? []).find((l: any) => l.log_date === dateStr);
    return {
      date: dateStr,
      day: d.toLocaleDateString("en", { weekday: "short" }),
      done: log?.goal_reached ?? false,
    };
  });

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

  return (
    <>
      <TopNavBar />
      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full">
                <span className="text-primary font-semibold text-sm tracking-wide font-headline">
                  YOUR JOURNEY
                </span>
              </div>
              <h1 className="text-5xl font-extrabold font-headline tracking-tight">
                My Progress
              </h1>
              <p className="text-on-surface-variant text-lg">
                Welcome back,{" "}
                <span className="font-bold text-on-surface">
                  {profile?.display_name ?? profile?.username}
                </span>
                !
              </p>
            </div>
            <Link href="/#topics">
              <button className="px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-[0_10px_20px_-5px_rgba(70,71,211,0.3)]">
                Continue Learning
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Words Mastered",
                value: totalMastered,
                icon: "workspace_premium",
                color: "text-primary",
                bg: "bg-primary-container/20",
              },
              {
                label: "Day Streak",
                value: profile?.current_streak ?? 0,
                icon: "local_fire_department",
                color: "text-orange-500",
                bg: "bg-orange-100",
              },
              {
                label: "Topics Active",
                value: (topicProgress ?? []).length,
                icon: "category",
                color: "text-tertiary",
                bg: "bg-tertiary-container/20",
              },
              {
                label: "Points",
                value: profile?.total_points ?? 0,
                icon: "stars",
                color: "text-secondary",
                bg: "bg-secondary-container/20",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm space-y-3"
              >
                <div
                  className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center`}
                >
                  <span
                    className={`material-symbols-outlined ${s.color}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {s.icon}
                  </span>
                </div>
                <div>
                  <div
                    className={`text-3xl font-extrabold font-headline ${s.color}`}
                  >
                    {s.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-on-surface-variant font-medium mt-0.5">
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Progress Banner */}
          <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-1 rounded-[2rem]">
            <div className="bg-surface-container-lowest rounded-[1.9rem] p-10 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 space-y-4">
                <h2 className="text-3xl font-extrabold font-headline">
                  Overall Mastery
                </h2>
                <p className="text-on-surface-variant">
                  <span className="text-primary font-bold">
                    {totalMastered}
                  </span>{" "}
                  of <span className="font-bold">{totalWords}</span> words
                  mastered across all topics.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-on-surface-variant">Progress</span>
                    <span className="text-primary">{overallPct}%</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container-low rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary-fixed rounded-full transition-all"
                      style={{ width: `${overallPct}%` }}
                    />
                  </div>
                </div>
              </div>
              {/* Circular */}
              <div className="relative w-36 h-36 shrink-0">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#eaf1ff"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="url(#prog)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - overallPct / 100)}`}
                  />
                  <defs>
                    <linearGradient id="prog" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4647d3" />
                      <stop offset="100%" stopColor="#65e1ff" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold font-headline text-primary">
                    {overallPct}%
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    Mastered
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Streak Calendar */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-headline">Weekly Streak</h2>
              <span className="text-sm text-on-surface-variant">
                {last7.filter((d) => d.done).length} / 7 days
              </span>
            </div>
            <div className="flex gap-3">
              {last7.map((d) => (
                <div
                  key={d.date}
                  className="flex flex-col items-center gap-2 flex-1"
                >
                  <div
                    className={`w-full aspect-square rounded-xl flex items-center justify-center max-w-[52px] ${d.done ? "bg-gradient-to-br from-primary to-secondary-fixed" : "bg-surface-container-low"}`}
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] ${d.done ? "text-white" : "text-outline"}`}
                      style={{
                        fontVariationSettings: `'FILL' ${d.done ? 1 : 0}`,
                      }}
                    >
                      {d.done ? "check" : "remove"}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold ${d.done ? "text-primary" : "text-on-surface-variant/50"}`}
                  >
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Topics Progress */}
          <section>
            <h2 className="text-2xl font-bold font-headline mb-8">
              Progress by Topic
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(topics ?? []).map((t: any, i: number) => {
                const c = COLORS[i % COLORS.length];
                const prog = progressMap[t.id];
                const mastered = prog?.words_mastered ?? 0;
                const pct =
                  t.word_count > 0
                    ? Math.round((mastered / t.word_count) * 100)
                    : 0;
                return (
                  <Link key={t.id} href={`/topic/${t.slug}`}>
                    <div className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
                      <div className="flex items-center gap-4 mb-5">
                        <div
                          className={`w-11 h-11 ${c.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                        >
                          <span
                            className={`material-symbols-outlined ${c.iconColor}`}
                          >
                            {t.icon}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold font-headline text-on-surface">
                            {t.title}
                          </h3>
                          <p className="text-xs text-on-surface-variant">
                            {mastered}/{t.word_count} mastered
                          </p>
                        </div>
                        {pct === 100 && (
                          <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold uppercase rounded-full">
                            Done!
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-on-surface-variant">
                            Progress
                          </span>
                          <span className={c.pct}>{pct}%</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${c.grad} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Recent Quiz Sessions */}
          {recentSessions && recentSessions.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold font-headline mb-8">
                Recent Quizzes
              </h2>
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
                {recentSessions.map((s: any, i: number) => {
                  const pct = Math.round(
                    (s.correct_answers / s.total_questions) * 100,
                  );
                  const topic = s.topics as {
                    title: string;
                    icon: string;
                  } | null;
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-4 px-8 py-5 hover:bg-surface/50 transition-colors ${i < recentSessions.length - 1 ? "border-b border-outline-variant/10" : ""}`}
                    >
                      <div className="w-10 h-10 bg-primary-container/20 rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          {topic?.icon ?? "quiz"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-on-surface">
                          {topic?.title ?? "Quiz"}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {new Date(s.completed_at).toLocaleDateString("en", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${pct >= 80 ? "text-tertiary" : pct >= 50 ? "text-secondary" : "text-error"}`}
                        >
                          {pct}%
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {s.correct_answers}/{s.total_questions} correct
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <span className="text-xs font-bold text-primary">
                          +{s.score_points} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="bg-surface-container-low py-12 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-400 font-headline">
            Lucid Polyglot
          </span>
          <p className="text-xs text-on-surface-variant/60">
            © 2024 Lucid Polyglot.
          </p>
        </div>
      </footer>
    </>
  );
}
