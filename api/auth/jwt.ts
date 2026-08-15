import jwt from "jsonwebtoken";
import { authEnv, SESSION_MAX_AGE_S } from "./env";

export interface SessionPayload {
  sub: number; // user id
  email: string;
  role: "user" | "admin";
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, authEnv.jwtSecret, { expiresIn: SESSION_MAX_AGE_S });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, authEnv.jwtSecret);
    if (typeof decoded !== "object" || decoded === null) return null;
    const { sub, email, role } = decoded as Record<string, unknown>;
    if (typeof sub !== "number" || typeof email !== "string") return null;
    if (role !== "user" && role !== "admin") return null;
    return { sub, email, role };
  } catch {
    return null;
  }
}
