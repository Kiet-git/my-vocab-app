import TopNavBar from "@/components/TopNavBar";
import Link from "next/link";

const STATS = [
  { label: "Words Mastered", value: "142", icon: "workspace_premium", color: "text-primary", bg: "bg-primary-container/20" },
  { label: "Day Streak",     value: "12",  icon: "local_fire_department", color: "text-orange-500", bg: "bg-orange-100" },
  { label: "Topics Done",   value: "3",   icon: "check_circle", color: "text-tertiary", bg: "bg-tertiary-container/20" },
  { label: "Points Earned", value: "4.8k", icon: "stars", color: "text-secondary", bg: "bg-secondary-container/20" },
];

const TOPICS_PROGRESS = [
  { slug: "travel",     title: "Travel",        icon: "flight_takeoff", learned: 0,  total: 20, color: "from-primary to-secondary-fixed",          iconColor: "text-primary",   iconBg: "bg-primary-container/20" },
  { slug: "food",       title: "Food & Dining",  icon: "restaurant",    learned: 12, total: 20, color: "from-primary to-secondary-fixed",          iconColor: "text-secondary", iconBg: "bg-secondary-container/20" },
  { slug: "work",       title: "Work & Career",  icon: "work",          learned: 5,  total: 20, color: "from-primary to-secondary-fixed",          iconColor: "text-tertiary",  iconBg: "bg-tertiary-container/20" },
  { slug: "nature",     title: "Nature",         icon: "forest",        learned: 0,  total: 20, color: "from-primary to-secondary-fixed",          iconColor: "text-primary",   iconBg: "bg-primary-container/10" },
  { slug: "arts",       title: "Arts & Culture", icon: "palette",       learned: 20, total: 20, color: "from-tertiary to-tertiary-container",      iconColor: "text-tertiary",  iconBg: "bg-tertiary-container/10" },
  { slug: "daily-life", title: "Daily Life",     icon: "home",          learned: 8,  total: 20, color: "from-primary to-secondary-fixed",          iconColor: "text-secondary", iconBg: "bg-secondary-container/10" },
];

const RECENT_ACTIVITY = [
  { word: "Wanderlust",    topic: "Travel",       time: "2 hours ago",  status: "mastered" },
  { word: "Ephemeral",     topic: "Philosophy",   time: "Yesterday",    status: "learning" },
  { word: "Sycophant",     topic: "Psychology",   time: "Yesterday",    status: "mastered" },
  { word: "Dépaysement",   topic: "Travel",       time: "2 days ago",   status: "learning" },
  { word: "Ubiquitous",    topic: "Technology",   time: "3 days ago",   status: "learning" },
];

export default function ProgressPage() {
  const totalLearned = TOPICS_PROGRESS.reduce((a, t) => a + t.learned, 0);
  const totalWords   = TOPICS_PROGRESS.reduce((a, t) => a + t.total, 0);
  const overallPct   = Math.round((totalLearned / totalWords) * 100);

  return (
    <>
      <TopNavBar />
      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto space-y-16">

          {/* ── Page Header ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full">
                <span className="text-primary font-semibold text-sm tracking-wide font-headline">YOUR JOURNEY</span>
              </div>
              <h1 className="text-5xl font-extrabold font-headline tracking-tight text-on-surface">
                My Progress
              </h1>
              <p className="text-on-surface-variant text-lg">
                Track your vocabulary journey and celebrate every milestone.
              </p>
            </div>
            <Link href="/">
              <button className="px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-[0_10px_20px_-5px_rgba(70,71,211,0.3)]">
                Continue Learning
              </button>
            </Link>
          </div>

          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-[0_20px_40px_-10px_rgba(32,48,68,0.06)] flex flex-col gap-4">
                <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${s.color}`}
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
                    {s.icon}
                  </span>
                </div>
                <div>
                  <div className={`text-3xl font-extrabold font-headline ${s.color}`}>{s.value}</div>
                  <div className="text-sm text-on-surface-variant font-medium mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Overall Progress Banner ── */}
          <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-1 rounded-[2rem]">
            <div className="bg-surface-container-lowest rounded-[1.9rem] p-10 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 space-y-4">
                <h2 className="text-3xl font-extrabold font-headline">Overall Vocabulary Mastery</h2>
                <p className="text-on-surface-variant">
                  You&apos;ve learned <span className="text-primary font-bold">{totalLearned}</span> out of{" "}
                  <span className="font-bold">{totalWords}</span> words across all topics.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-on-surface-variant">Total Progress</span>
                    <span className="text-primary">{overallPct}%</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container-low rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary-fixed rounded-full transition-all duration-700"
                      style={{ width: `${overallPct}%` }}
                    />
                  </div>
                </div>
              </div>
              {/* Circular indicator */}
              <div className="relative w-36 h-36 shrink-0">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#eaf1ff" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke="url(#prog)" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - overallPct / 100)}`}
                    className="transition-all duration-700"
                  />
                  <defs>
                    <linearGradient id="prog" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4647d3" />
                      <stop offset="100%" stopColor="#65e1ff" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold font-headline text-primary">{overallPct}%</span>
                  <span className="text-xs text-on-surface-variant font-medium">Mastered</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Per-topic Progress ── */}
          <section>
            <h2 className="text-2xl font-bold font-headline mb-8">Progress by Topic</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TOPICS_PROGRESS.map((t) => {
                const pct = Math.round((t.learned / t.total) * 100);
                return (
                  <Link key={t.slug} href={`/topic/${t.slug}`}>
                    <div className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-[0_20px_40px_-10px_rgba(32,48,68,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                      <div className="flex items-center gap-4 mb-5">
                        <div className={`w-11 h-11 ${t.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <span className={`material-symbols-outlined ${t.iconColor}`}>{t.icon}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold font-headline text-on-surface">{t.title}</h3>
                          <p className="text-xs text-on-surface-variant">{t.learned}/{t.total} words</p>
                        </div>
                        {pct === 100 && (
                          <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold uppercase rounded-full">
                            Done
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-on-surface-variant">Progress</span>
                          <span className={t.iconColor}>{pct}%</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${t.color} transition-all duration-500`}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ── Recent Activity ── */}
          <section>
            <h2 className="text-2xl font-bold font-headline mb-8">Recent Activity</h2>
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-[0_20px_40px_-10px_rgba(32,48,68,0.06)] overflow-hidden">
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className={`flex items-center gap-4 px-8 py-5 hover:bg-surface/50 transition-colors ${i < RECENT_ACTIVITY.length - 1 ? "border-b border-outline-variant/10" : ""}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${a.status === "mastered" ? "bg-tertiary-container/30" : "bg-primary-container/20"}`}>
                    <span
                      className={`material-symbols-outlined text-[18px] ${a.status === "mastered" ? "text-tertiary" : "text-primary"}`}
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                    >
                      {a.status === "mastered" ? "check_circle" : "pending"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-on-surface">{a.word}</p>
                    <p className="text-xs text-on-surface-variant">{a.topic}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      a.status === "mastered"
                        ? "bg-tertiary-container text-on-tertiary-container"
                        : "bg-secondary-container text-on-secondary-container"
                    }`}>
                      {a.status === "mastered" ? "Mastered" : "In Progress"}
                    </span>
                    <p className="text-[10px] text-on-surface-variant mt-1">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-400 font-headline">Lucid Polyglot</span>
          <div className="flex gap-12 text-sm font-medium text-on-surface-variant">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
          <p className="text-xs text-on-surface-variant/60">© 2024 Lucid Polyglot.</p>
        </div>
      </footer>
    </>
  );
}
