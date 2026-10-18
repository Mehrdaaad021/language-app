"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ChevronLeft, NotebookPen, Paperclip, FileText } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import type { Note } from "@/lib/mock-data";
import { formatDate, formatNumber } from "@/lib/format";

export default function Notebook({ notes, onNew }: { notes: Note[]; onNew?: () => void }) {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);

  const max = Math.max(notes.length - 1, 0);
  const safe = Math.min(index, max);
  const current = notes[safe];

  const go = (d: number) => {
    if (safe + d < 0 || safe + d > max) return;
    setDir(d);
    setIndex(safe + d);
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">{t("notebook")}</h2>
          <p className="text-xs text-[var(--color-ink-soft)]">{t("notebookSubtitle")}</p>
        </div>
        {onNew && <Button icon={<NotebookPen size={16} />} onClick={onNew}>{t("newNote")}</Button>}
      </div>

      <div className="[perspective:1600px]">
        <div className="flex">
          {/* شیرازه */}
          <div className="z-10 flex w-9 shrink-0 flex-col items-center justify-between py-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="notebook-ring h-3.5 w-3.5 rounded-full border-[3px]" />
            ))}
          </div>

          {/* صفحه */}
          <div className="notebook-paper relative min-h-[440px] flex-1 overflow-hidden rounded-e-[24px] rounded-s-[6px] shadow-[0_28px_70px_-28px_rgba(58,42,46,0.4)]">
            <span className="notebook-margin pointer-events-none absolute inset-y-0 start-12 w-px" />
            <div className="notebook-rules pointer-events-none absolute inset-0" />

            <AnimatePresence mode="wait" initial={false}>
              {current ? (
                <motion.article
                  key={current.id}
                  initial={{ opacity: 0, rotateY: dir === 1 ? -60 : 60, x: dir === 1 ? -30 : 30 }}
                  animate={{ opacity: 1, rotateY: 0, x: 0 }}
                  exit={{ opacity: 0, rotateY: dir === 1 ? 60 : -60, x: dir === 1 ? 30 : -30 }}
                  transition={{ type: "spring", stiffness: 240, damping: 28 }}
                  style={{ transformOrigin: "center top" }}
                  className="relative p-7 ps-16"
                >
                  <p className="text-[11px] font-bold text-[var(--color-note-accent)]">
                    {formatDate(current.date, locale, { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <h3 className="mt-2 text-xl font-extrabold text-[var(--color-ink)]">{current.title}</h3>
                  <p className="mt-5 whitespace-pre-line text-sm leading-8 text-[var(--color-note-body)]">{current.content}</p>

                  {current.attachments.length > 0 && (
                    <div className="mt-6">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[var(--color-ink-soft)]">
                        <Paperclip size={13} />
                        {t("attachments")}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {current.attachments.map((a) =>
                          a.kind === "image" ? (
                            <img
                              key={a.id}
                              src={a.url}
                              alt={a.name}
                              className="h-24 w-24 rounded-xl object-cover shadow-md ring-1 ring-[#C9A06A]/40"
                            />
                          ) : (
                            <span key={a.id} className="notebook-chip inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold">
                              <FileText size={14} />
                              {a.name}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </motion.article>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex min-h-[440px] flex-col items-center justify-center gap-3 p-10 text-center"
                >
                  <span className="notebook-chip flex h-14 w-14 items-center justify-center rounded-2xl">
                    <NotebookPen size={24} />
                  </span>
                  <p className="font-extrabold text-[var(--color-ink)]">{t("emptyNotebook")}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{t("emptyNotebookHint")}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* کنترل ورق‌زدن */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => go(-1)}
            disabled={safe === 0}
            aria-label="previous page"
            className="glass flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-ink)] transition hover:bg-white/40 disabled:opacity-40"
          >
            <ChevronRight size={18} className="icon-flip" />
          </button>
          <p className="text-xs font-bold text-[var(--color-ink-soft)]">
            {t("page")} {formatNumber(safe + 1, locale)} {t("of")} {formatNumber(notes.length, locale)}
          </p>
          <button
            onClick={() => go(1)}
            disabled={safe === max}
            aria-label="next page"
            className="glass flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-ink)] transition hover:bg-white/40 disabled:opacity-40"
          >
            <ChevronLeft size={18} className="icon-flip" />
          </button>
        </div>
      </div>
    </section>
  );
}