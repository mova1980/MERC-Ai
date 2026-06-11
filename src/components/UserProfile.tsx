import React, { useState, useEffect } from "react";
import { User, Shield, Award, Briefcase, Microscope, Check, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

export interface UserPersona {
  fullName: string;
  role: string;
  department: string;
  interests: string;
}

interface UserProfileProps {
  persona: UserPersona;
  onUpdatePersona: (newPersona: UserPersona) => void;
}

const ROLES = [
  "پژوهشگر ارشد / عضو هیئت علمی",
  "پژوهشگر فوق دکتری (PostDoc)",
  "دانشجوی دکتری تخصصی (Ph.D)",
  "دانشجوی کارشناسی ارشد (M.Sc)",
  "کارشناس ارشد آزمایشگاه مرکزی",
  "پژوهشگر همکار از صنعت"
];

const DEPARTMENTS = [
  "پژوهشکده نیمه‌هادی‌ها",
  "پژوهشکده مواد سرامیکی",
  "پژوهشکده سیستم‌های نو و انرژی‌های تجدیدپذیر",
  "آزمایشگاه مرکزی مواد و آنالیزهای ساختاری",
  "امور پژوهشی و ستاد اداری مرک"
];

export default function UserProfile({ persona, onUpdatePersona }: UserProfileProps) {
  const [fullName, setFullName] = useState(persona.fullName || "");
  const [role, setRole] = useState(persona.role || ROLES[2]);
  const [department, setDepartment] = useState(persona.department || DEPARTMENTS[0]);
  const [interests, setInterests] = useState(persona.interests || "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFullName(persona.fullName);
    setRole(persona.role);
    setDepartment(persona.department);
    setInterests(persona.interests);
  }, [persona]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePersona({
      fullName: fullName.trim(),
      role,
      department,
      interests: interests.trim()
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, cubicBezier: [0.16, 1, 0.3, 1] }}
      className="glass-card rounded-2xl border border-brand-100 dark:border-slate-800 p-6 shadow-xl flex flex-col gap-6"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-500/10 rounded-xl text-brand-500 dark:text-blue-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-md md:text-lg font-black text-slate-800 dark:text-slate-100">
              پروفایل و شخصی‌سازی هویت پژوهشی
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              هویت علمی و حوزه سنتز خود را بنویسید تا پاسخ‌های چت اختصاصی برای تخصص شما کالیبره شوند.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-50/50 dark:bg-slate-800/40 border border-brand-100/50 dark:border-slate-800 rounded-full text-[10px] text-slate-500 font-bold">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>امنیت بومی فایروال مرک</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-slate-500 dark:text-slate-400 font-black flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-brand-500 dark:text-blue-400" />
            <span>نام و نام خانوادگی پژوهشگر:</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="مثال: دکتر علی رضایی"
            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-705 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 transition duration-200"
          />
        </div>

        {/* Interests */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-slate-500 dark:text-slate-400 font-black flex items-center gap-1">
            <Microscope className="w-3.5 h-3.5 text-brand-500 dark:text-blue-400" />
            <span>زمینه تخصص پژوهشی (کلیدواژه‌ها):</span>
          </label>
          <input
            type="text"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="مثال: نانوپودرهای اکسیدی، باتری حالت جامد، لایه‌نشانی اسپاترینگ"
            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-705 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 transition duration-200"
          />
        </div>

        {/* Academic Role */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-slate-500 dark:text-slate-400 font-black flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-brand-500 dark:text-blue-400" />
            <span>رتبه / سمت آکادمیک در پژوهشگاه:</span>
          </label>
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-xl focus:outline-hidden appearance-none cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Department Group */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-slate-500 dark:text-slate-400 font-black flex items-center gap-1">
            <Microscope className="w-3.5 h-3.5 text-brand-500 dark:text-blue-400" />
            <span>بخش تحقیقاتی / دانشکده متصل:</span>
          </label>
          <div className="relative">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-xl focus:outline-hidden appearance-none cursor-pointer"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 flex items-center justify-between mt-2 pt-4 border-t border-slate-105 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[10px] text-slate-400">
              با ذخیره پروفایل، هوش ربات پاسخ‌ها را منطبق بر شرایط پژوهشکده شما ارسال خواهد کرد.
            </p>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer select-none active:scale-95 shadow-md shadow-brand-500/10"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>پروفایل ذخیره شد!</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>بروزرسانی پروفایل هوشمند</span>
              </>
            )}
          </button>
        </div>

      </form>
    </motion.div>
  );
}
