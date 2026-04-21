"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (form.username.length < 3) return "Username phải có ít nhất 3 ký tự.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Email không hợp lệ.";
    if (form.password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
    if (form.password !== form.confirm) return "Mật khẩu xác nhận không khớp.";
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { username: form.username, display_name: form.username },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Email này đã được đăng ký."
          : error.message,
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  if (success) {
    return (
      <div className="w-full max-w-md text-center space-y-6">
        <div className="bg-surface-container-lowest rounded-[2rem] p-10 shadow-[0_20px_60px_-10px_rgba(70,71,211,0.15)] border border-outline-variant/10 space-y-4">
          <div className="w-20 h-20 bg-secondary-container/30 rounded-full flex items-center justify-center mx-auto">
            <span
              className="material-symbols-outlined text-secondary text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              mark_email_read
            </span>
          </div>
          <h2 className="text-2xl font-extrabold font-headline">
            Kiểm tra email của bạn!
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Chúng tôi đã gửi link xác nhận đến{" "}
            <span className="font-bold text-primary">{form.email}</span>. Nhấp
            vào link trong email để kích hoạt tài khoản.
          </p>
          <Link href="/login">
            <button className="w-full mt-2 py-3.5 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-xl hover:scale-[1.02] transition-all shadow-lg shadow-primary/20">
              Về trang đăng nhập
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const strength =
    form.password.length === 0
      ? 0
      : form.password.length < 8
        ? 1
        : form.password.match(/[A-Z]/) && form.password.match(/[0-9]/)
          ? 3
          : 2;
  const strengthLabel = ["", "Yếu", "Trung bình", "Mạnh"][strength];
  const strengthColor = ["", "bg-error", "bg-amber-400", "bg-tertiary"][
    strength
  ];

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <Link href="/">
          <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-400 font-headline cursor-pointer">
            Lucid Polyglot
          </span>
        </Link>
        <p className="text-on-surface-variant text-sm">
          Tạo tài khoản miễn phí và bắt đầu học ngay hôm nay.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-[0_20px_60px_-10px_rgba(70,71,211,0.15)] border border-outline-variant/10 space-y-5">
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 rounded-xl font-semibold transition-all hover:shadow-md"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.6 20H24v8h11.3C33.6 33.3 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.4-8 19.4-20 0-1.3-.1-2.7-.4-4z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.5 15.8 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.7-3.3-11.4-8l-6.5 5C9.7 39.6 16.3 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"
            />
          </svg>
          Đăng ký với Google
        </button>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-outline-variant/20" />
          <span className="text-xs text-on-surface-variant font-medium">
            hoặc
          </span>
          <div className="flex-1 h-px bg-outline-variant/20" />
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
              Tên người dùng
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">
                person
              </span>
              <input
                type="text"
                required
                value={form.username}
                onChange={set("username")}
                placeholder="lingolover123"
                className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary/40 rounded-xl pl-11 pr-4 py-3 outline-none transition-all placeholder:text-on-surface-variant/40"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
              Email
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">
                mail
              </span>
              <input
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary/40 rounded-xl pl-11 pr-4 py-3 outline-none transition-all placeholder:text-on-surface-variant/40"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
              Mật khẩu
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">
                lock
              </span>
              <input
                type={showPw ? "text" : "password"}
                required
                value={form.password}
                onChange={set("password")}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary/40 rounded-xl pl-11 pr-11 py-3 outline-none transition-all placeholder:text-on-surface-variant/40"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPw ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {/* Strength bar */}
            {form.password.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength >= i ? strengthColor : "bg-surface-container"}`}
                    />
                  ))}
                </div>
                <span
                  className={`text-[10px] font-bold ${strength === 1 ? "text-error" : strength === 2 ? "text-amber-500" : "text-tertiary"}`}
                >
                  {strengthLabel}
                </span>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">
                lock_reset
              </span>
              <input
                type={showPw ? "text" : "password"}
                required
                value={form.confirm}
                onChange={set("confirm")}
                placeholder="Nhập lại mật khẩu"
                className={`w-full bg-surface-container-low border-2 rounded-xl pl-11 pr-4 py-3 outline-none transition-all placeholder:text-on-surface-variant/40 ${
                  form.confirm && form.confirm !== form.password
                    ? "border-error/50 focus:border-error"
                    : "border-transparent focus:border-primary/40"
                }`}
              />
              {form.confirm && form.confirm === form.password && (
                <span
                  className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-tertiary text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-error-container/20 text-error px-4 py-3 rounded-xl text-sm font-medium">
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                error
              </span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Đang tạo tài khoản...
              </>
            ) : (
              "Tạo tài khoản"
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-on-surface-variant">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-primary font-bold hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
