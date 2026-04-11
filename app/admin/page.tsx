"use client";

import Link from "next/link";

/* ─── Data mẫu ─── */
const WORDS = [
  { word: "Ephemeral",  ipa: "/ɪˈfɛmərəl/",   topic: "Philosophy", meaning: "Lasting for a very short time.",               status: "published" },
  { word: "Sycophant",  ipa: "/ˈsɪkəfant/",    topic: "Psychology", meaning: "A person who acts obsequiously toward someone.", status: "published" },
  { word: "Ubiquitous", ipa: "/juːˈbɪkwɪtəs/", topic: "Technology", meaning: "Present, appearing, or found everywhere.",       status: "draft" },
];

const NAV = [
  { icon: "dashboard", label: "Dashboard", active: true },
  { icon: "category",  label: "Topics",    active: false },
  { icon: "menu_book", label: "Words",     active: false },
  { icon: "settings",  label: "Settings",  active: false },
];

export default function AdminPage() {
  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen">

      {/* ── Top Header ── */}
      <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl shadow-[0_20px_40px_-10px_rgba(32,48,68,0.08)] flex justify-between items-center px-8 h-20">
        <Link href="/">
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-400 font-headline cursor-pointer">
            Lucid Polyglot
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex gap-6 font-headline font-semibold tracking-tight">
            <Link href="/" className="text-slate-500 hover:text-indigo-500 transition-all duration-300">Home</Link>
            <a href="#"   className="text-slate-500 hover:text-indigo-500 transition-all duration-300">My Progress</a>
          </nav>
          <div className="h-6 w-[1px] bg-outline-variant/30" />
          <button className="text-indigo-600 font-headline font-semibold tracking-tight border-b-2 border-indigo-500 pb-1">
            Admin
          </button>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsgaHST34Tsg0Q2ftj_O5D2oulsATsukk-XKMM1QpDLXnD-WEABcejUbxRitAArT9sJhHdzf_tbTH7MtnG7DjhN6RWl8-WY9JCBow7IKg2OhWOFR6iVXgEDpYPo7Degkt_kc9fwbEgIf8mlzgLCz4s2dAvoAThKU5xP4CTHNyjFrJBNPqErj-Wp6MdrmeCDCoSUCGw2V-Nh2rOq7KPILCJFdqO35Yc-JvXilXLOPoPdVZR7YuboWjXLriOS3r30azyamDpQSbK-NpU"
            alt="Admin avatar"
            className="w-10 h-10 rounded-full border-2 border-white/50 shadow-sm object-cover"
          />
        </div>
      </header>

      {/* ── Sidebar ── */}
      <aside className="h-screen w-64 fixed left-0 top-20 bg-indigo-50/50 flex flex-col gap-2 p-4 border-r border-slate-200/50 text-sm font-medium z-40">
        <div className="mb-6 p-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">admin_panel_settings</span>
            </div>
            <div>
              <p className="font-bold text-on-surface">Admin Panel</p>
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60">Management Suite</p>
            </div>
          </div>
        </div>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <a
              key={n.label}
              href="#"
              className={`flex items-center gap-3 p-3 rounded-xl transition-transform hover:translate-x-1 ${
                n.active
                  ? "bg-white text-indigo-600 font-bold shadow-sm"
                  : "text-slate-500 hover:bg-indigo-50/80"
              }`}
            >
              <span className="material-symbols-outlined">{n.icon}</span>
              <span>{n.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="ml-64 pt-28 px-8 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">

          <header className="mb-10">
            <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
              Language Repository
            </h1>
            <p className="text-on-surface-variant font-medium">
              Manage your educational content and curate the vocabulary experience.
            </p>
          </header>

          {/* ── Top grid: Add Topic + Add Word ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left – Add Topic + Stats */}
            <section className="lg:col-span-1 space-y-8">
              <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_20px_40px_-10px_rgba(32,48,68,0.08)] border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-secondary-container rounded-lg">
                    <span className="material-symbols-outlined text-on-secondary-container">create_new_folder</span>
                  </div>
                  <h2 className="text-xl font-bold font-headline">Add New Topic</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 ml-1">
                      Topic Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Culinary Arts"
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-fixed focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <button className="w-full py-3 px-6 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md">
                    Create Topic
                  </button>
                </div>
              </div>

              <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
                <h3 className="text-sm font-bold text-on-surface-variant mb-4 uppercase tracking-widest">Platform Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-lowest p-4 rounded-xl">
                    <p className="text-xs text-on-surface-variant">Total Topics</p>
                    <p className="text-2xl font-bold font-headline text-primary">24</p>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-xl">
                    <p className="text-xs text-on-surface-variant">Active Words</p>
                    <p className="text-2xl font-bold font-headline text-secondary">1,482</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Right – Add Word */}
            <section className="lg:col-span-2">
              <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_20px_40px_-10px_rgba(32,48,68,0.08)] border border-outline-variant/10 h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-primary-container rounded-lg">
                    <span className="material-symbols-outlined text-on-primary-container">add_circle</span>
                  </div>
                  <h2 className="text-xl font-bold font-headline">Add New Word</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 ml-1">Select Topic</label>
                    <select className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-fixed focus:bg-white transition-all appearance-none outline-none">
                      <option>Business Essentials</option>
                      <option>Travel &amp; Tourism</option>
                      <option>Academic Writing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 ml-1">Word</label>
                    <input type="text" placeholder="e.g., Ethereal"
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-fixed focus:bg-white transition-all outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 ml-1">Meaning</label>
                    <input type="text" placeholder="Definition of the word"
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-fixed focus:bg-white transition-all outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 ml-1">Pronunciation (IPA)</label>
                    <input type="text" placeholder="/ɪˈθɪəriəl/"
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-fixed focus:bg-white transition-all outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 ml-1">Example Sentence</label>
                    <textarea rows={3} placeholder="How is it used in context?"
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-fixed focus:bg-white transition-all outline-none resize-none" />
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-4 mt-2">
                    <button className="px-6 py-3 text-on-surface-variant font-bold hover:bg-surface-container-low rounded-xl transition-all">
                      Discard
                    </button>
                    <button className="px-10 py-3 bg-primary text-on-primary font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
                      Save Word
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ── Recent Vocabulary Table ── */}
          <section className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_-10px_rgba(32,48,68,0.08)] border border-outline-variant/10 overflow-hidden">
            <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-xl font-bold font-headline">Recent Vocabulary</h2>
                <p className="text-sm text-on-surface-variant">Review and edit the latest additions to your library</p>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">search</span>
                <input type="text" placeholder="Search words..."
                  className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-primary-fixed outline-none" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    {["Word", "Topic", "Meaning", "Status", "Actions"].map((h, i) => (
                      <th key={h} className={`px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest ${i === 4 ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {WORDS.map((row) => (
                    <tr key={row.word} className="hover:bg-surface/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-primary">{row.word}</span>
                          <span className="text-xs text-on-surface-variant italic">{row.ipa}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-surface-container-high text-on-secondary-container rounded-full text-xs font-bold">
                          {row.topic}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm text-on-surface-variant line-clamp-1">{row.meaning}</p>
                      </td>
                      <td className="px-8 py-5">
                        {row.status === "published" ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Published
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Draft
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/20 rounded-lg transition-all">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-all">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-surface-container-low/30 flex items-center justify-between">
              <p className="text-xs font-medium text-on-surface-variant">Showing 3 of 1,482 words</p>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-xs font-bold bg-white border border-outline-variant/20 rounded-lg hover:bg-surface transition-all">Previous</button>
                <button className="px-4 py-2 text-xs font-bold bg-white border border-outline-variant/20 rounded-lg hover:bg-surface transition-all">Next</button>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <div className="fixed bottom-0 left-0 w-full md:hidden bg-white/80 backdrop-blur-xl border-t border-slate-200 z-50 px-6 py-3 flex justify-between items-center">
        {(["dashboard", "category", null, "menu_book", "settings"] as (string | null)[]).map((icon, i) =>
          icon === null ? (
            <button key="fab" className="w-12 h-12 bg-primary rounded-full -translate-y-6 shadow-lg flex items-center justify-center text-on-primary ring-4 ring-surface">
              <span className="material-symbols-outlined">add</span>
            </button>
          ) : (
            <button key={icon} className={`flex flex-col items-center gap-1 ${i === 0 ? "text-indigo-600" : "text-slate-400"}`}>
              <span className="material-symbols-outlined">{icon}</span>
              <span className="text-[10px] font-bold">{["Dash", "Topics", "", "Words", "Settings"][i]}</span>
            </button>
          )
        )}
      </div>

    </div>
  );
}
