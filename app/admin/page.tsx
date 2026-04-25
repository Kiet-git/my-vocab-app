"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Topic, Word, WordStatus, WordWithTopic } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";

type Tab = "dashboard" | "topics" | "words" | "users";
type Toast = { msg: string; type: "success" | "error" } | null;

const ICONS = [
  "book",
  "flight_takeoff",
  "restaurant",
  "work",
  "forest",
  "palette",
  "home",
  "science",
  "music_note",
  "sports_soccer",
  "favorite",
  "star",
  "translate",
  "school",
  "language",
  "psychology",
  "travel_explore",
  "fitness_center",
  "medical_services",
  "computer",
];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

function Spinner({ sm }: { sm?: boolean }) {
  return (
    <span
      className={`border-2 border-primary/30 border-t-primary rounded-full animate-spin inline-block ${sm ? "w-4 h-4" : "w-5 h-5"}`}
    />
  );
}

function Toast({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium ${toast.type === "success" ? "bg-tertiary-container text-on-tertiary-container" : "bg-error-container/90 text-on-error-container"}`}
    >
      <span
        className="material-symbols-outlined text-[18px]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {toast.type === "success" ? "check_circle" : "error"}
      </span>
      {toast.msg}
      <button onClick={onClose}>
        <span className="material-symbols-outlined text-[16px] opacity-60">
          close
        </span>
      </button>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [toast, setToast] = useState<Toast>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user: User | null = data.user;
      if (!user || user.app_metadata?.role !== "admin") router.push("/");
      else setChecking(false);
    };
    checkUser();
  }, [supabase, router]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  if (checking)
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Spinner />
      </div>
    );

  const NAV: { id: Tab; icon: string; label: string }[] = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "topics", icon: "category", label: "Topics" },
    { id: "words", icon: "menu_book", label: "Words" },
    { id: "users", icon: "group", label: "Users" },
  ];

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <header className="fixed top-0 w-full z-40 bg-white/70 backdrop-blur-xl border-b border-outline-variant/10 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/">
            <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-400 font-headline cursor-pointer">
              Lucid Polyglot
            </span>
          </Link>
          <span className="px-2 py-0.5 bg-primary-container/30 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full">
            Admin
          </span>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors font-medium"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Back to Site
        </Link>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 w-52 h-[calc(100vh-4rem)] bg-surface-container-low/50 border-r border-outline-variant/10 p-3 flex flex-col gap-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === n.id ? "bg-white text-primary shadow-sm border border-primary/10" : "text-on-surface-variant hover:bg-surface-container"}`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {n.icon}
              </span>
              {n.label}
            </button>
          ))}
        </aside>

        <main className="ml-52 flex-1 p-8">
          {tab === "dashboard" && <DashboardTab supabase={supabase} />}
          {tab === "topics" && (
            <TopicsTab supabase={supabase} showToast={showToast} />
          )}
          {tab === "words" && (
            <WordsTab supabase={supabase} showToast={showToast} />
          )}
          {tab === "users" && (
            <UsersTab supabase={supabase} showToast={showToast} />
          )}
        </main>
      </div>
    </div>
  );
}

