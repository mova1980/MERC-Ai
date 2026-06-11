import React, { useState, useEffect, useRef } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  MessageSquare,
  FileText,
  Search,
  FolderOpen,
  Send,
  Sparkles,
  Info,
  Loader2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronLeft,
  BookOpen,
  CheckCircle,
  Settings,
  ShieldCheck,
  FileUp,
  CloudUpload,
  User as UserIcon,
  RotateCcw
} from "lucide-react";
import { initAuth, googleSignIn, logout, getAccessToken } from "./lib/auth";
import { Message, Project, Note, AppTheme, AccentColor } from "./types";
import { MERC_PAPERS } from "./data/papers";
import { formatShamsiDate, formatShamsiTime } from "./utils/date";
import UserProfile, { UserPersona } from "./components/UserProfile";
import { motion, AnimatePresence } from "motion/react";

// Custom UI Components
import Header from "./components/Header";
import VoiceInterface from "./components/VoiceInterface";
import PapersSearch from "./components/PapersSearch";
import ResearchHub from "./components/ResearchHub";

// Seed default initial projects and notes for real-world simulation
const SEED_PROJECTS: Project[] = [
  {
    id: "proj-001",
    name: "پروژه سلول‌های خورشیدی اکسید سرامیک",
    description: "مطالعه و ساخت سلول‌های خورشیدی مبتنی بر فیلم‌های نازک اکسید سریم دوپ شده در آزمایشگاه انرژی‌های نو",
    createdAt: new Date().toISOString()
  }
];

const SEED_NOTES: Note[] = [
  {
    id: "note-001",
    projectId: "proj-001",
    title: "نتایج تست سختی پوشش نانوکامپوزیت",
    content: "سختی لایه نشانی به راندمان ۸۵۰ ویکرز رسید. فرکانس پالس بهینه ۵۰ هرتز تعیین گردید. ایمنی اولویت اول کار است، هماهنگی با ماسک ضدغبار الزامی است.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    synced: false
  }
];

