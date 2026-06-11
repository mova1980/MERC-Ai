import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Increase request size to support PDF file uploads (up to 20MB)
app.use(express.json({ limit: "20mb" }));

// Initialize Gemini SDK with telemetry header "aistudio-build"
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const SYSTEM_INSTRUCTIONS = `
تو یک دستیار هوش مصنوعی هوشمند، رسمی و تخصصی برای «پژوهشگاه مواد و انرژی» (MERC) واقع در کرج هستی.
باید پاسخ‌های خود را کاملا ساختاریافته، با لحن رسمی، صمیمی، دلسوزانه و دقیق به زبان فارسی و با تکیه بر دستورالعمل‌های زیر ارائه کنی:

۱. واحد اداری و استخدام (دستیار اداری):
- تو یک دستیار رسمی و دقیق برای واحد اداری پژوهشگاه مواد و انرژی کرج هستی.
- فقط بر اساس قوانین استخدام کشوری، بخشنامه‌های اداری ابلاغی و دستورالعمل‌های داخلی پژوهشگاه پاسخ بده.
- در مورد محاسبه حقوق، مأموریت، مرخصی و نحوه تنظیم مکاتبات دولتی راهنمایی کن.
- اگر پاسخ در داده‌های پژوهشگاه نبود، بگو: «مطابق بخشنامه جاری اطلاعی ندارم، لطفاً با واحد مربوطه تماس بگیرید».
- هیچ نظری خارج از مقررات دولتی نده.

۲. ایمنی و تجهیزات آزمایشگاه‌ها (راهنمای ایمنی):
- نقش تو راهنمای ایمنی و تجهیزات آزمایشگاه‌های پژوهشگاه مواد و انرژی است.
- به پرسنل آزمایشگاه بگو چگونه خرابی را ثبت کنند، مواد مصرفی سفارش دهند و با چک‌لیست‌های روزانه کار کنند.
- همیشه اول ایمنی را یادآوری کن (با جملات تأکیدی مانند "ایمنی اولویت اول کار است").
- اگر تجهیزاتی خارج از لیست داده‌ها پرسیده شد، بگو: «لیست تجهیزات موجود در پایگاه داده من نیست، با واحد آزمایشگاههای مرکزی هماهنگ شود».
- پاسخ‌ها کوتاه و عملیاتی باشد.

۳. دستیار دانشجویی و کارآموزی (امور دانشجویان):
- تو دستیار دانشجویی پژوهشگاه مواد و انرژی هستی.
- فقط برای دانشجویان جاری یا متقاضی کارآموزی در پژوهشگاه راهنمایی کن.
- در مورد فرآیند انتخاب استاد، فرم‌های آموزشی، مهلت‌ها، و قوانین پژوهشی دانشجویی پاسخگو باش.
- اگر سوال خارج از آیین‌نامه‌های وزارت علوم یا مصوبات پژوهشگاه بود، بگو: «مطابق با بخشنامه مصوب پاسخگو نیستم، به دفتر آموزش مراجعه کن».
- هیچ پیشنهاد غیررسمی نده.

۴. مشاوره پژوهشی اساتید و مدیران (دستیار اعضای هیئت علمی):
- تو مشاور پژوهشی اساتید و مدیران پژوهشگاه مواد و انرژی هستی.
- در مورد نحوه نوشتن پروپوزال، دریافت گرنت، ثبت اختراع، همکاری با صنعت و امتیازات پژوهشی راهنمایی کن.
- پاسخ‌ها مبتنی بر آخرین آیین‌نامه‌های معاونت پژوهشی پژوهشگاه باشد.
- اگر سوال خارج از داده‌ها بود، بگو: «برای راهنمایی دقیق با معاونت پژوهشی تماس بگیرید».
- همیشه به لینک به فرم‌ها یا اسناد مرتبط اشاره کن (در صورتی که بدانستی).

۵. ساعت کاری و راه‌های ارتباطی:
- ساعات کاری پژوهشگاه مواد و انرژی از ۷ صبح تا ۱۳ می باشد.
- سایت اصلی پژوهشگاه: merc.ac.ir

۶. دستیار پشتیبانی عمومی پژوهشگاه:
- تو دستیار پشتیبان عمومی پژوهشگاه مواد و انرژی هستی.
- فقط بر اساس داکیومنت رسمی پژوهشگاه (ساختار سازمانی، قوانین داخلی، ساعت کاری، لینک سامانه‌ها) پاسخ بده.
- برای پرسش‌های روزمره مثل «کتابخانه ساعت چند باز است؟»، «کارت ورود گم شده» یا «درخواست اینترنت» راهکار دقیق با ذکر مرجع بده.
- اگر سوال مربوط به لینک سامانه‌ای بود، آدرس مستقیم بده (مثل سامانه آموزشی، تغذیه یا اداری).
- در غیر این صورت بگو: «در مستندات رسمی پژوهشگاه یافت نشد، به واحد روابط عمومی مراجعه کنید».

۷. راهنمای تحلیل مقالات PDF:
- هنگامی که کاربر یک فایل PDF علمی برای تحلیل ارسال می‌کند، محتوای آن را با جزئیات دقیق، خلاصه، فرضیات، متدولوژی، نتایج کلیدی و نوآوری‌های مواد و انرژی ارزیابی و استخراج کن. فرمت گزارش را پژوهشگرپسند و شکیل ارائه بده.
`;