// ══════════════════════ DASHBOARD ══════════════════════
function DashboardTab({
  supabase,
}: {
  supabase: ReturnType<typeof createClient>;
}) {
  const [stats, setStats] = useState({
    topics: 0,
    words: 0,
    published: 0,
    users: 0,
    quizzes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("topics").select("*", { count: "exact", head: true }),
      supabase.from("words").select("*", { count: "exact", head: true }),
      supabase
        .from("words")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("quiz_sessions")
        .select("*", { count: "exact", head: true }),
    ]).then(([t, w, p, u, q]) => {
      setStats({
        topics: t.count ?? 0,
        words: w.count ?? 0,
        published: p.count ?? 0,
        users: u.count ?? 0,
        quizzes: q.count ?? 0,
      });
      setLoading(false);
    });
  }, [supabase]);

  const cards = [
    {
      label: "Topics",
      value: stats.topics,
      icon: "category",
      color: "text-primary",
      bg: "bg-primary-container/20",
    },
    {
      label: "Total Words",
      value: stats.words,
      icon: "menu_book",
      color: "text-secondary",
      bg: "bg-secondary-container/20",
    },
    {
      label: "Published",
      value: stats.published,
      icon: "check_circle",
      color: "text-tertiary",
      bg: "bg-tertiary-container/20",
    },
    {
      label: "Users",
      value: stats.users,
      icon: "group",
      color: "text-primary",
      bg: "bg-primary-container/10",
    },
    {
      label: "Quizzes Done",
      value: stats.quizzes,
      icon: "quiz",
      color: "text-secondary",
      bg: "bg-secondary-container/10",
    },
    {
      label: "Draft Words",
      value: stats.words - stats.published,
      icon: "edit_note",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold font-headline">Dashboard</h1>
        <p className="text-on-surface-variant mt-1">Platform overview</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((c) => (
            <div
              key={c.label}
              className="bg-white rounded-xl p-6 border border-outline-variant/10 shadow-sm space-y-3"
            >
              <div
                className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center`}
              >
                <span
                  className={`material-symbols-outlined ${c.color}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {c.icon}
                </span>
              </div>
              <div>
                <div
                  className={`text-3xl font-extrabold font-headline ${c.color}`}
                >
                  {c.value.toLocaleString()}
                </div>
                <div className="text-xs text-on-surface-variant mt-0.5">
                  {c.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════ TOPICS ══════════════════════
function TopicsTab({
  supabase,
  showToast,
}: {
  supabase: ReturnType<typeof createClient>;
  showToast: (m: string, t?: "success" | "error") => void;
}) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    description: "",
    icon: "book",
    difficulty: "beginner" as (typeof DIFFICULTIES)[number],
    is_published: false,
    sort_order: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("topics")
      .select("*")
      .order("sort_order");
    setTopics(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setForm({
      slug: "",
      title: "",
      description: "",
      icon: "book",
      difficulty: "beginner",
      is_published: false,
      sort_order: 0,
    });
    setEditId(null);
  };

  const startEdit = (t: Topic) => {
    setForm({
      slug: t.slug,
      title: t.title,
      description: t.description ?? "",
      icon: t.icon,
      difficulty: t.difficulty,
      is_published: t.is_published,
      sort_order: t.sort_order,
    });
    setEditId(t.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      sort_order: form.sort_order || topics.length + 1,
    };
    if (editId) {
      const { error } = await supabase
        .from("topics")
        .update(payload)
        .eq("id", editId);
      if (error) showToast(error.message, "error");
      else {
        showToast("Topic updated!");
        reset();
        load();
      }
    } else {
      const { error } = await supabase.from("topics").insert(payload);
      if (error) showToast(error.message, "error");
      else {
        showToast("Topic created!");
        reset();
        load();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `Delete "${title}"? All words in this topic will also be deleted.`,
      )
    )
      return;
    const { error } = await supabase.from("topics").delete().eq("id", id);
    if (error) showToast(error.message, "error");
    else {
      showToast("Topic deleted.");
      load();
    }
  };

  const togglePublish = async (t: Topic) => {
    const { error } = await supabase
      .from("topics")
      .update({ is_published: !t.is_published })
      .eq("id", t.id);
    if (!error) load();
  };

  const sf =
    (k: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold font-headline">Topics</h1>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-xl p-6 border border-outline-variant/10 shadow-sm space-y-5"
      >
        <h2 className="font-bold text-lg font-headline flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            {editId ? "edit" : "add_circle"}
          </span>
          {editId ? "Edit Topic" : "New Topic"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-sm">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => {
                sf("title")(e);
                if (!editId)
                  setForm((f) => ({
                    ...f,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, ""),
                  }));
              }}
              placeholder="Travel"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-sm">Slug *</label>
            <input
              required
              value={form.slug}
              onChange={sf("slug")}
              placeholder="travel"
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              className="input-field"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label-sm">Description</label>
            <textarea
              value={form.description}
              onChange={sf("description")}
              rows={2}
              className="input-field resize-none"
            />
          </div>
          <div>
            <label className="label-sm">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={sf("difficulty")}
              className="input-field"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-sm">Sort Order</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((f) => ({ ...f, sort_order: +e.target.value }))
              }
              className="input-field"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label-sm">Icon</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {ICONS.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                  title={ic}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${form.icon === ic ? "bg-primary text-on-primary shadow" : "bg-surface-container-low hover:bg-surface-container"}`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {ic}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              onClick={() =>
                setForm((f) => ({ ...f, is_published: !f.is_published }))
              }
              className={`w-11 h-6 rounded-full cursor-pointer transition-all relative ${form.is_published ? "bg-primary" : "bg-outline-variant/40"}`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow transition-all ${form.is_published ? "left-6" : "left-1"}`}
              />
            </div>
            <span className="text-sm font-medium">Publish immediately</span>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:scale-[1.02] transition-all shadow flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <Spinner sm />
            ) : (
              <span className="material-symbols-outlined text-[18px]">
                save
              </span>
            )}
            {editId ? "Update" : "Create"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={reset}
              className="px-6 py-2.5 bg-surface-container-low rounded-xl font-semibold hover:bg-surface-container transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant/10 flex justify-between items-center">
          <h2 className="font-bold font-headline">Topics ({topics.length})</h2>
          <button
            onClick={load}
            className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-all"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : topics.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant">
            No topics yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low/50">
              <tr>
                {[
                  "Topic",
                  "Slug",
                  "Words",
                  "Difficulty",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {topics.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-surface/50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-container/20 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          {t.icon}
                        </span>
                      </div>
                      <span className="font-semibold">{t.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-on-surface-variant">
                    {t.slug}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 bg-secondary-container/30 text-secondary text-xs font-bold rounded-full">
                      {t.word_count}
                    </span>
                  </td>
                  <td className="px-5 py-4 capitalize text-xs text-on-surface-variant">
                    {t.difficulty}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => togglePublish(t)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${t.is_published ? "bg-tertiary-container text-on-tertiary-container" : "bg-amber-100 text-amber-700"}`}
                    >
                      {t.is_published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(t)}
                        className="p-1.5 hover:bg-primary-container/20 hover:text-primary rounded-lg transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          edit
                        </span>
                      </button>
                      <button
                        onClick={() => handleDelete(t.id, t.title)}
                        className="p-1.5 hover:bg-error-container/20 hover:text-error rounded-lg transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ══════════════════════ WORDS ══════════════════════
function WordsTab({
  supabase,
  showToast,
}: {
  supabase: ReturnType<typeof createClient>;
  showToast: (m: string, t?: "success" | "error") => void;
}) {
  // FIX: Dùng WordWithTopic thay vì inline type để tránh lỗi never
  const [words, setWords] = useState<WordWithTopic[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterTopic, setFT] = useState("");
  const [filterStatus, setFS] = useState<WordStatus | "">("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const [form, setForm] = useState({
    topic_id: "",
    term: "",
    language: "English",
    definition: "",
    pronunciation: "",
    example_sentence: "",
    notes: "",
    icon: "translate",
    difficulty: "beginner" as (typeof DIFFICULTIES)[number],
    status: "draft" as WordStatus,
    sort_order: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: w }, { data: t }] = await Promise.all([
      supabase
        .from("words")
        .select("*, topics(title)")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("topics").select("id,title,slug").order("sort_order"),
    ]);
    setWords((w ?? []) as WordWithTopic[]);
    setTopics(t ?? []);
    if (t && t.length > 0)
      setForm((f) => (f.topic_id ? f : { ...f, topic_id: t[0].id }));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setForm((f) => ({
      ...f,
      term: "",
      language: "English",
      definition: "",
      pronunciation: "",
      example_sentence: "",
      notes: "",
      icon: "translate",
      difficulty: "beginner",
      status: "draft",
      sort_order: 0,
    }));
    setEditId(null);
  };

  const startEdit = (w: Word) => {
    setForm({
      topic_id: w.topic_id,
      term: w.term,
      language: w.language,
      definition: w.definition,
      pronunciation: w.pronunciation ?? "",
      example_sentence: w.example_sentence ?? "",
      notes: w.notes ?? "",
      icon: w.icon,
      difficulty: w.difficulty,
      status: w.status,
      sort_order: w.sort_order,
    });
    setEditId(w.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic_id) {
      showToast("Please select a topic!", "error");
      return;
    }
    setSaving(true);
    if (editId) {
      const { error } = await supabase
        .from("words")
        .update(form)
        .eq("id", editId);
      if (error) showToast(error.message, "error");
      else {
        showToast("Word updated!");
        reset();
        load();
      }
    } else {
      const { error } = await supabase.from("words").insert(form);
      if (error) showToast(error.message, "error");
      else {
        showToast("Word added!");
        reset();
        load();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, term: string) => {
    if (!confirm(`Delete "${term}"?`)) return;
    const { error } = await supabase.from("words").delete().eq("id", id);
    if (error) showToast(error.message, "error");
    else {
      showToast("Word deleted.");
      load();
    }
  };

  const toggleStatus = async (w: Word) => {
    const next: WordStatus = w.status === "published" ? "draft" : "published";
    await supabase.from("words").update({ status: next }).eq("id", w.id);
    load();
  };

  const sf =
    (k: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const filtered = words.filter((w) => {
    const q = search.toLowerCase();
    return (
      (!q ||
        w.term.toLowerCase().includes(q) ||
        w.definition.toLowerCase().includes(q)) &&
      (!filterTopic || w.topic_id === filterTopic) &&
      (!filterStatus || w.status === filterStatus)
    );
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold font-headline">Words</h1>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-xl p-6 border border-outline-variant/10 shadow-sm space-y-5"
      >
        <h2 className="font-bold text-lg font-headline flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            {editId ? "edit" : "add_circle"}
          </span>
          {editId ? "Edit Word" : "New Word"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label-sm">Topic *</label>
            <select
              required
              value={form.topic_id}
              onChange={sf("topic_id")}
              className="input-field"
            >
              <option value="">-- Select topic --</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-sm">Term *</label>
            <input
              required
              value={form.term}
              onChange={sf("term")}
              placeholder="Wanderlust"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-sm">Language</label>
            <input
              value={form.language}
              onChange={sf("language")}
              placeholder="English"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-sm">Pronunciation (IPA)</label>
            <input
              value={form.pronunciation}
              onChange={sf("pronunciation")}
              placeholder="/ˈvandɐˌlʊst/"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-sm">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={sf("difficulty")}
              className="input-field"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-sm">Status</label>
            <select
              value={form.status}
              onChange={sf("status")}
              className="input-field"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="lg:col-span-3">
            <label className="label-sm">Definition *</label>
            <textarea
              required
              value={form.definition}
              onChange={sf("definition")}
              rows={2}
              placeholder="A strong desire to travel..."
              className="input-field resize-none"
            />
          </div>
          <div className="lg:col-span-3">
            <label className="label-sm">Example Sentence</label>
            <textarea
              value={form.example_sentence}
              onChange={sf("example_sentence")}
              rows={2}
              className="input-field resize-none"
            />
          </div>
          <div className="lg:col-span-3">
            <label className="label-sm">Admin Notes</label>
            <textarea
              value={form.notes}
              onChange={sf("notes")}
              rows={1}
              className="input-field resize-none"
            />
          </div>
          <div className="lg:col-span-3">
            <label className="label-sm">Icon</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {ICONS.slice(0, 14).map((ic) => (
                <button
                  type="button"
                  key={ic}
                  title={ic}
                  onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${form.icon === ic ? "bg-primary text-on-primary shadow" : "bg-surface-container-low hover:bg-surface-container"}`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {ic}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:scale-[1.02] transition-all shadow flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <Spinner sm />
            ) : (
              <span className="material-symbols-outlined text-[18px]">
                save
              </span>
            )}
            {editId ? "Update" : "Add Word"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={reset}
              className="px-6 py-2.5 bg-surface-container-low rounded-xl font-semibold hover:bg-surface-container transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search words..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-outline-variant/20 rounded-xl outline-none focus:border-primary/40 text-sm"
          />
        </div>
        <select
          value={filterTopic}
          onChange={(e) => {
            setFT(e.target.value);
            setPage(0);
          }}
          className="py-2.5 px-4 bg-white border border-outline-variant/20 rounded-xl text-sm outline-none focus:border-primary/40"
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFS(e.target.value as WordStatus | "");
            setPage(0);
          }}
          className="py-2.5 px-4 bg-white border border-outline-variant/20 rounded-xl text-sm outline-none focus:border-primary/40"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <span className="text-sm text-on-surface-variant">
          {filtered.length} results
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant">
            No words found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container-low/50">
                  <tr>
                    {["Word", "Topic", "Definition", "Level", "Status", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {paginated.map((w) => (
                    <tr
                      key={w.id}
                      className="hover:bg-surface/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary-container/20 rounded-lg flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-[16px]">
                              {w.icon}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-primary">
                              {w.term}
                            </div>
                            {w.pronunciation && (
                              <div className="text-[10px] text-on-surface-variant italic">
                                {w.pronunciation}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 bg-surface-container text-xs font-medium rounded-full text-on-surface-variant">
                          {w.topics?.title ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-on-surface-variant text-xs line-clamp-2">
                          {w.definition}
                        </p>
                      </td>
                      <td className="px-5 py-4 capitalize text-xs text-on-surface-variant">
                        {w.difficulty}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleStatus(w)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${w.status === "published" ? "bg-tertiary-container text-on-tertiary-container" : w.status === "draft" ? "bg-amber-100 text-amber-700" : "bg-surface-container text-on-surface-variant"}`}
                        >
                          {w.status}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(w)}
                            className="p-1.5 hover:bg-primary-container/20 hover:text-primary rounded-lg transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(w.id, w.term)}
                            className="p-1.5 hover:bg-error-container/20 hover:text-error rounded-lg transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-5 border-t border-outline-variant/10 flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">
                  Page {page + 1} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 text-xs font-bold bg-surface-container-low rounded-lg hover:bg-surface-container disabled:opacity-40 transition-all"
                  >
                    ← Prev
                  </button>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 text-xs font-bold bg-surface-container-low rounded-lg hover:bg-surface-container disabled:opacity-40 transition-all"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════ USERS ══════════════════════
function UsersTab({
  supabase,
  showToast,
}: {
  supabase: ReturnType<typeof createClient>;
  showToast: (m: string, t?: "success" | "error") => void;
}) {
  const [users, setUsers] = useState<import("@/lib/supabase/types").Profile[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.username.toLowerCase().includes(q) ||
      (u.display_name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold font-headline">Users</h1>
          <p className="text-on-surface-variant mt-1">
            {users.length} registered users
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-all"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      <div className="relative max-w-sm">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">
          search
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-outline-variant/20 rounded-xl outline-none focus:border-primary/40 text-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant">
            No users found
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low/50">
              <tr>
                {["User", "Username", "Points", "Streak", "Joined", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-surface/50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {u.avatar_url ? (
                          <Image
                            src={u.avatar_url}
                            alt=""
                            width={36}
                            height={36}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-bold text-primary text-sm">
                            {(u.display_name ?? u.username)
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold">
                        {u.display_name ?? u.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant font-mono text-xs">
                    @{u.username}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-secondary">
                      {u.total_points.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1 text-orange-500 font-bold text-xs">
                      <span
                        className="material-symbols-outlined text-[14px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        local_fire_department
                      </span>
                      {u.current_streak}d
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-on-surface-variant">
                    {new Date(u.created_at).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={async () => {
                        if (!confirm(`View stats for ${u.username}?`)) return;
                        const { data } = await supabase.rpc(
                          "get_user_dashboard_stats",
                          { p_user_id: u.id },
                        );
                        if (data) alert(JSON.stringify(data, null, 2));
                      }}
                      className="p-1.5 hover:bg-primary-container/20 hover:text-primary rounded-lg transition-all"
                      title="View stats"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        bar_chart
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
