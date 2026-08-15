import { SESSION_COOKIE, SESSION_MAX_AGE_S, authEnv } from "./env";

function serializeCookie(
  name: string,
  value: string,
  opts: { maxAge: number; httpOnly?: boolean },
): string {
  const parts = [
    `${name}=${value === "" ? "" : encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${opts.maxAge}`,
    "SameSite=Lax",
  ];
  if (opts.httpOnly) parts.push("HttpOnly");
  if (authEnv.isProduction) parts.push("Secure");
  return parts.join("; ");
}

/** Lê um cookie do header Cookie da request. */
export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

/** Seta o cookie de sessão (httpOnly, lax, 30 dias) via resHeaders do contexto tRPC. */
export function setSessionCookie(resHeaders: Headers, token: string): void {
  resHeaders.append(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE, token, { maxAge: SESSION_MAX_AGE_S, httpOnly: true }),
  );
}

export function clearSessionCookie(resHeaders: Headers): void {
  resHeaders.append(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE, "", { maxAge: 0, httpOnly: true }),
  );
}
