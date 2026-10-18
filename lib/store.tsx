"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/Toast";
import type { Note, Payment, Session, Student } from "./types";
import { createNote, createPayment, createSession, createStudent, fetchAll } from "./server/actions";

interface AppData {
  students: Student[];
  sessions: Session[];
  payments: Payment[];
  notes: Note[];
  loading: boolean;
  addStudent: (s: Omit<Student, "id">) => void;
  addSession: (s: Omit<Session, "id">) => void;
  addPayment: (p: Omit<Payment, "id">) => void;
  addNote: (n: Omit<Note, "id">) => void;
}

const Ctx = createContext<AppData | null>(null);

export function useAppData(): AppData {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppData must be used inside AppDataProvider");
  return v;
}

const tempId = () => `temp-${crypto.randomUUID()}`;
const today = () => new Date().toISOString().slice(0, 10);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const t = useTranslations("Forms");

  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchAll()
      .then((d) => {
        if (!alive) return;
        setStudents(d.students);
        setSessions(d.sessions);
        setPayments(d.payments);
        setNotes(d.notes);
        setLoading(false);
      })
      .catch(() => {
        if (alive) toast(t("saveError"));
      });
    return () => {
      alive = false;
    };
  }, [toast, t]);

  const value = useMemo<AppData>(
    () => ({
      students, sessions, payments, notes, loading,

      addStudent: (s) => {
        const temp: Student = { ...s, id: tempId() };
        setStudents((p) => [temp, ...p]);
        createStudent(s)
          .then((real) => setStudents((p) => p.map((x) => (x.id === temp.id ? real : x))))
          .catch(() => {
            setStudents((p) => p.filter((x) => x.id !== temp.id));
            toast(t("saveError"));
          });
      },

      addSession: (s) => {
        const temp: Session = { ...s, id: tempId() };
        setSessions((p) => [temp, ...p]);
        createSession(s)
          .then((real) => setSessions((p) => p.map((x) => (x.id === temp.id ? real : x))))
          .catch(() => {
            setSessions((p) => p.filter((x) => x.id !== temp.id));
            toast(t("saveError"));
          });
      },

      addPayment: (p) => {
        const temp: Payment = { ...p, id: tempId() };
        setPayments((prev) => [temp, ...prev]);
        createPayment(p)
          .then((real) => setPayments((prev) => prev.map((x) => (x.id === temp.id ? real : x))))
          .catch(() => {
            setPayments((prev) => prev.filter((x) => x.id !== temp.id));
            toast(t("saveError"));
          });
      },

      addNote: (n) => {
        const temp: Note = { ...n, id: tempId() };
        setNotes((p) => [temp, ...p]);
        createNote(n)
          .then((real) => setNotes((p) => p.map((x) => (x.id === temp.id ? real : x))))
          .catch(() => {
            setNotes((p) => p.filter((x) => x.id !== temp.id));
            toast(t("saveError"));
          });
      },
    }),
    [students, sessions, payments, notes, loading, toast, t]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}