export default function App() {
  // Theme & Layout state
  const [theme, setTheme] = useState<AppTheme>({ mode: "auto", accent: "navy" });
  const [activeTab, setActiveTab] = useState<"chat" | "pdf" | "search" | "workspace" | "profile">("chat");
  const [offline, setOffline] = useState(!navigator.onLine);

  // User Persona Customization
  const [persona, setPersona] = useState<UserPersona>({
    fullName: "",
    role: "پژوهشگر دکتری تخصصی (Ph.D)",
    department: "پژوهشکده نیمه‌هادی‌ها",
    interests: ""
  });

  // Auth & Cloud Sync States
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Local storage cache for workspaces
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Chat UI state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // PDF Upload & Analysis State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [analyzingPdf, setAnalyzingPdf] = useState(false);
  const [pdfPrompt, setPdfPrompt] = useState("");
  const [pdfAnalysisResult, setPdfAnalysisResult] = useState<string | null>(null);

  // Initial loads: load local workspaces and default seeds
  useEffect(() => {
    const savedProjects = localStorage.getItem("merc_projects");
    const savedNotes = localStorage.getItem("merc_notes");
    const savedPersona = localStorage.getItem("merc_persona");

    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    } else {
      setProjects(SEED_PROJECTS);
      localStorage.setItem("merc_projects", JSON.stringify(SEED_PROJECTS));
    }

    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    } else {
      setNotes(SEED_NOTES);
      localStorage.setItem("merc_notes", JSON.stringify(SEED_NOTES));
    }

    if (savedPersona) {
      setPersona(JSON.parse(savedPersona));
    }

    // Set Welcome Messages
    setMessages([
      {
        id: "welcome",
        sender: "assistant",
        text: "با سلام و درود ، من دستیار هوش مصنوعی پژوهشگاه مواد و انرژی هستم ، امروز چطور میتونم کمکتون کنم ؟",
        timestamp: formatShamsiTime()
      }
    ]);

    // Network status listener
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Save changes back to Local Storage
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem("merc_projects", JSON.stringify(projects));
    }
  }, [projects]);

  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem("merc_notes", JSON.stringify(notes));
    }
  }, [notes]);

  // Day / Night Theme Synchronizer
  useEffect(() => {
    const applyTheme = () => {
      let isDark = false;
      if (theme.mode === "dark") {
        isDark = true;
      } else if (theme.mode === "auto") {
        const hour = new Date().getHours();
        // Night is before 7 AM and after 6 PM
        isDark = hour >= 18 || hour < 7;
      }

      if (isDark) {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
    };

    applyTheme();

    // Recheck if Auto mode
    const timer = setInterval(() => {
      if (theme.mode === "auto") applyTheme();
    }, 60000);

    return () => clearInterval(timer);
  }, [theme]);

  // Firebase auth sync
  useEffect(() => {
    const unsubscribe = initAuth(
      (signedUser, signingToken) => {
        setUser(signedUser);
        setToken(signingToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Scroll Chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auth Operations
  const handleGoogleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
      }
    } catch (e) {
      console.error("Login initialization failing", e);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
  };

  // Google Drive synchronizer
  const handleSyncWithGoogleDrive = async () => {
    if (!user) {
      alert("لطفاً ابتدا از دکمه بالا برای ورود با حساب گوگل و اتصال به درایو استفاده کنید.");
      return;
    }

    const accessToken = await getAccessToken() || token;
    if (!accessToken) {
      alert("خطای دسترسی: کلید معتبر گوگل بازیابی نشد. مجدداً لاگین کنید.");
      return;
    }

    setSyncing(true);
    try {
      // Step 1: Search for existing workspaces file
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='merc_assistant_workspace.json' and trashed=false`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      const searchData = await searchRes.json();
      const files = searchData.files || [];

      const workspaceContent = {
        projects,
        notes,
        lastSyncedAt: new Date().toISOString(),
        author: user.email
      };

      let fileId = "";
      if (files.length > 0) {
        // Exists, get fileId
        fileId = files[0].id;

        // Overwrite the content
        await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(workspaceContent)
          }
        );
      } else {
        // Create new metadata entry
        const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: "merc_assistant_workspace.json",
            mimeType: "application/json"
          })
        });
        const metaData = await metaRes.json();
        fileId = metaData.id;

        // Upload media contents
        await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(workspaceContent)
          }
        );
      }

      // Update sync markers
      setNotes((prevNotes) => prevNotes.map((n) => ({ ...n, synced: true })));
      setLastSynced(formatShamsiTime());
      alert("داده‌های شما با موفقیت با گوگل درایو همگام‌سازی شد! 🖥️☁️");
    } catch (err: any) {
      console.error("GDrive Sync failure", err);
      alert("خطا در همگام‌سازی ابری گوگل درایو: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Chat message submit logic (combining text and potential voice transcripts)
  const handleSendMessage = async (textOverride?: string) => {
    const queryText = textOverride ? textOverride.trim() : inputMessage.trim();
    if (!queryText) return;

    if (!textOverride) {
      setInputMessage("");
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: queryText,
      timestamp: formatShamsiTime()
    };

    setMessages((prev) => [...prev, userMsg]);
    setSendingMessage(true);

    try {
      // Compile conversational inputs
      const recentChatScope = [...messages, userMsg].slice(-10);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: recentChatScope,
          persona: persona
        })
      });

      const resData = await response.json();
      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "assistant",
            text: resData.text,
            timestamp: formatShamsiTime()
          }
        ]);
      } else {
        throw new Error(resData.error || "خطای ارتباطی با سرور هوش مصنوعی.");
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: `⚠️ خطا: ${err.message || "پاسخی از سرور دریافت نشد. لطفاً اینترنت مجتمع را بررسی نمایید."}`,
          timestamp: formatShamsiTime()
        }
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  // PDF Upload & Base64 Converter
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("لطفا فقط فایل با پسوند PDF انتخاب فرمایید.");
      return;
    }

    setSelectedFile(file);
    setPdfAnalysisResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPdfBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // PDF Server Analyzer Request
  const handleAnalyzePdfPaper = async () => {
    if (!pdfBase64 || !selectedFile) return;

    setAnalyzingPdf(true);
    try {
      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64: pdfBase64,
          pdfName: selectedFile.name,
          prompt: pdfPrompt || undefined
        })
      });

      const data = await response.json();
      if (response.ok) {
        setPdfAnalysisResult(data.text);
      } else {
        throw new Error(data.error || "خطای تحلیل فایل");
      }
    } catch (e: any) {
      console.error(e);
      setPdfAnalysisResult(`❌ فرآیند تحلیل فایل علمی با شکست روبرو گردید: ${e.message}`);
    } finally {
      setAnalyzingPdf(false);
    }
  };

  // Workspace actions
  const handleAddProject = (name: string, description: string) => {
    const nextProj: Project = {
      id: "proj-" + Date.now(),
      name,
      description,
      createdAt: new Date().toISOString()
    };
    setProjects((prev) => [nextProj, ...prev]);
  };

  const handleDeleteProject = (id: string) => {
    const confirmed = window.confirm("آیا حتماً می‌خواهید این پروژه تحقیقاتی را حذف نمایید؟ کلیه اسناد مربوطه در حافظه باقی می‌ماند.");
    if (confirmed) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleAddNote = (projectId: string, title: string, content: string) => {
    const nextNote: Note = {
      id: "note-" + Date.now(),
      projectId,
      title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false
    };
    setNotes((prev) => [nextNote, ...prev]);
  };

  const handleDeleteNote = (id: string) => {
    const confirmed = window.confirm("آیا مایل به حذف دائمی این سند پژوهشی هستید؟");
    if (confirmed) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const handleResetData = () => {
    const confirmed = window.confirm("آیا حتماً مایل به پاکسازی اطلاعات تستی و نمونه هستید؟ کلیه پروژه‌ها و یادداشت‌های نمونه حذف خواهند شد تا بتوانید زیر بار واقعی بنویسید.");
    if (confirmed) {
      setProjects([]);
      setNotes([]);
      localStorage.removeItem("merc_projects");
      localStorage.removeItem("merc_notes");
      setSelectedProjectId(null);

      setMessages((prev) => [
        ...prev,
        {
          id: "sys-reset-" + Date.now(),
          sender: "assistant",
          text: "🔄 کلیه اطلاعات تستی با موفقیت پاکسازی شد! مکتوبات شما آماده بارگذاری واقعی و لایو است. هم‌اکنون می‌توانید از تب «فضای کاری» پروژه‌های تخصصی ثبت کنید.",
          timestamp: formatShamsiTime()
        }
      ]);
      setActiveTab("chat");
    }
  };

  const handleUpdatePersona = (newPersona: UserPersona) => {
    setPersona(newPersona);
    localStorage.setItem("merc_persona", JSON.stringify(newPersona));
    setActiveTab("chat");
  };

  const handleSpeakTranscriptFromVoice = (transcriptText: string) => {
    handleSendMessage(transcriptText);
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.sender === "assistant")?.text || null;

  // Accent styles dict
  const accentClasses = {
    navy: "border-brand-500 text-brand-500 hover:bg-brand-50/50 bg-[#1b3a5f]",
    teal: "border-[#0d9488] text-[#0d9488] hover:bg-teal-50 bg-[#0d9488]",
    emerald: "border-[#059669] text-[#059669] hover:bg-emerald-50 bg-[#059669]",
    violet: "border-[#7c3aed] text-[#7c3aed] hover:bg-violet-50 bg-[#7c3aed]",
    crimson: "border-[#e11d48] text-[#e11d48] hover:bg-rose-50 bg-[#e11d48]"
  };

  const accentColorCode = {
    navy: "text-[#1b3a5f]",
    teal: "text-[#0d9488]",
    emerald: "text-[#059669]",
    violet: "text-[#7c3aed]",
    crimson: "text-[#e11d48]"
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-[#080f1d] theme-transition flex flex-col font-sans mb-12">
      
      {/* 1. Header with logo and user preferences */}
      <Header
        user={user}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        theme={theme}
        setTheme={setTheme}
        syncing={syncing}
        onTriggerSync={handleSyncWithGoogleDrive}
        lastSynced={lastSynced}
      />

      {/* Main container */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex-1 flex flex-col gap-8">
        
        {/* Active Campus Status and Hours banner */}
        <div className="glass-card border border-brand-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 theme-transition backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                پایگاه علمی فعال پژوهشگاه مواد و انرژی ایران | امروز: {formatShamsiDate()}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                توسعه و کالیبراسیون تخصصی بر مبنای قوانین استخدام، استانداردهای آزمایشگاهی مرکزی و فرم‌های دانشجویی وزارت علوم
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-3.5 py-1.5 border border-slate-200 dark:border-slate-705">
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">
              ساعات کاری پژوهشگاه: ۷ صبح الی ۱۳ (شنبه لغایت چهارشنبه) | سایت اصلی:{" "}
              <a
                href="https://www.merc.ac.ir"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-blue-500 text-brand-500 font-bold ml-1"
              >
                merc.ac.ir
              </a>
            </span>
          </div>
        </div>

        {/* 2. Audio Speak interface wrapper (Always accessible for speech-to-speech) */}
        <VoiceInterface
          onSpeakTranscript={handleSpeakTranscriptFromVoice}
          lastAssistantResponse={lastAssistantMsg}
          speaking={assistantIsSpeaking}
          setSpeaking={setAssistantIsSpeaking}
        />

        {/* 3. Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <div className="flex overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab("chat")}
              className={`pb-3.5 px-5 text-sm font-black cursor-pointer border-b-2 transition flex items-center gap-2 shrink-0 ${
                activeTab === "chat"
                  ? `${accentColorCode[theme.accent]} ${theme.accent === "navy" ? "border-[#1b3a5f]" : `border-${theme.accent}-500`}`
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-205"
              }`}
            >
              <MessageSquare className="w-4.5 h-4.5" />
              <span>پایگاه چت هوشمند پژوهشگاهی</span>
            </button>
            <button
              onClick={() => setActiveTab("pdf")}
              className={`pb-3.5 px-5 text-sm font-black cursor-pointer border-b-2 transition flex items-center gap-2 shrink-0 ${
                activeTab === "pdf"
                  ? `${accentColorCode[theme.accent]} ${theme.accent === "navy" ? "border-[#1b3a5f]" : `border-${theme.accent}-500`}`
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-205"
              }`}
            >
              <FileText className="w-4.5 h-4.5" />
              <span>تحلیل مقالات علمی PDF</span>
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`pb-3.5 px-5 text-sm font-black cursor-pointer border-b-2 transition flex items-center gap-2 shrink-0 ${
                activeTab === "search"
                  ? `${accentColorCode[theme.accent]} ${theme.accent === "navy" ? "border-[#1b3a5f]" : `border-${theme.accent}-500`}`
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-205"
              }`}
            >
              <Search className="w-4.5 h-4.5" />
              <span>بانک اطلاعات مقالات داخلی</span>
            </button>
            <button
              onClick={() => setActiveTab("workspace")}
              className={`pb-3.5 px-5 text-sm font-black cursor-pointer border-b-2 transition flex items-center gap-2 shrink-0 ${
                activeTab === "workspace"
                  ? `${accentColorCode[theme.accent]} ${theme.accent === "navy" ? "border-[#1b3a5f]" : `border-${theme.accent}-500`}`
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-205"
              }`}
            >
              <FolderOpen className="w-4.5 h-4.5" />
              <span>فضای کاری و آرشیو مکتوبات</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`pb-3.5 px-5 text-sm font-black cursor-pointer border-b-2 transition flex items-center gap-2 shrink-0 ${
                activeTab === "profile"
                  ? `${accentColorCode[theme.accent]} ${theme.accent === "navy" ? "border-[#1b3a5f]" : `border-${theme.accent}-500`}`
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-205"
              }`}
            >
              <UserIcon className="w-4.5 h-4.5" />
              <span>تنظیمات هویت پژوهشی</span>
            </button>
          </div>
        </div>

        {/* 4. Dynamic Panel views based on activeTab */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            
            {/* VIEW A: CHATBOT */}
            {activeTab === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="glass-card border border-brand-100 dark:border-brand-800 rounded-2xl flex flex-col md:grid md:grid-cols-12 overflow-hidden h-[600px] shadow-lg">
                  
                  {/* Left sidebar instructions block */}
                  <div className="md:col-span-4 bg-slate-50/70 p-5 border-l border-slate-100 dark:bg-slate-900/50 dark:border-brand-850 h-full overflow-y-auto flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <Info className="w-4.5 h-4.5 text-slate-500" />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">راهنمای هوш صوتی و متنی پژوهشگاه</span>
                    </div>
                    
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      می‌توانید در کادر گفتگو تایپ کنید یا میکروفون صوتی را فعال کنید تا ربات با ۴ تخصص همزمان به شما کمک کند:
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px] leading-relaxed">
                        <span className="font-black text-blue-600 dark:text-blue-400 block mb-1">💼 واحد اداری و استخدام عمومی:</span>
                        پاسخ به سوالات مأموریت، مرخصی دفتری، محاسبات پایه‌ای حقوق و ساختارهای اداری.
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px] leading-relaxed">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 block mb-1">🔬 سلامت، ایمنی و آزمایشگاه‌ها:</span>
                        نحوه ثبت سفارش وسایل مصرفی آزمایشگاهی، چک لیست‌های ارزیابی روزانه و ثبت خرابی کوره یا کاتالیزور.
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px] leading-relaxed">
                        <span className="font-black text-violet-600 dark:text-violet-400 block mb-1">🎓 امور دانشجویی و کارآموزی:</span>
                        مراحل انتخاب اساتید راهنما، مهلت تحویل گراوی فرم‌ها و قوانین تحقیقاتی دانشجویان.
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px] leading-relaxed">
                        <span className="font-black text-amber-600 dark:text-amber-400 block mb-1">📈 مشاوره پژوهشی اساتید:</span>
                        نگارش پروپوزال، گرنت‌های صنعتی، همکاری بهینه با صنعت و کدهای ارزیابی.
                      </div>
                    </div>

                    <div className="mt-auto border-t border-slate-200 dark:border-slate-700 pt-3 flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>سامانه کالیبره شده با بخشنامه‌های دولتی ایران</span>
                    </div>
                  </div>

                  {/* Right core chat feed */}
                  <div className="md:col-span-8 flex flex-col justify-between h-full relative">
                    
                    {/* Scrollable messages container */}
                    <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[490px]">
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex flex-col max-w-[80%] ${
                            m.sender === "user" ? "mr-auto items-start" : "ml-auto items-end"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-slate-400 font-bold">
                            <span>{m.sender === "user" ? "پژوهشگر" : "ربات پژوهشگاه"}</span>
                            <span>•</span>
                            <span>{m.timestamp}</span>
                          </div>
                          <div
                            className={`p-3.5 text-xs leading-relaxed whitespace-pre-line shadow-md transition-all duration-200 ${
                              m.sender === "user"
                                ? `chat-bubble-user ${theme.accent !== "navy" ? accentClasses[theme.accent].split(" ").slice(-1)[0] : ""}`
                                : "chat-bubble-ai rounded-xl text-slate-800 dark:text-slate-100"
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      ))}

                      {sendingMessage && (
                        <div className="flex flex-col ml-auto items-end max-w-[70%] animate-pulse">
                          <div className="text-[10px] text-slate-400 font-bold mb-1 mr-1">دستیار درحال استنتاج...</div>
                          <div className="p-3.5 bg-slate-100 dark:bg-slate-850 rounded-2xl rounded-tr-xs text-xs flex items-center gap-2 text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <span>من درحال پردازش و استخراج آیین‌نامه‌ها هستم...</span>
                          </div>
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>

                    {/* Bottom text Input action */}
                    <div className="p-4 border-t border-slate-100 dark:border-brand-800 bg-white/50 dark:bg-slate-900/50 sticky bottom-0">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSendMessage();
                          }}
                          placeholder="پرسش خود را در خصوص مسائل حقوقی، ایمنی آزمایشگاه، آیین‌نامه دانشجویان یا پروپوزال مطرح کنید..."
                          className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500 dark:focus:ring-blue-500 transition"
                          disabled={sendingMessage}
                        />
                        <button
                          onClick={() => handleSendMessage()}
                          disabled={sendingMessage || !inputMessage.trim()}
                          className={`px-4 bg-[#1b3a5f] hover:bg-[#122842] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl shadow-xs flex items-center justify-center cursor-pointer transition active:scale-95 disabled:opacity-40 disabled:scale-100`}
                        >
                          <Send className="w-4 h-4 rotate-180" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* VIEW B: PDF ANALYZER */}
            {activeTab === "pdf" && (
              <motion.div
                key="pdf"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="glass-card border border-brand-100 dark:border-brand-800 rounded-2xl p-6 shadow-lg flex flex-col gap-6">
                  <div>
                    <h2 className="text-md md:text-lg font-black text-brand-500 dark:text-blue-400 flex items-center gap-2">
                      <FileUp className="w-5 h-5 text-brand-500" />
                      <span>تحلیل ساختاری و هوشمند مقالات علمی PDF</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      فایل‌های مقالات خود را با فرمت PDF آپلود کنید تا هوش مصنوعی نوآوری‌ها، فرضیات و نتایج آزمایشگاهی آن را برای شما ارزیابی کند.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Upload & Setup */}
                    <div className="col-span-1 border border-dashed border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-850/20">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">بارگذاری سند PDF</p>

                      <div className="border border-dashed border-brand-200 dark:border-blue-900/60 rounded-xl p-6 text-center hover:bg-white dark:hover:bg-slate-800 hover:border-brand-500 transition relative cursor-pointer">
                        <input
                          type="file"
                          id="pdf-upload"
                          accept=".pdf"
                          onChange={handlePdfUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <CloudUpload className="w-10 h-10 text-brand-500" />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">کلیک یا کشیدن فایل PDF به اینجا</span>
                          <span className="text-[10px]">فرمت پذیرفته شده: فقط PDF (تا سقف ۱۰ مگابایت)</span>
                        </div>
                      </div>

                      {selectedFile && (
                        <div className="p-3 bg-emerald-50/55 dark:bg-emerald-950/20 border border-emerald-150 rounded-xl">
                          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate">{selectedFile.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1">اندازه فایل علمی: {(selectedFile.size / (1024 * 1024)).toFixed(2)} مگابایت</p>
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">دستورالعمل ویژه (اختیاری):</label>
                        <textarea
                          value={pdfPrompt}
                          onChange={(e) => setPdfPrompt(e.target.value)}
                          placeholder="مثال: خلاصه‌ای از فرضیات پیل صختی و نوآوری این قطعه را ارائه بفرما..."
                          rows={3}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden resize-none"
                        />
                      </div>

                      <button
                        onClick={handleAnalyzePdfPaper}
                        disabled={analyzingPdf || !pdfBase64}
                        className="w-full py-2.5 bg-[#1b3a5f] hover:bg-[#122842] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-black transition cursor-pointer select-none active:scale-95 disabled:opacity-40"
                      >
                        {analyzingPdf ? "درحال اسکن و تحلیل..." : "شروع تحلیل فایل با هوش مصنوعی"}
                      </button>
                    </div>

                    {/* Analysis Result display */}
                    <div className="col-span-1 lg:col-span-2 border border-slate-100 dark:border-slate-800 p-5 rounded-xl h-[450px] overflow-y-auto bg-slate-50/20 flex flex-col">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                        گزارش علمی و نتایج ارزیابی مقاله
                      </p>

                      {analyzingPdf ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                          <p className="text-xs">پژوهشگاه مواد درحال استخراج داده‌ها و آنالیز فایلهای پی‌دی‌اف است، لطفاً شکیبا باشید...</p>
                        </div>
                      ) : pdfAnalysisResult ? (
                        <div className="text-xs text-slate-705 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-mono">
                          {pdfAnalysisResult}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 text-center">
                          <FileText className="w-12 h-12 text-slate-300" />
                          <p className="text-xs font-bold">هیچ تحلیلی صادر نشده است.</p>
                          <p className="text-[10px]">فایل PDF مقاله علمی خود را آپلود کنید و گزینه شروع تحلیل را بفشارید.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* VIEW C: ARTICLES SEARCH */}
            {activeTab === "search" && (
              <motion.div
                key="search"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <PapersSearch
                  onPaperPrompt={(paperText) => {
                    setActiveTab("chat");
                    handleSendMessage(paperText);
                  }}
                />
              </motion.div>
            )}

            {/* VIEW D: PERSONALIZED WORKSPACE */}
            {activeTab === "workspace" && (
              <motion.div
                key="workspace"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <ResearchHub
                  projects={projects}
                  notes={notes}
                  onAddProject={handleAddProject}
                  onDeleteProject={handleDeleteProject}
                  onAddNote={handleAddNote}
                  onDeleteNote={handleDeleteNote}
                  offline={offline}
                  selectedProjectId={selectedProjectId}
                  setSelectedProjectId={setSelectedProjectId}
                  onResetData={handleResetData}
                />
              </motion.div>
            )}

            {/* VIEW E: PROFILE COMPONENT */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <UserProfile
                  persona={persona}
                  onUpdatePersona={handleUpdatePersona}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* 5. Quick Support and contacts section */}
        <section className="bg-brand-50 border border-brand-100 dark:bg-slate-900/60 dark:border-brand-800/80 rounded-2xl p-6 theme-transition">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            <div className="col-span-1">
              <h3 className="text-sm font-black text-[#1b3a5f] dark:text-blue-400">درباره پژوهشگاه مواد و انرژی ایران</h3>
              <p className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1.5">
                پژوهشگاه مواد و انرژی دارای سه پژوهشکده مستقل نیمه‌هادی‌ها، مواد سرامیکی و سیستم‌های انرژی نو می‌باشد.
                هدف این دستیار بومی، ایجاد تحول هوش صوتی و متنی در پاسخگویی به پرسنل و محققان گرانقدر میهمنمان ایران است.
              </p>
            </div>

            <div className="col-span-1 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[10px] leading-relaxed flex flex-col gap-1.5 self-stretch justify-center">
              <span className="font-bold text-[#1b3a5f] dark:text-blue-400">آدرس جاده کرج:</span>
              کرج، انتهای مشکین‌دشت، صندوق پستی ۳۱۷۸۵/۱۱۵۵، پژوهشگاه مواد و انرژی.
              <span className="font-bold text-[#1b3a5f] dark:text-blue-400">شماره تلفن واحد آزمایشگاه‌ها:</span>
              ۰۲۶-۳۶۲۸۰۰۴۱-۹
            </div>

            <div className="col-span-1 flex flex-col gap-2.5">
              <h4 className="text-[10.5px] font-black text-slate-700 dark:text-slate-200">صلاحیت‌های تخصصی این هوش مصنوعی بومی:</h4>
              <ul className="text-[10px] text-slate-500 space-y-1">
                <li className="flex items-center gap-1">
                  <span className="text-emerald-500 text-xs">✓</span> مجهز به سیستم تشخیص گفتار فارسی بومی
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-emerald-500 text-xs">✓</span> قابلیت خواندن خروجی‌ها با انواع ضریب سرعت
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-emerald-500 text-xs">✓</span> خروجی APA و BibTeX مقالات علمی در کسری از ثانیه
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-emerald-500 text-xs">✓</span> ذخیره‌سازی ابری امن در بستر درایو شخصی شما
                </li>
              </ul>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
