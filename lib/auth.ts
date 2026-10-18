import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "./session";

export type Session = SessionPayload;

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireTeacherAction(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== "TEACHER") throw new Error("FORBIDDEN");
  return s;
}