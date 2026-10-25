import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "lca_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // ۳۰ روز

export type SessionPayload = {
  sub: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  name: string | null;
  email: string;
  pending2fa?: boolean;
  mustChangePassword?: boolean;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set in .env");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    role: payload.role,
    name: payload.name,
    email: payload.email,
    pending2fa: payload.pending2fa ?? false,
    mustChangePassword: payload.mustChangePassword ?? false,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      sub: payload.sub as string,
      role: payload.role as "ADMIN" | "TEACHER" | "STUDENT",
      name: (payload.name as string | null) ?? null,
      email: payload.email as string,
      pending2fa: (payload.pending2fa as boolean | undefined) ?? false,
      mustChangePassword: (payload.mustChangePassword as boolean | undefined) ?? false,
    };
  } catch {
    return null;
  }
}