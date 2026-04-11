import Link from "next/link";
import TopNavBar from "@/components/TopNavBar";

const TOPICS = [
  {
    slug: "travel",
    icon: "flight_takeoff",
    title: "Travel",
    desc: "Essential phrases for airports, hotels, and navigating new cities with confidence.",
    learned: 0, total: 20,
    iconBg: "bg-primary-container/20", iconColor: "text-primary",
    pct: "text-primary", grad: "from-primary to-secondary-fixed",
  },
  {
    slug: "food",
    icon: "restaurant",
    title: "Food & Dining",
    desc: "Master culinary terms, ordering at restaurants, and discussing local delicacies.",
    learned: 12, total: 20,
    iconBg: "bg-secondary-container/20", iconColor: "text-secondary",
    pct: "text-secondary", grad: "from-primary to-secondary-fixed",
  },
  {
    slug: "work",
    icon: "work",
    title: "Work & Career",
    desc: "Professional vocabulary for meetings, emails, and corporate environments.",
    learned: 5, total: 20,
    iconBg: "bg-tertiary-container/20", iconColor: "text-tertiary",
    pct: "text-tertiary", grad: "from-primary to-secondary-fixed",
  },
  {
    slug: "nature",
    icon: "forest",
    title: "Nature",
    desc: "Describing the natural world, weather patterns, and environmental landscapes.",
    learned: 0, total: 20,
    iconBg: "bg-primary-container/10", iconColor: "text-primary",
    pct: "text-primary", grad: "from-primary to-secondary-fixed",
  },
  {
    slug: "arts",
    icon: "palette",
    title: "Arts & Culture",
    desc: "Vocabulary for museum visits, cinema, music, and artistic expression.",
    learned: 20, total: 20,
    iconBg: "bg-tertiary-container/10", iconColor: "text-tertiary",
    pct: "text-tertiary", grad: "from-tertiary to-tertiary-container",
  },
  {
    slug: "daily-life",
    icon: "home",
    title: "Daily Life",
    desc: "Common objects, morning routines, and household conversations.",
    learned: 8, total: 20,
    iconBg: "bg-secondary-container/10", iconColor: "text-secondary",
    pct: "text-secondary", grad: "from-primary to-secondary-fixed",
  },
];

export default function HomePage() {
  return (
    <>
      <TopNavBar active="home" />

      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24">

        {/* ── Hero ── */}
        <section className="max-w-7xl mx-auto mb-24 text-center md:text-left">
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
                Immerse yourself in a premium linguistic experience. Our curated
                topics and ethereal interface transform cognitive effort into
                natural flow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/topic/travel">
                  <button className="px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-[0_10px_20px_-5px_rgba(70,71,211,0.3)]">
                    Start Learning Now
                  </button>
                </Link>
                <button className="px-8 py-4 bg-surface-container-highest text-primary rounded-xl font-bold text-lg hover:bg-surface-container-high transition-all">
                  View All Topics
                </button>
              </div>
            </div>

            <div className="flex-1 relative hidden lg:block">
              <div className="w-full aspect-square rounded-[3rem] overflow-hidden rotate-3 shadow-2xl relative z-10">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBO442YvritwHA8Z2EHonZDUKqhiyg2kZH6D5zokoC0-PEJbdWTUrPZWilbxcHArFPqWo584cK1VgnJXeieAKfhpRvAKtxTaYYXpXKH62nuKVmLqpL3k03SwMeO1o9Z992W7_AY-7cNhyav7MPHcUkpNk8hYNTOsQSQUmOVf0afb3g_n3-CB2wzo66t3LcxfsgDrozvNIswSGachzOLKO9knc0IZuIzYeVGXf5CHwHTH_ZLcBP_X1zQNpaXW7vSfNLZO5MFG8DgH1LF"
                  alt="Students studying"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-tertiary-container/30 blur-3xl rounded-full" />
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-secondary-container/30 blur-3xl rounded-full" />
            </div>
          </div>
        </section>

        {/* ── Topic Cards ── */}
        <section className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold font-headline text-on-surface">Explore Topics</h2>
              <p className="text-on-surface-variant">Choose a category to expand your lexicon</p>
            </div>
            <a href="#" className="text-primary font-semibold flex items-center gap-2 hover:translate-x-1 transition-transform">
              View all categories
              <span className="material-symbols-outlined">arrow_forward</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TOPICS.map((t) => {
              const pct = Math.round((t.learned / t.total) * 100);
              return (
                <Link key={t.slug} href={`/topic/${t.slug}`}>
                  <div className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:shadow-[0_20px_40px_-10px_rgba(32,48,68,0.08)] hover:-translate-y-2 transition-all duration-300 cursor-pointer h-full">
                    <div className={`w-14 h-14 ${t.iconBg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <span className={`material-symbols-outlined ${t.iconColor} text-3xl`}>{t.icon}</span>
                    </div>
                    <h3 className="text-2xl font-bold font-headline text-on-surface mb-3">{t.title}</h3>
                    <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">{t.desc}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-on-surface-variant">{t.learned}/{t.total} words learned</span>
                        <span className={t.pct}>{pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${t.grad}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Stats Bento ── */}
        <section className="max-w-7xl mx-auto mt-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white/40 glass-refraction p-12 rounded-[2rem] flex flex-col justify-center space-y-6">
              <h3 className="text-4xl font-extrabold font-headline leading-tight">
                Your cognitive momentum is at an all-time high.
              </h3>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                You&apos;ve mastered <span className="text-primary font-bold">142 words</span> this month.
                Keep the streak alive to unlock advanced linguistic certifications.
              </p>
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold font-headline text-primary">12</div>
                  <div className="text-sm text-on-surface-variant font-medium">Day Streak</div>
                </div>
                <div className="w-px h-12 bg-outline-variant/20" />
                <div>
                  <div className="text-3xl font-bold font-headline text-secondary">4.8k</div>
                  <div className="text-sm text-on-surface-variant font-medium">Points Earned</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-indigo-600 to-cyan-500 p-1 rounded-[2rem]">
              <div className="bg-surface-container-lowest w-full h-full rounded-[1.9rem] p-10 flex flex-col items-center text-center justify-center">
                <div className="w-24 h-24 bg-tertiary-container/30 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-tertiary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    workspace_premium
                  </span>
                </div>
                <h4 className="text-2xl font-bold font-headline mb-2">Weekly Goal</h4>
                <p className="text-on-surface-variant mb-6 text-sm">
                  You are 85% of the way to becoming a &apos;Linguistic Voyager&apos;
                </p>
                <button className="w-full py-4 bg-on-surface text-surface rounded-xl font-bold hover:opacity-90 transition-all">
                  Review Progress
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-surface-container-low py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-400 font-headline">
            Lucid Polyglot
          </span>
          <div className="flex gap-12 text-sm font-medium text-on-surface-variant">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
          </div>
          <p className="text-xs text-on-surface-variant/60">© 2024 Lucid Polyglot. All linguistic rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
