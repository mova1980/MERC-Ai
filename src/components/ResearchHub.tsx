import React, { useState } from "react";
import { FolderPlus, FilePlus, Eye, Trash2, CloudCheck, WifiOff, FileText, Calendar, CloudLightning, RotateCcw } from "lucide-react";
import { Project, Note } from "../types";
import { formatShamsiDate } from "../utils/date";

interface ResearchHubProps {
  projects: Project[];
  notes: Note[];
  onAddProject: (name: string, description: string) => void;
  onDeleteProject: (id: string) => void;
  onAddNote: (projectId: string, title: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  offline: boolean;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  onResetData?: () => void;
}

export default function ResearchHub({
  projects,
  notes,
  onAddProject,
  onDeleteProject,
  onAddNote,
  onDeleteNote,
  offline,
  selectedProjectId,
  setSelectedProjectId,
  onResetData
}: ResearchHubProps) {
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const [noteSearch, setNoteSearch] = useState("");

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    onAddProject(newProjName.trim(), newProjDesc.trim());
    setNewProjName("");
    setNewProjDesc("");
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newNoteTitle.trim() || !newNoteContent.trim()) return;
    onAddNote(selectedProjectId, newNoteTitle.trim(), newNoteContent.trim());
    setNewNoteTitle("");
    setNewNoteContent("");
  };

  // Filter notes related to selected workspace project
  const filteredNotes = notes.filter((note) => {
    const matchesProj = !selectedProjectId || note.projectId === selectedProjectId;
    const matchesSearch =
      note.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
      note.content.toLowerCase().includes(noteSearch.toLowerCase());
    return matchesProj && matchesSearch;
  });

  const selectedProj = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Sidebar: Workspaces */}
      <div className="col-span-1 lg:col-span-4 flex flex-col gap-5">
        
        {/* Connection Status Indicator */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between shadow-xs ${
          offline 
            ? "bg-amber-50/90 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/40"
            : "bg-emerald-50/90 dark:bg-emerald-950/20 text-emerald-850 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40"
        }`}>
          <div className="flex items-center gap-2">
            {offline ? <WifiOff className="w-5 h-5 animate-pulse text-amber-600" /> : <CloudCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            <div>
              <p className="text-xs font-black">{offline ? "دسترسی آفلاین فعال" : "انتقال ابری پایدار"}</p>
              <p className="text-[10px] opacity-80 mt-0.5">
                {offline ? "یادداشت‌ها روی کش مرورگر ذخیره می‌شوند" : "پروژه‌ها آماده همگام‌سازی ابری هستند"}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-slate-800 border border-current-50 font-bold">
            {offline ? "OFFLINE" : "CLOUD"}
          </span>
        </div>

        {onResetData && (
          <button
            onClick={onResetData}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 bg-rose-50/70 hover:bg-rose-100 text-rose-750 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-350 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500 animate-spin" style={{ animationDuration: '4s' }} />
            <span>پاکسازی کامل یادداشت‌های فرضی و شروع واقعی</span>
          </button>
        )}

        {/* Workspace Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-brand-100 dark:border-brand-800 p-5 shadow-xs">
          <h3 className="text-sm font-black text-brand-500 dark:text-blue-400 flex items-center gap-2 mb-3">
            <FolderPlus className="w-4.5 h-4.5" />
            <span>ایجاد پروژه تحقیقاتی جدید</span>
          </h3>

          <form onSubmit={handleCreateProject} className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">نام پروژه / کلینیک پژوهشی:</label>
              <input
                type="text"
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                placeholder="مثال: نانومواد پیل سوختی"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">شرح کوتاه هدف پژوهشی:</label>
              <textarea
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
                placeholder="سنتز غشاها و ارزیابی کاتالیزور پلاتین..."
                rows={2}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-[#1b3a5f] hover:bg-[#122842] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-xs font-black transition cursor-pointer active:scale-95"
            >
              افزودن به پروژه‌ها
            </button>
          </form>
        </div>

        {/* Workspace Project List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-brand-100 dark:border-brand-800 p-5 flex flex-col gap-3">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">فضاهای کاری فعال شما</h3>
          
          <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pl-1">
            <button
              onClick={() => setSelectedProjectId(null)}
              className={`w-full p-3 text-right rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                selectedProjectId === null
                  ? "bg-[#1b3a5f]/5 border-[#1b3a5f] text-brand-500 dark:bg-blue-950/20 dark:border-blue-500 dark:text-blue-300"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-200"
              }`}
            >
              <span>همه یادداشت‌ها و اسناد پژوهشی</span>
              <span className="bg-[#1b3a5f]/10 dark:bg-blue-900 px-2 py-0.5 rounded-full text-[10px]">{notes.length}</span>
            </button>

            {projects.map((proj) => {
              const projNotesCount = notes.filter((n) => n.projectId === proj.id).length;
              return (
                <div
                  key={proj.id}
                  className={`group w-full p-3 rounded-xl border text-xs transition flex flex-col gap-1.5 ${
                    selectedProjectId === proj.id
                      ? "bg-[#1b3a5f]/5 border-[#1b3a5f] dark:bg-blue-950/20 dark:border-blue-500"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedProjectId(proj.id)}
                      className="text-right font-black flex-1 text-slate-700 dark:text-slate-200"
                    >
                      {proj.name}
                    </button>
                    <button
                      onClick={() => onDeleteProject(proj.id)}
                      className="text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition p-1"
                      title="حذف پروژه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{proj.description}</p>
                  <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatShamsiDate(proj.createdAt)}
                    </span>
                    <span className="font-bold">{projNotesCount} یادداشت علمی</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Panel: Notes & Active Library Documents */}
      <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
        
        {/* Write Note on Active Workspace */}
        {selectedProjectId ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-brand-100 dark:border-brand-800 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <FilePlus className="w-4.5 h-4.5 text-brand-500 dark:text-blue-400" />
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                ثبت سند علمی جدید در <span className="text-brand-500 dark:text-blue-400">"{selectedProj?.name}"</span>
              </h3>
            </div>

            <form onSubmit={handleCreateNote} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-4">
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="عنوان یادداشت / خلاصه فرضیه..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden"
                />
              </div>
              <div className="md:col-span-4">
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="داده‌های آزمایشگاهی یا استدلال فرضیاتی بدست‌آمده را بنویسید..."
                  rows={3}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden resize-none"
                />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-xs font-black transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>ثبت سند در پروژه</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-brand-50/40 dark:bg-slate-900/40 border border-dashed border-brand-100 dark:border-brand-800 p-5 rounded-2xl text-center">
            <p className="text-xs text-brand-500 dark:text-blue-400 font-bold">
              👈 برای اضافه کردن یادداشت آزمایشگاهی تخصصی و فرموله کردن فرضیات، ابتدا یک پروژه را از منوی سمت راست انتخاب کنید.
            </p>
          </div>
        )}

        {/* Note Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-brand-100 dark:border-brand-800 p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                {selectedProjectId ? `اسناد پروژه "${selectedProj?.name}"` : "آرشیو کلیه اسناد و یادداشت‌ها"}
              </h3>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                قابلیت خواندن مکتوبات بصورت ۱۰۰ درصد آفلاین در زمان عدم اتصال به اینترنت پژوهشگاه
              </p>
            </div>

            {/* Local search in notes */}
            <input
              type="text"
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              placeholder="فیلتر یادداشت‌ها..."
              className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>

          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 bg-slate-50/50 dark:bg-slate-850/60 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">{note.title}</span>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                        title="پاک کردن"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed mb-4">
                      {note.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                    <span>
                      به‌روزرسانی: {formatShamsiDate(note.updatedAt)}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-slate-550 dark:text-slate-200">
                      {note.synced ? (
                        <>
                          <CloudCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>سینک شده با درایو</span>
                        </>
                      ) : (
                        <>
                          <CloudLightning className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                          <span>در صف سینک ابری</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              هیچ یادداشت تحقیقاتی یافت نشد. می‌توانید با ثبت موارد فوق اطلاعات پژوهشی خود را ذخیره کنید.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
