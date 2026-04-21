"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNavBar from "@/components/TopNavBar";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

export default function ProfilePage() {
  const router   = useRouter();
  const supabase = createClient();
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ display_name: "", bio: "", daily_goal: 10 });
  const [toast, setToast]       = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      if (data) setForm({ display_name: data.display_name ?? "", bio: data.bio ?? "", daily_goal: data.daily_goal });
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: form.display_name || null,
      bio:          form.bio || null,
      daily_goal:   form.daily_goal,
    }).eq("id", profile.id);

    if (error) showToast("Error saving: " + error.message);
    else {
      setProfile((p) => p ? { ...p, ...form } : p);
      setEditing(false);
      showToast("Profile updated!");
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
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

  return (
    <>
      <TopNavBar />
      {toast && (
        <div className="fixed top-24 right-6 z-50 bg-tertiary-container text-on-tertiary-container px-5 py-3 rounded-xl shadow-xl font-medium text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          {toast}
        </div>
      )}

      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-3xl mx-auto space-y-10">

          {/* Profile Hero */}
          <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-1 rounded-[2rem]">
            <div className="bg-surface-container-lowest rounded-[1.9rem] p-10">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="relative shrink-0">
                  <div className="w-28 h-28 rounded-[1.5rem] overflow-hidden border-4 border-white shadow-xl bg-primary-container/30 flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-extrabold text-primary font-headline">
                        {(profile.display_name ?? profile.username).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-tertiary-container rounded-full flex items-center justify-center border-2 border-white">
                    <span className="material-symbols-outlined text-tertiary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                  <h1 className="text-3xl font-extrabold font-headline">{profile.display_name ?? profile.username}</h1>
                  <p className="text-on-surface-variant">@{profile.username}</p>
                  {profile.bio && <p className="text-sm text-on-surface-variant italic mt-2">{profile.bio}</p>}
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                    <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-full uppercase tracking-wide">Explorer</span>
                    <span className="px-3 py-1 bg-primary-container/20 text-primary text-xs font-bold rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                      {profile.current_streak} Day Streak
                    </span>
                  </div>
                </div>

                <div className="flex gap-6 shrink-0">
                  {[
                    { label: "Points",  value: profile.total_points.toLocaleString() },
                    { label: "Streak",  value: profile.current_streak },
                    { label: "Best",    value: profile.longest_streak },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="text-2xl font-extrabold font-headline text-primary">{s.value}</div>
                      <div className="text-xs text-on-surface-variant">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
              <h2 className="text-xl font-bold font-headline">Profile Settings</h2>
              {!editing && (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-container-low hover:bg-surface-container rounded-xl text-sm font-semibold transition-all">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="p-6 space-y-5">
                <div>
                  <label className="label-sm">Display Name</label>
                  <input value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                    placeholder="Your name" className="input-field" />
                </div>
                <div>
                  <label className="label-sm">Bio</label>
                  <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    rows={3} placeholder="Tell us about yourself..." className="input-field resize-none" />
                </div>
                <div>
                  <label className="label-sm">Daily Goal (words per day)</label>
                  <input type="number" min={1} max={200} value={form.daily_goal}
                    onChange={(e) => setForm((f) => ({ ...f, daily_goal: parseInt(e.target.value) || 10 }))}
                    className="input-field w-32" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving}
                    className="px-8 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-60">
                    {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                    Save Changes
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="px-6 py-2.5 bg-surface-container-low font-semibold rounded-xl hover:bg-surface-container transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {[
                  { label: "Display Name", value: profile.display_name ?? "—", icon: "person" },
                  { label: "Username",     value: "@" + profile.username,      icon: "alternate_email" },
                  { label: "Daily Goal",   value: `${profile.daily_goal} words/day`, icon: "flag" },
                  { label: "Member Since", value: new Date(profile.created_at).toLocaleDateString("en", { year: "numeric", month: "long" }), icon: "calendar_today" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-9 h-9 bg-surface-container-low rounded-xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{item.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-on-surface-variant">{item.label}</p>
                      <p className="font-semibold text-on-surface">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/progress">
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer text-center space-y-2">
                <span className="material-symbols-outlined text-primary text-3xl block" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
                <p className="font-bold font-headline">View Progress</p>
              </div>
            </Link>
            <Link href="/#topics">
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer text-center space-y-2">
                <span className="material-symbols-outlined text-secondary text-3xl block" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                <p className="font-bold font-headline">Browse Topics</p>
              </div>
            </Link>
          </div>

          {/* Sign Out */}
          <div className="text-center">
            <button onClick={handleSignOut}
              className="flex items-center gap-2 mx-auto px-6 py-3 text-error hover:bg-error-container/10 rounded-xl transition-all font-semibold">
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Sign Out
            </button>
          </div>

        </div>
      </main>
    </>
  );
}
