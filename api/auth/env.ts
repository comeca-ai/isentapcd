/** Variáveis de ambiente do backend de domínio (não modificar api/lib/env.ts). */
import "dotenv/config";
import { randomBytes } from "node:crypto";

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const authEnv = {
  jwtSecret:
    optional("JWT_SECRET") ||
    optional("APP_SECRET") ||
    (process.env.NODE_ENV === "production"
      ? (() => {
          throw new Error("JWT_SECRET é obrigatório em produção");
        })()
      : randomBytes(32).toString("hex")), // dev only: segredo efêmero
  adminEmail: optional("ADMIN_EMAIL"),
  adminPassword: optional("ADMIN_PASSWORD"),
  resendApiKey: optional("RESEND_API_KEY"),
  emailFrom: optional("EMAIL_FROM", "IsentaPCD <noreply@isentapcd.com.br>"),
  isProduction: process.env.NODE_ENV === "production",
};

export const SESSION_COOKIE = "isentapcd_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30; // 30 dias