// Expose API Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, persona } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "آرایه پیام‌ها ارسال نشده است." });
    }

    // Adapt to Gemini SDK text generation schema
    // Compile history correctly
    const formattedContents = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    let customInstructions = SYSTEM_INSTRUCTIONS;
    if (persona && (persona.fullName || persona.interests || persona.role)) {
      customInstructions += `\n\n[مشخصات مخاطب پژوهشگر جهت شخصی‌سازی پاسخ]:
- نام: ${persona.fullName || "پژوهشگر گرامی"}
- نقش علمی: ${persona.role || "نامشخص"}
- بخش تحقیقاتی پژوهشگاه: ${persona.department || "نامشخص"}
- حوزه یا علایق تخصصی سنتز: ${persona.interests || "مواد و انرژی"}

با ارجاع محترمانه به تخصص پژوهشگر و بخش تحقیقاتی وی، پاسخ‌های بخصوص، عمیق و تخصصی‌تر ارائه کن.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: customInstructions,
        temperature: 0.35, // Lower temperature to respect fallbacks and maintain document guidelines
      }
    });

    const replyText = response.text || "متأسفانه پاسخی دریافت نشد.";
    return res.json({ text: replyText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: "خطا در ارتباط با هوش مصنوعی پژوهشگاه: " + error.message });
  }
});

// Expose API PDF analysis endpoint
app.post("/api/analyze-pdf", async (req, res) => {
  try {
    const { pdfBase64, pdfName, prompt } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ error: "فایل پی‌دی‌اف اسکن نشده است" });
    }

    const cleanedBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: cleanedBase64,
            mimeType: "application/pdf"
          }
        },
        {
          text: prompt || `لطفا این فایل مقاله علمی به نام "${pdfName || "مقاله"}" را تحلیل کرده و خلاصه‌ای دقیق به همراه نوآوری‌ها، متدولوژی پژوهش و نتایج آزمایشگاهی آن ارائه نمایید.`
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
      }
    });

    return res.json({ text: response.text || "ناتوانی در تحلیل سند PDF" });
  } catch (error: any) {
    console.error("Gemini PDF Analysis Error:", error);
    return res.status(500).json({ error: "خطا در تحلیل فایل مقاله علمی: " + error.message });
  }
});

// Start listening and mount Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production builds serve static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MERC server running on port ${PORT}`);
  });
}

startServer();
