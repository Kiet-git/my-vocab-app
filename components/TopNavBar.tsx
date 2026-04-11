import Link from "next/link";

type ActivePage = "home" | "progress" | "admin";

export default function TopNavBar({ active = "home" }: { active?: ActivePage }) {
  const linkClass = (page: ActivePage) =>
    page === active
      ? "text-indigo-600 border-b-2 border-indigo-500 pb-1 hover:opacity-80 transition-all duration-300"
      : "text-slate-500 hover:text-indigo-500 hover:opacity-80 transition-all duration-300";

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl shadow-[0_20px_40px_-10px_rgba(32,48,68,0.08)] flex justify-between items-center px-8 h-20">
      {/* Left */}
      <div className="flex items-center gap-12">
        <Link href="/">
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-400 font-headline cursor-pointer">
            Lucid Polyglot
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8 font-headline font-semibold tracking-tight">
          <Link href="/" className={linkClass("home")}>Home</Link>
          <Link href="#" className={linkClass("progress")}>My Progress</Link>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-6">
        <div className="relative hidden lg:block">
          <input
            type="text"
            placeholder="Search topics..."
            className="bg-surface-container-low border-none rounded-full py-2 px-6 w-64 focus:ring-2 focus:ring-primary-fixed focus:bg-surface-container-lowest transition-all outline-none"
          />
        </div>
        <Link href="/admin" className={`font-headline font-semibold ${linkClass("admin")}`}>
          Admin
        </Link>
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEerDCP9JVfbV15GlOR6AwFGdtIF5DtBKUb5_ChGpFCMbHs_tQTLTg_HqKP-yYw2aeCP89EZmFrmYccSedLlFx2mQaYfBrDaXRN3pJgd7yl09b7vlZ9He4gwFgHqIemcDDkrTB_2KG4p4YKqqkgb3PoFW8ib48gc7X7ryZY8hY1reJ4LBWyU3xhJUq3VIcFjRFFb-p-3hLW0FpXylC11oo-3hN9vuw0SQpTNZErp2nNiPOUQFBld7FrxRsLRj4pbwPwZj5M6YUeR6J"
            alt="User avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </nav>
  );
}
