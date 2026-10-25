"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ToastFn = (msg: string) => void;
const ToastContext = createContext<ToastFn>(() => {});

export function useToast(): ToastFn {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);

  const toast = useCallback((m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(null), 2600);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[var(--c-primary)] px-5 py-2.5 text-xs font-extrabold text-[var(--c-on-primary)] shadow-xl md:bottom-6"
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}