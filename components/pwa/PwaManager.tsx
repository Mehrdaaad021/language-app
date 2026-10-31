"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaManager() {
  const locale = useLocale();
  const fa = locale === "fa";
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);

  /* ثبت Service Worker — فقط در production */
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(console.error);
  }, []);

  /* گرفتن رویداد نصب */
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallEvt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  /* اگه داخل اپ نصب‌شده باشیم، دکمه لازم نیست */
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  if (!installEvt || standalone) return null;

  const install = async () => {
    await installEvt.prompt();
    setInstallEvt(null);
  };

  return (
    <button
      type="button"
      onClick={install}
      className="glass-strong fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-extrabold text-[var(--c-primary)] shadow-xl transition hover:scale-105"
    >
      <Download size={14} />
      {fa ? "نصب اپ روی دستگاه" : "Install app"}
    </button>
  );
}