import TopNavBar from "@/components/TopNavBar";
import Link from "next/link";

const BADGES = [
  { icon: "flight_takeoff", label: "Traveler",       desc: "Completed Travel topic",    earned: true,  color: "text-primary",   bg: "bg-primary-container/20" },
  { icon: "restaurant",     label: "Foodie",          desc: "60% Food & Dining",         earned: true,  color: "text-secondary", bg: "bg-secondary-container/20" },
  { icon: "workspace_premium", label: "Linguist",    desc: "100+ words mastered",        earned: true,  color: "text-tertiary",  bg: "bg-tertiary-container/20" },
  { icon: "local_fire_department", label: "On Fire", desc: "12-day streak",              earned: true,  color: "text-orange-500",bg: "bg-orange-100" },
  { icon: "palette",        label: "Art Lover",       desc: "Complete Arts & Culture",   earned: false, color: "text-outline",   bg: "bg-surface-container-low" },
  { icon: "science",        label: "Scholar",         desc: "Complete 5 topics",         earned: false, color: "text-outline",   bg: "bg-surface-container-low" },
];

const STREAK_DAYS = [
  { day: "Mon", done: true },
  { day: "Tue", done: true },
  { day: "Wed", done: true },
  { day: "Thu", done: true },
  { day: "Fri", done: true },
  { day: "Sat", done: false },
  { day: "Sun", done: false },
];

export default function ProfilePage() {
  return (
    <>
      <TopNavBar />
      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* ── Profile Hero ── */}
          <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-1 rounded-[2rem]">
            <div className="bg-surface-container-lowest rounded-[1.9rem] p-10">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-28 h-28 rounded-[1.5rem] overflow-hidden border-4 border-white shadow-xl">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEerDCP9JVfbV15GlOR6AwFGdtIF5DtBKUb5_ChGpFCMbHs_tQTLTg_HqKP-yYw2aeCP89EZmFrmYccSedLlFx2mQaYfBrDaXRN3pJgd7yl09b7vlZ9He4gwFgHqIemcDDkrTB_2KG4p4YKqqkgb3PoFW8ib48gc7X7ryZY8hY1reJ4LBWyU3xhJUq3VIcFjRFFb-p-3hLW0FpXylC11oo-3hN9vuw0SQpTNZErp2nNiPOUQFBld7FrxRsLRj4pbwPwZj5M6YUeR6J"
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-tertiary-container rounded-full flex items-center justify-center border-2 border-white">
                    <span className="material-symbols-outlined text-tertiary text-[16px]"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
                      workspace_premium
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left space-y-2">
                  <h1 className="text-3xl font-extrabold font-headline text-on-surface">Alex Nguyen</h1>
                  <p className="text-on-surface-variant font-medium">Linguistic Voyager · Level 12</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                    <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-full uppercase tracking-wide">
                      Explorer Rank
                    </span>
                    <span className="px-3 py-1 bg-primary-container/20 text-primary text-xs font-bold rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]"
                        style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>local_fire_department</span>
                      12 Day Streak
                    </span>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex gap-6 shrink-0">
                  {[
                    { label: "Words",   value: "142" },
                    { label: "Topics",  value: "3" },
                    { label: "Points",  value: "4.8k" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="text-2xl font-extrabold font-headline text-primary">{s.value}</div>
                      <div className="text-xs text-on-surface-variant font-medium">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Weekly Streak ── */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-[0_20px_40px_-10px_rgba(32,48,68,0.06)] p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-headline">This Week&apos;s Streak</h2>
              <span className="text-sm text-on-surface-variant font-medium">5 / 7 days</span>
            </div>
            <div className="flex justify-between gap-2">
              {STREAK_DAYS.map((d) => (
                <div key={d.day} className="flex flex-col items-center gap-2 flex-1">
                  <div className={`w-full aspect-square rounded-xl flex items-center justify-center max-w-[52px] ${d.done ? "bg-gradient-to-br from-primary to-secondary-fixed" : "bg-surface-container-low"}`}>
                    <span
                      className={`material-symbols-outlined text-[20px] ${d.done ? "text-white" : "text-outline"}`}
                      style={{ fontVariationSettings: `'FILL' ${d.done ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
                    >
                      {d.done ? "check" : "remove"}
                    </span>
                  </div>
                  <span className={`text-xs font-bold ${d.done ? "text-primary" : "text-on-surface-variant/50"}`}>
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Badges ── */}
          <section>
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-xl font-bold font-headline">Badges & Achievements</h2>
              <span className="text-sm text-on-surface-variant">{BADGES.filter(b => b.earned).length} / {BADGES.length} earned</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {BADGES.map((b) => (
                <div key={b.label} className={`flex flex-col items-center gap-3 p-5 rounded-xl border border-outline-variant/10 text-center transition-all ${b.earned ? "bg-surface-container-lowest hover:shadow-md hover:-translate-y-1" : "bg-surface-container-low/50 opacity-50"}`}>
                  <div className={`w-12 h-12 ${b.bg} rounded-xl flex items-center justify-center`}>
                    <span className={`material-symbols-outlined ${b.color}`}
                      style={{ fontVariationSettings: `'FILL' ${b.earned ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}>
                      {b.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">{b.label}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 leading-tight">{b.desc}</p>
                  </div>
                  {!b.earned && (
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wide">Locked</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Settings Section ── */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-[0_20px_40px_-10px_rgba(32,48,68,0.06)] overflow-hidden">
            <div className="p-8 border-b border-outline-variant/10">
              <h2 className="text-xl font-bold font-headline">Account Settings</h2>
            </div>
            {[
              { icon: "person",        label: "Edit Profile",        desc: "Update your name, avatar and bio" },
              { icon: "notifications", label: "Notifications",       desc: "Daily reminders and progress alerts" },
              { icon: "language",      label: "Learning Language",   desc: "Currently learning: English" },
              { icon: "dark_mode",     label: "Appearance",          desc: "Light mode enabled" },
            ].map((item, i, arr) => (
              <button key={item.label}
                className={`w-full flex items-center gap-4 px-8 py-5 hover:bg-surface/50 transition-colors text-left ${i < arr.length - 1 ? "border-b border-outline-variant/10" : ""}`}>
                <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-on-surface">{item.label}</p>
                  <p className="text-xs text-on-surface-variant">{item.desc}</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant/50">chevron_right</span>
              </button>
            ))}
          </section>

          {/* CTA */}
          <div className="text-center space-y-4">
            <Link href="/progress">
              <button className="px-10 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-[0_10px_20px_-5px_rgba(70,71,211,0.3)]">
                View Full Progress
              </button>
            </Link>
          </div>

        </div>
      </main>

      <footer className="bg-surface-container-low py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-400 font-headline">Lucid Polyglot</span>
          <p className="text-xs text-on-surface-variant/60">© 2024 Lucid Polyglot.</p>
        </div>
      </footer>
    </>
  );
}
