import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TopNavBar from "@/components/TopNavBar";
import type {
  Profile,
  Topic,
  UserTopicProgress,
  StreakLog,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

// ── Local type cho quiz session với topic join ──
type QuizSessionRow = {
  id: string;
  correct_answers: number;
  total_questions: number;
  score_points: number;
  completed_at: string;
  topics: { title: string; icon: string } | null;
};

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

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  const userId = user.id;

  const [
    profileResult,
    topicsResult,
    topicProgressResult,
    recentSessionsResult,
    streakLogsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("topics")
      .select("id,slug,title,icon,word_count,sort_order")
      .eq("is_published", true)
      .order("sort_order"),
    supabase
      .from("user_topic_progress")
      .select("topic_id,words_seen,words_mastered")
      .eq("user_id", userId),
    supabase
      .from("quiz_sessions")
      .select(
        "id,correct_answers,total_questions,score_points,completed_at,topics(title,icon)",
      )
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("streak_logs")
      .select("log_date,goal_reached")
      .eq("user_id", userId)
      .order("log_date", { ascending: false })
      .limit(7),
  ]);

  const profile = profileResult.data as Profile | null;
  const topicList = (topicsResult.data ?? []) as Pick<
    Topic,
    "id" | "slug" | "title" | "icon" | "word_count" | "sort_order"
  >[];
  const progList = (topicProgressResult.data ?? []) as Pick<
    UserTopicProgress,
    "topic_id" | "words_seen" | "words_mastered"
  >[];
  const sessions = (recentSessionsResult.data ?? []) as QuizSessionRow[];
  const logs = (streakLogsResult.data ?? []) as Pick<
    StreakLog,
    "log_date" | "goal_reached"
  >[];

  const progressMap = Object.fromEntries(
    progList.map((tp) => [tp.topic_id, tp]),
  );
  const totalMastered = progList.reduce(
    (acc, tp) => acc + tp.words_mastered,
    0,
  );
  const totalWords = topicList.reduce((acc, t) => acc + t.word_count, 0);
  const overallPct =
    totalWords > 0 ? Math.round((totalMastered / totalWords) * 100) : 0;
  const circumference = 2 * Math.PI * 50;

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split("T")[0];
    return {
      ds,
      day: d.toLocaleDateString("en", { weekday: "short" }),
      done: logs.some((l) => l.log_date === ds && l.goal_reached),
    };
  });

  return (
    <>
      <TopNavBar />
      <main className="pt-28 md:pt-32 pb-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto space-y-14">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center px-4 py-1.5 bg-primary/10 rounded-full">
                <span className="text-primary font-semibold text-sm font-headline">
                  YOUR JOURNEY
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight">
                My Progress
              </h1>
              <p className="text-on-surface-variant">
                Welcome back,{" "}
                <span className="font-bold text-on-surface">
                  {profile?.display_name ?? profile?.username}
                </span>
                !
              </p>
            </div>
            <Link href="/#topics" prefetch={true}>
              <button className="px-7 py-3.5 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
                Continue Learning
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
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
                value: progList.length,
                icon: "category",
                color: "text-tertiary",
                bg: "bg-tertiary-container/20",
              },
              {
                label: "Total Points",
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
                  className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center`}
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
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Banner */}
          <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-1 rounded-[2rem]">
            <div className="bg-surface-container-lowest rounded-[1.9rem] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl md:text-3xl font-extrabold font-headline">
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
                  <div className="h-2.5 w-full bg-surface-container-low rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary-fixed rounded-full"
                      style={{ width: `${overallPct}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="relative w-32 h-32 shrink-0">
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
                    stroke="url(#pg)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - overallPct / 100)}
                  />
                  <defs>
                    <linearGradient id="pg" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4647d3" />
                      <stop offset="100%" stopColor="#65e1ff" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold font-headline text-primary">
                    {overallPct}%
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    Mastered
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Streak */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-headline">Weekly Streak</h2>
              <span className="text-sm text-on-surface-variant">
                {last7.filter((d) => d.done).length}/7 days
              </span>
            </div>
            <div className="flex gap-2 md:gap-3">
              {last7.map((d) => (
                <div
                  key={d.ds}
                  className="flex flex-col items-center gap-2 flex-1"
                >
                  <div
                    className={`w-full aspect-square max-w-[52px] rounded-xl flex items-center justify-center ${d.done ? "bg-gradient-to-br from-primary to-secondary-fixed" : "bg-surface-container-low"}`}
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] md:text-[20px] ${d.done ? "text-white" : "text-outline"}`}
                      style={{
                        fontVariationSettings: `'FILL' ${d.done ? 1 : 0}`,
                      }}
                    >
                      {d.done ? "check" : "remove"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] md:text-xs font-bold ${d.done ? "text-primary" : "text-on-surface-variant/40"}`}
                  >
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Topics */}
          <section>
            <h2 className="text-2xl font-bold font-headline mb-6">
              Progress by Topic
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {topicList.map((t, i) => {
                const c = COLORS[i % COLORS.length];
                const pg = progressMap[t.id];
                const mastered = pg?.words_mastered ?? 0;
                const pct =
                  t.word_count > 0
                    ? Math.round((mastered / t.word_count) * 100)
                    : 0;
                return (
                  <Link key={t.id} href={`/topic/${t.slug}`} prefetch={true}>
                    <div className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer will-change-transform">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                        >
                          <span
                            className={`material-symbols-outlined ${c.iconColor} text-xl`}
                          >
                            {t.icon}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold font-headline text-on-surface truncate">
                            {t.title}
                          </h3>
                          <p className="text-xs text-on-surface-variant">
                            {mastered}/{t.word_count} mastered
                          </p>
                        </div>
                        {pct === 100 && (
                          <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold uppercase rounded-full shrink-0">
                            Done!
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-on-surface-variant">
                            Progress
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
          </section>

          {/* Recent Quizzes */}
          {sessions.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold font-headline mb-6">
                Recent Quizzes
              </h2>
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
                {sessions.map((s, i) => {
                  const qPct = Math.round(
                    (s.correct_answers / s.total_questions) * 100,
                  );
                  const topicInfo = s.topics;
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-4 px-6 py-4 hover:bg-surface/50 transition-colors ${i < sessions.length - 1 ? "border-b border-outline-variant/10" : ""}`}
                    >
                      <div className="w-9 h-9 bg-primary-container/20 rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          {topicInfo?.icon ?? "quiz"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-on-surface truncate">
                          {topicInfo?.title ?? "Quiz"}
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
                      <div className="text-right shrink-0">
                        <p
                          className={`font-bold text-sm ${qPct >= 80 ? "text-tertiary" : qPct >= 50 ? "text-secondary" : "text-error"}`}
                        >
                          {qPct}%
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {s.correct_answers}/{s.total_questions}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-xs font-bold text-primary">
                          +{s.score_points}pts
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

      <footer className="bg-surface-container-low py-10 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-400 font-headline">
            Lucid Polyglot
          </span>
          <p className="text-xs text-on-surface-variant/60">
            © 2025 Lucid Polyglot.
          </p>
        </div>
      </footer>
    </>
  );
}
