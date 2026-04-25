"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import TopNavBar from "@/components/TopNavBar";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

export default function ProfilePage() {
  const router   = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm]       = useState({ display_name: "", bio: "", daily_goal: 10 });
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      if (data) setForm({ display_name: data.display_name ?? "", bio: data.bio ?? "", daily_goal: data.daily_goal });
      setLoading(false);
    });
  }, [supabase, router]);

  const show = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: form.display_name || null,
      bio:          form.bio || null,
      daily_goal:   Math.max(1, Math.min(200, form.daily_goal)),
    }).eq("id", profile.id);
    if (error) show(error.message, false);
    else { setProfile((p) => p ? { ...p, ...form } : p); setEditing(false); show("Profile updated!"); }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/"); router.refresh();
  };

  if (loading) return (
    <>
      <TopNavBar />
      <div className="bg-mesh min-h-screen flex items-center justify-center pt-20">
        <span className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    </>
  );
  if (!profile) return null;

  const initial = (profile.display_name ?? profile.username).charAt(0).toUpperCase();

  return (
    <>
      <TopNavBar />
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-sm font-medium ${toast.ok ? "bg-tertiary-container text-on-tertiary-container" : "bg-error-container/90 text-on-error-container"}`}>
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{toast.ok ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      <main className="pt-28 md:pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* Hero */}
          <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-1 rounded-[2rem]">
            <div className="bg-surface-container-lowest rounded-[1.9rem] p-8 md:p-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden border-4 border-white shadow-lg bg-primary-container/30 flex items-center justify-center">
                    {profile.avatar_url
                      ? <Image src={profile.avatar_url} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
                      : <span className="text-4xl font-extrabold text-primary font-headline">{initial}</span>}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-tertiary-container rounded-full flex items-center justify-center border-2 border-white">
                    <span className="material-symbols-outlined text-tertiary text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold font-headline">{profile.display_name ?? profile.username}</h1>
                  <p className="text-on-surface-variant text-sm">@{profile.username}</p>
                  {profile.bio && <p className="text-sm text-on-surface-variant italic">{profile.bio}</p>}
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                    <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-full">Explorer</span>
                    <span className="px-3 py-1 bg-primary-container/20 text-primary text-xs font-bold rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                      {profile.current_streak}d streak
                    </span>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-6 sm:gap-4 shrink-0 text-center">
                  {[{ label: "Points", value: profile.total_points.toLocaleString() }, { label: "Best streak", value: profile.longest_streak }].map(s => (
                    <div key={s.label}>
                      <div className="text-2xl font-extrabold font-headline text-primary">{s.value}</div>
                      <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/10 flex justify-between items-center">
              <h2 className="text-lg font-bold font-headline">Profile Settings</h2>
              {!editing && (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-low hover:bg-surface-container rounded-xl text-sm font-semibold transition-colors">
                  <span className="material-symbols-outlined text-[18px]">edit</span>Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="p-6 space-y-4">
                <div>
                  <label className="label-sm">Display Name</label>
                  <input value={form.display_name} onChange={(e) => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Your name" className="input-field" />
                </div>
                <div>
                  <label className="label-sm">Bio</label>
                  <textarea value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Tell us about yourself..." className="input-field resize-none" />
                </div>
                <div>
                  <label className="label-sm">Daily Goal (words/day)</label>
                  <input type="number" min={1} max={200} value={form.daily_goal} onChange={(e) => setForm(f => ({ ...f, daily_goal: +e.target.value || 10 }))} className="input-field w-28" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={handleSave} disabled={saving}
                    className="px-7 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60">
                    {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                    Save
                  </button>
                  <button onClick={() => setEditing(false)} className="px-5 py-2.5 bg-surface-container-low rounded-xl font-semibold hover:bg-surface-container transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {[
                  { label: "Display Name", value: profile.display_name ?? "—",  icon: "person" },
                  { label: "Username",     value: "@" + profile.username,        icon: "alternate_email" },
                  { label: "Daily Goal",   value: `${profile.daily_goal} words`, icon: "flag" },
                  { label: "Member Since", value: new Date(profile.created_at).toLocaleDateString("en", { year: "numeric", month: "long" }), icon: "calendar_today" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-9 h-9 bg-surface-container-low rounded-xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-[11px] text-on-surface-variant uppercase tracking-wide">{item.label}</p>
                      <p className="font-semibold text-on-surface text-sm">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick nav */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { href: "/progress", icon: "bar_chart", label: "My Progress", color: "text-primary" },
              { href: "/#topics",  icon: "menu_book", label: "Browse Topics", color: "text-secondary" },
            ].map(item => (
              <Link key={item.href} href={item.href} prefetch={true}>
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer text-center space-y-2 will-change-transform">
                  <span className={`material-symbols-outlined text-3xl block ${item.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  <p className="font-bold font-headline text-sm">{item.label}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Sign out */}
          <div className="text-center">
            <button onClick={handleSignOut} className="inline-flex items-center gap-2 px-6 py-3 text-error hover:bg-error-container/10 rounded-xl transition-colors font-semibold text-sm">
              <span className="material-symbols-outlined text-[18px]">logout</span>Sign Out
            </button>
          </div>

        </div>
      </main>
    </>
  );
}
