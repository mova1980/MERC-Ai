import { Sparkles, Sun, Moon, RefreshCw, UserCheck, ShieldAlert, Palette, Clock } from "lucide-react";
import { User } from "firebase/auth";
import { AppTheme, AccentColor } from "../types";

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  syncing: boolean;
  onTriggerSync?: () => void;
  lastSynced: string | null;
}

const ACCENT_LIST: { id: AccentColor; label: string; colorClass: string }[] = [
  { id: "navy", label: "سورمه‌ای سنتی", colorClass: "bg-[#1b3a5f]" },
  { id: "teal", label: "فیروزه‌ای", colorClass: "bg-[#0d9488]" },
  { id: "emerald", label: "زمردی", colorClass: "bg-[#059669]" },
  { id: "violet", label: "بنفش مروارید", colorClass: "bg-[#7c3aed]" },
  { id: "crimson", label: "انار پژوهشگاه", colorClass: "bg-[#e11d48]" }
];

export default function Header({
  user,
  onLogin,
  onLogout,
  theme,
  setTheme,
  syncing,
  onTriggerSync,
  lastSynced
}: HeaderProps) {
  const toggleThemeMode = () => {
    let nextMode: "light" | "dark" | "auto" = "light";
    if (theme.mode === "light") nextMode = "dark";
    else if (theme.mode === "dark") nextMode = "auto";
    else nextMode = "light";
    
    setTheme({ ...theme, mode: nextMode });
  };

  const selectAccent = (accent: AccentColor) => {
    setTheme({ ...theme, accent });
  };

  // Google Drive formatted image link
  const logoUrl = "https://lh3.googleusercontent.com/d/1gHg_psQwRZRB3Qo55IVKOskPn-Z6s9-L";

  return (
    <header className="border-b border-brand-100 bg-white/95 py-4 px-6 shadow-sm backdrop-blur-md theme-transition dark:border-brand-800 dark:bg-slate-900/95 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Institutional Branding */}
        <div className="flex items-center gap-4">
          <div className="relative p-1 bg-white rounded-full shadow-inner">
            <img
              src={logoUrl}
              alt="پژوهشگاه مواد و انرژی"
              referrerPolicy="no-referrer"
              className="w-14 h-14 object-contain rounded-full glow-logo"
            />
            {/* Soft ambient aura overlay */}
            <div className="absolute inset-0 rounded-full pointer-events-none border border-brand-500/10 dark:border-blue-500/25 blur-xs"></div>
          </div>
          <div className="text-right">
            <h1 className="text-lg md:text-xl font-black text-brand-500 tracking-tight flex items-center gap-1 dark:text-blue-400">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>دستیار هوش مصنوعی پژوهشگاه مواد و انرژی</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              سامانه هوشمند تحلیل مقالات و مشاوره تخصصی (كرج - ایران)
            </p>
          </div>
        </div>

        {/* Dynamic Controls and User Auth */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
          
          {/* Accent Palette Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
            <Palette className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <div className="flex gap-1">
              {ACCENT_LIST.map((acc) => (
                <button
                  key={acc.id}
                  title={acc.label}
                  onClick={() => selectAccent(acc.id)}
                  className={`w-4 h-4 rounded-full transition-transform ${acc.colorClass} ${
                    theme.accent === acc.id ? "scale-125 ring-2 ring-blue-500 dark:ring-blue-400 animate-pulse" : "hover:scale-110"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Sun/Moon/Auto Button */}
          <button
            onClick={toggleThemeMode}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="تغییر تم شب و روز"
          >
            {theme.mode === "light" && (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span>روز</span>
              </>
            )}
            {theme.mode === "dark" && (
              <>
                <Moon className="w-4 h-4 text-blue-400" />
                <span>شب</span>
              </>
            )}
            {theme.mode === "auto" && (
              <>
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>خودکار ساعت</span>
              </>
            )}
          </button>

          {/* Drive & Cloud Sync System */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onTriggerSync}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-brand-500 dark:text-blue-400 border border-brand-100 dark:border-slate-700 rounded-full text-xs font-semibold select-none cursor-pointer transition disabled:opacity-50"
                title={lastSynced ? `آخرین همگام‌سازی: ${lastSynced}` : "همگام‌سازی با گوگل درایو"}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-blue-500" : ""}`} />
                <span>{syncing ? "درحال همگام‌سازی..." : "همگام‌سازی درایو"}</span>
              </button>

              <div className="flex items-center gap-2 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 rounded-full px-3 py-1.5">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "پژوهشگر"} className="w-5 h-5 rounded-full" />
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium max-w-[100px] truncate">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={onLogout}
                  className="mr-1.5 text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline"
                >
                  خروج
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-full text-xs font-bold shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-95 transition"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>ورود پژوهشگران با گوگل</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
