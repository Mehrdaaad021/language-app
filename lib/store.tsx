"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Note, Payment, Session, Student } from "./types";
import { fetchAll } from "./server/actions";

type AppData = {
  students: Student[];
  sessions: Session[];
  payments: Payment[];
  notes: Note[];
};

type AppDataContextType = {
  data: AppData;
  refresh: () => Promise<void>;
  loading: boolean;
};

const AppDataContext = createContext<AppDataContextType | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({
    students: [],
    sessions: [],
    payments: [],
    notes: [],
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const all = await fetchAll();
      setData({
        students: all.students as Student[],
        sessions: all.sessions as Session[],
        payments: all.payments as Payment[],
        notes: all.notes as Note[],
      });
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AppDataContext.Provider value={{ data, refresh: load, loading }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}