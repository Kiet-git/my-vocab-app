"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

type NavProfile = Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;

// Module-level cache — persists across renders in same session
let cachedProfile: NavProfile | null = null;
let cachedIsAdmin = false;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 min

export default function TopNavBar() {
  const path     = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const [profile, setProfile]   = useState<NavProfile | null>(cachedProfile);
  const [isAdmin, setIsAdmin]   = useState(cachedIsAdmin);
  const [loading, setLoading]   = useState(!cachedProfile);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchProfile = useCallback(async () => {
    // Use cache if fresh
    if (cachedProfile && Date.now() - cacheTime < CACHE_TTL) {
      setProfile(cachedProfile);
      setIsAdmin(cachedIsAdmin);
      setLoading(false);
      return;
    }

    // getUser() validates JWT with Supabase server (Next.js 16 best practice)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      cachedProfile = null;
      setProfile(null);
      setLoading(false);
      return;
    }

    // Profile + admin check in 1 query
    const { data } = await supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url")
      .eq("id", user.id)
      .single();

    const admin = user.app_metadata?.role === "admin";

    cachedProfile  = data as NavProfile | null;
    cachedIsAdmin  = admin;
    cacheTime      = Date.now();

    setProfile(cachedProfile);
    setIsAdmin(admin);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Invalidate cache
        cacheTime = 0;
        fetchProfile();
      }
      if (event === "SIGNED_OUT") {
        cachedProfile = null;
        cachedIsAdmin = false;
        cacheTime     = 0;
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile, supabase]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [path]);

  const handleSignOut = async () => {
    cachedProfile = null;
    cachedIsAdmin = false;
    cacheTime     = 0;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const is  = (p: string) => path === p || path.startsWith(p + "/");
  const cls = (href: string) =>
    `transition-colors duration-200 font-headline font-semibold tracking-tight ${
      is(href) ? "text-indigo-600 border-b-2 border-indigo-500 pb-1" : "text-slate-500 hover:text-indigo-500"
    }`;

  const initial = (profile?.display_name ?? profile?.username ?? "?").charAt(0).toUpperCase();

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/50 backdrop-blur-xl shadow-[0_1px_0_0_rgba(32,48,68,0.06)] flex justify-between items-center px-6 md:px-8 h-16 md:h-20">

      {/* Left */}
      <div className="flex items-center gap-8 md:gap-12">
        <Link href="/" prefetch={true}>
          <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-400 font-headline cursor-pointer">
            Lucid Polyglot
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/"         className={cls("/")}         prefetch={true}>Home</Link>
          {profile && <Link href="/progress" className={cls("/progress")} prefetch={true}>My Progress</Link>}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Search — only on desktop */}
        <div className="relative hidden lg:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" style={{ fontSize: "18px" }}>search</span>
          <input type="search" placeholder="Search topics..."
            className="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-5 w-52 focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all outline-none text-sm"
          />
        </div>

        {/* Auth state */}
        {loading ? (
          <div className="w-9 h-9 rounded-full bg-surface-container animate-pulse" />
        ) : profile ? (
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link href="/admin" className={`hidden md:block text-sm ${cls("/admin")}`} prefetch={false}>
                Admin
              </Link>
            )}
            {/* Avatar with click-toggle dropdown */}
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-primary-container hover:ring-2 hover:ring-primary/30 transition-all bg-primary-container/30 flex items-center justify-center focus:outline-none"
                aria-label="User menu"
              >
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-primary text-sm font-headline">{initial}</span>
                )}
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 top-11 md:top-12 w-52 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant/10 bg-surface-container-low/50">
                    <p className="font-bold text-sm text-on-surface truncate">{profile.display_name ?? profile.username}</p>
                    <p className="text-xs text-on-surface-variant">@{profile.username}</p>
                  </div>
                  <div className="p-2 space-y-0.5">
                    {[
                      { href: "/profile",  icon: "person",    label: "Profile" },
                      { href: "/progress", icon: "bar_chart", label: "My Progress" },
                    ].map((item) => (
                      <Link key={item.href} href={item.href} prefetch={true}>
                        <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container-low rounded-xl text-sm font-medium transition-colors cursor-pointer text-on-surface">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{item.icon}</span>
                          {item.label}
                        </div>
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link href="/admin" prefetch={false}>
                        <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container-low rounded-xl text-sm font-medium transition-colors cursor-pointer text-on-surface">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">admin_panel_settings</span>
                          Admin Panel
                        </div>
                      </Link>
                    )}
                    <div className="border-t border-outline-variant/10 mt-1 pt-1">
                      <button onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-error-container/10 text-error rounded-xl text-sm font-medium transition-colors">
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" prefetch={true}>
              <button className="px-4 py-2 text-sm font-bold text-primary hover:bg-primary-container/10 rounded-xl transition-colors">
                Sign In
              </button>
            </Link>
            <Link href="/register" prefetch={true}>
              <button className="px-4 py-2 text-sm font-bold bg-primary text-on-primary rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-primary/30">
                Sign Up
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
