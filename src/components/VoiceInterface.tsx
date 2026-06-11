import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, RefreshCw, Sparkles, HelpCircle } from "lucide-react";

interface VoiceInterfaceProps {
  onSpeakTranscript: (text: string) => void;
  lastAssistantResponse: string | null;
  speaking: boolean;
  setSpeaking: (val: boolean) => void;
}

export default function VoiceInterface({
  onSpeakTranscript,
  lastAssistantResponse,
  speaking,
  setSpeaking
}: VoiceInterfaceProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speechSpeed, setSpeechSpeed] = useState(1);
  const [browserSupport, setBrowserSupport] = useState({ recognition: true, synthesis: true });

  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check SpeechRecognition browser integration
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setBrowserSupport((prev) => ({ ...prev, recognition: false }));
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = "fa-IR"; // Set language to Persian
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setListening(true);
        setTranscript("درحال شنیدن صدای شما... (ایمنی اولویت اول کار است)");
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTranscript(resultText);
        // Dispatch translated voice to chatbot
        onSpeakTranscript(resultText);
      };

      rec.onerror = (err: any) => {
        console.error("Speech Recognition Error:", err);
        setTranscript("خطا در سیستم تشخیص صدا. دوباره تلاش کنید.");
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
      };

      recognitionRef.current = rec;
    }

    // Check SpeechSynthesis browser integration
    if (!window.speechSynthesis) {
      setBrowserSupport((prev) => ({ ...prev, synthesis: false }));
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [onSpeakTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      // Cancel speech synthesis readout before starting recognition
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
      }
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Start speech recognition fail", e);
      }
    }
  };

  const speakResponse = () => {
    if (!lastAssistantResponse || !window.speechSynthesis) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    // Clean markdown characters from text before synthesis
    const cleanText = lastAssistantResponse
      .replace(/[\*\#\`\-\>]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "fa-IR"; // Persian output voice fallback
    utterance.rate = speechSpeed;

    utterance.onend = () => {
      setSpeaking(false);
    };

    utterance.onerror = () => {
      setSpeaking(false);
    };

    utteranceRef.current = utterance;
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeedChange = (speed: number) => {
    setSpeechSpeed(speed);
    if (speaking && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      // Re-trigger with updated pace rate
      setTimeout(() => {
        speakResponse();
      }, 100);
    }
  };

  return (
    <div className="navy-gradient text-white rounded-2xl border border-[#1e3a8a]/40 p-6 flex flex-col gap-6 shadow-xl relative overflow-hidden">
      
      {/* Background visual graphics */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-8 translate-x-8"></div>
      <div className="absolute left-0 bottom-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl translate-y-8 -translate-x-8"></div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-md md:text-lg font-black flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-amber-300 animate-pulse" />
            <span>اتاق صوتی صمیمی پژوهشگاه (Speech-to-Text & TTS)</span>
          </h2>
          <p className="text-xs text-slate-100 opacity-90 mt-1">
            بدون محدودیت با صوت به زبان شیرین فارسی صحبت کنید و پاسخ‌ها را صوتی بشنوید
          </p>
        </div>

        {/* Browser Warning Alerts */}
        {(!browserSupport.recognition || !browserSupport.synthesis) && (
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-2 flex items-center gap-1.5 text-[10px] text-amber-200">
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>سیستم صوتی بهینه در مرورگرهای Chrome/Edge یافت می‌شود.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center relative z-10">
        
        {/* Unit 1: Speech-To-Text Transcriber */}
        <div className="flex flex-col items-center gap-4 bg-white/5 p-5 rounded-xl border border-white/10 text-center">
          <p className="text-xs font-bold text-slate-200">میکروفون صوتی پژوهشگر</p>
          
          {/* Main recording trigger button & ripples */}
          <div className="relative flex items-center justify-center my-2">
            {listening && (
              <>
                <span className="absolute inline-flex h-20 w-20 rounded-full bg-red-400 opacity-30 animate-ping"></span>
                <span className="absolute inline-flex h-24 w-24 rounded-full bg-red-500/15 animate-pulse"></span>
              </>
            )}
            <button
              onClick={toggleListening}
              className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer shadow-md select-none transition active:scale-95 ${
                listening
                  ? "bg-rose-500 hover:bg-rose-600 text-white"
                  : "bg-white hover:bg-slate-100 text-[#1b3a5f]"
              }`}
            >
              {listening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>
          </div>

          <div className="w-full text-center">
            <p className="text-xs text-slate-100 font-bold mb-1">
              {listening ? "درحال گوش دادن..." : "برای صحبت، کلید میکروفون بالا را بفشارید"}
            </p>
            <div className="bg-brand-800/40 p-3 rounded-lg text-xs leading-relaxed text-blue-200 min-h-[50px] font-mono border border-white/5 max-h-[120px] overflow-y-auto w-full">
              {transcript || "صدایی ضبط نشده است."}
            </div>
          </div>
        </div>

        {/* Unit 2: Voice Reader (TTS) */}
        <div className="flex flex-col items-center justify-between gap-4 bg-white/5 p-5 rounded-xl border border-white/10 h-full">
          <div className="text-center w-full">
            <p className="text-xs font-bold text-slate-200 mb-2">قرائت‌گر پاسخ هوش مصنوعی پژوهشگاه</p>
            <p className="text-[10px] text-slate-300 mb-4 px-2">
              آخرین پاسخ دریافتی را با موتور سنتز صدای فارسی با سرعت‌های دلبخواه قرائت کنید.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3.5 w-full">
            {/* Speed Multipliers */}
            <div className="flex items-center gap-1.5 justify-center bg-brand-800/60 p-1 rounded-lg border border-white/5 w-fit">
              <span className="text-[10px] text-slate-300 font-bold px-1.5">سرعت خوانش:</span>
              {[1, 1.25, 1.5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                    speechSpeed === speed
                      ? "bg-white text-brand-600 shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {speed === 1 ? "عادی (1x)" : `${speed}x`}
                </button>
              ))}
            </div>

            {/* Speaking actions */}
            <button
              onClick={speakResponse}
              disabled={!lastAssistantResponse}
              className={`w-full py-3 px-4 rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                !lastAssistantResponse
                  ? "bg-slate-500/20 text-slate-400 border border-white/5 cursor-not-allowed"
                  : speaking
                  ? "bg-amber-400 hover:bg-amber-500 text-brand-800 border-none animate-pulse"
                  : "bg-white hover:bg-slate-100 text-brand-650"
              }`}
            >
              {speaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{speaking ? "توقف خوانش صوتی" : "تلفظ و خواندن پاسخ با صدا"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
