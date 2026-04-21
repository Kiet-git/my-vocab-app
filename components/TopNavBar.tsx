"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import type { User, Session } from "@supabase/supabase-js";

export default function TopNavBar() {
  const path = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user: User | null = data.user;
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url")
          .eq("id", user.id)
          .single();
        setProfile(data as Profile | null);
      }
      setLoading(false);
    };
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("id,username,display_name,avatar_url")
            .eq("id", session.user.id)
            .single();
          setProfile(data as Profile | null);
        } else {
          setProfile(null);
        }
      },
    );
    return () => subscription.unsubscribe();
  }, [supabase]);

  const is = (p: string) => path === p || path.startsWith(p + "/");

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`transition-all duration-300 hover:opacity-80 font-headline font-semibold tracking-tight ${is(href) ? "text-indigo-600 border-b-2 border-indigo-500 pb-1" : "text-slate-500 hover:text-indigo-500"}`}
    >
      {label}
    </Link>
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl shadow-[0_20px_40px_-10px_rgba(32,48,68,0.08)] flex justify-between items-center px-8 h-20">
      {/* Left */}
      <div className="flex items-center gap-12">
        <Link href="/">
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-400 font-headline cursor-pointer">
            Lucid Polyglot
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {navLink("/", "Home")}
          {profile && navLink("/progress", "My Progress")}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        <div className="relative hidden lg:block">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50"
            style={{ fontSize: "18px" }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search topics..."
            className="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-6 w-56 focus:ring-2 focus:ring-primary-fixed focus:bg-surface-container-lowest transition-all outline-none text-sm"
          />
        </div>

        {loading ? (
          <div className="w-10 h-10 rounded-full bg-surface-container animate-pulse" />
        ) : profile ? (
          <div className="flex items-center gap-4">
            {/* Admin link */}
            {user?.app_metadata?.role === "admin" && (
              <Link
                href="/admin"
                className={`font-headline font-semibold text-sm transition-all duration-300 hidden md:block ${is("/admin") ? "text-indigo-600 border-b-2 border-indigo-500 pb-1" : "text-slate-500 hover:text-indigo-500"}`}
              >
                Admin
              </Link>
            )}
            {/* Avatar dropdown */}
            <div className="relative group">
              <Link href="/profile">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all bg-primary-container/30 flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-primary text-sm font-headline">
                      {(profile.display_name ?? profile.username)
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </div>
              </Link>
              {/* Dropdown */}
              <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-outline-variant/10 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
                <div className="p-3 border-b border-outline-variant/10">
                  <p className="font-bold text-sm text-on-surface truncate">
                    {profile.display_name ?? profile.username}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    @{profile.username}
                  </p>
                </div>
                <div className="p-2 space-y-1">
                  <Link href="/profile">
                    <div className="flex items-center gap-2 px-3 py-2 hover:bg-surface-container-low rounded-lg text-sm font-medium transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">
                        person
                      </span>
                      Profile
                    </div>
                  </Link>
                  <Link href="/progress">
                    <div className="flex items-center gap-2 px-3 py-2 hover:bg-surface-container-low rounded-lg text-sm font-medium transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">
                        bar_chart
                      </span>
                      Progress
                    </div>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-error-container/10 text-error rounded-lg text-sm font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      logout
                    </span>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="px-5 py-2 text-sm font-bold text-primary hover:bg-primary-container/10 rounded-xl transition-all">
                Sign In
              </button>
            </Link>
            <Link href="/register">
              <button className="px-5 py-2 text-sm font-bold bg-primary text-on-primary rounded-xl hover:scale-105 transition-all shadow-md shadow-primary/20">
                Sign Up
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
