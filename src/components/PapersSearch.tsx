import { useState } from "react";
import { Search, BookOpen, Copy, Check, FileCode, Tag, Sparkles } from "lucide-react";
import { MERC_PAPERS, getCitationFormats } from "../data/papers";
import { Paper } from "../types";

interface PapersSearchProps {
  onPaperPrompt: (paperText: string) => void;
}

export default function PapersSearch({ onPaperPrompt }: PapersSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<"all" | "materials" | "energy">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Filter papers based on search query and category domain
  const filteredPapers = MERC_PAPERS.filter((paper) => {
    const matchesSearch =
      paper.title.includes(searchTerm) ||
      paper.authors.includes(searchTerm) ||
      paper.abstract.includes(searchTerm) ||
      paper.keywords.some((k) => k.includes(searchTerm));
    const matchesDomain = selectedDomain === "all" || paper.domain === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  const handleCopyCitation = (paper: Paper, format: "apa" | "chicago" | "bibtex" | "ris") => {
    const citations = getCitationFormats(paper);
    const textToCopy = citations[format];
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(paper.id);
    setCopiedFormat(format);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedFormat(null);
    }, 2000);
  };

  const handleConsultAI = (paper: Paper) => {
    const paperOverview = `لطفا مقاله پژوهشی زیر را با هم تحلیل کنیم:
عنوان: ${paper.title}
نویسندگان: ${paper.authors}
سال انتشار: ${paper.year}
چکیده: ${paper.abstract}

لطفا این مقاله را در پژوهشنامه پژوهشگاه مواد و انرژی بررسی کن و جزئیات کاربردی آن در صنعت را به عنوان مشاور پژوهشی مطرح و پیشنهاد بفرمایید.`;
    onPaperPrompt(paperOverview);
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-brand-100 dark:border-brand-800 shadow-sm p-6 flex flex-col gap-6">
      
      {/* Search Bar & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-md md:text-lg font-black text-brand-500 dark:text-blue-400 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-500" />
            <span>پایگاه داده مقالات پژوهشگاه مواد و انرژی (MERC)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            دسترسی آفلاین و جستجوی مقالات علمی داخلی منتشر شده در پژوهشگاه
          </p>
        </div>

        {/* Categories Tab */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setSelectedDomain("all")}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition ${
              selectedDomain === "all"
                ? "bg-white dark:bg-slate-700 text-brand-500 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            همه حوزه‌ها
          </button>
          <button
            onClick={() => setSelectedDomain("materials")}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition ${
              selectedDomain === "materials"
                ? "bg-white dark:bg-slate-700 text-brand-500 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            فناوری مواد
          </button>
          <button
            onClick={() => setSelectedDomain("energy")}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition ${
              selectedDomain === "energy"
                ? "bg-white dark:bg-slate-700 text-brand-500 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            سیستم‌های انرژی
          </button>
        </div>
      </div>

      {/* Input box */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="جستجوی عنوان، نام نویسنده، واژگان کلیدی یا واژه تخصصی..."
          className="w-full pr-11 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 dark:focus:ring-blue-500 transition"
        />
        <Search className="w-5 h-5 text-slate-400 absolute right-4 top-3.5" />
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
        {filteredPapers.length > 0 ? (
          filteredPapers.map((paper) => {
            const citations = getCitationFormats(paper);
            return (
              <div
                key={paper.id}
                className="p-5 bg-slate-50/55 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-brand-100 dark:hover:border-blue-900/40 transition flex flex-col justify-between gap-4"
              >
                <div>
                  {/* Badge & ID */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                      paper.domain === "materials"
                        ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    }`}>
                      {paper.domain === "materials" ? "فناوری مهندسی مواد" : "انرژی و مکانیک خلاق"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{paper.id}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed mb-1">
                    {paper.title}
                  </h3>
                  
                  {/* Authors */}
                  <p className="text-xs text-brand-500 dark:text-slate-300 font-medium mb-2.5">
                    نویسندگان: {paper.authors} | {paper.journal} (سال {paper.year})
                  </p>

                  {/* Abstract */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-3">
                    {paper.abstract}
                  </p>

                  {/* Keywords */}
                  <div className="flex flex-wrap gap-1.5 items-center mb-4">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    {paper.keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 dark:bg-slate-850 px-2 py-0.5 text-[10px] text-slate-500 rounded-md"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Citations Export drawer */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] text-slate-400 font-medium">خروجی فرمت استاندارد ارجاع‌دهی علمی:</span>
                  </div>

                  {/* Citation pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {(["apa", "chicago", "bibtex", "ris"] as const).map((format) => {
                      const isCopied = copiedId === paper.id && copiedFormat === format;
                      return (
                        <button
                          key={format}
                          onClick={() => handleCopyCitation(paper, format)}
                          className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition flex items-center gap-0.5 border ${
                            isCopied
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{format.toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Ask AI Trigger */}
                  <button
                    onClick={() => handleConsultAI(paper)}
                    className="w-full mt-1.5 py-1.5 px-3 bg-[#1b3a5f]/5 hover:bg-[#1b3a5f]/10 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-brand-500 dark:text-blue-400 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>تحلیل و مشاوره تخصصی در چت هوش مصنوعی</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-1 lg:col-span-2 py-8 text-center text-slate-400 text-xs">
            مقاله علمی یا کلیدواژه‌ای با مشخصات "{searchTerm}" در بانک داده پژوهشگاه یافت نشد.
          </div>
        )}
      </div>

    </section>
  );
}
