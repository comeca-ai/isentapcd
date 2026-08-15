import { eq } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { documents, profiles, users } from "@db/schema";
import {
  DOC_TYPE_MAP,
  OCR_DOCTYPE_DEFAULT,
  OCR_DOCTYPE_HINTS,
} from "@contracts/constants";
import { authEnv } from "./auth/env";
import { sendEmail, tplDocumentoOcrAttention, tplDocumentoOcrOk } from "./email";

/**
 * Pipeline de OCR (POC v3): todo upload passa pela Mistral OCR API
 * (https://api.mistral.ai/v1/ocr, model "mistral-ocr-latest") e depois por
 * checagens de sanidade por docType (OCR_DOCTYPE_HINTS). NUNCA rejeita —
 * o pior caso é `attention` com achados em português simples.
 */

const MISTRAL_OCR_URL = "https://api.mistral.ai/v1/ocr";
const MISTRAL_OCR_MODEL = "mistral-ocr-latest";
const OCR_TIMEOUT_MS = 90_000;

interface MistralOcrResponse {
  pages?: { markdown?: string }[];
}

/** lowercase + sem acento + espaços colapsados. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function onlyDigits(text: string): string {
  return text.replace(/\D/g, "");
}

function matchesAny(text: string, anyOf: string): boolean {
  return anyOf.split("|").some((alt) => text.includes(alt));
}

/** Checagens de sanidade: keywords do docType + CPF + nome. */
export function sanityCheck(params: {
  docType: string;
  text: string;
  userName: string;
  cpf: string | null;
}): string[] {
  const { docType, userName, cpf } = params;
  const hint = OCR_DOCTYPE_HINTS[docType] ?? OCR_DOCTYPE_DEFAULT;
  const norm = normalize(params.text);
  const achados: string[] = [];

  if (norm.trim().length < 20) {
    achados.push(
      "Não conseguimos ler texto neste arquivo — se for uma foto, tente outra mais nítida, em lugar claro e sem cortar as bordas.",
    );
    return achados;
  }

  for (const check of hint.keywords) {
    if (!matchesAny(norm, check.anyOf)) achados.push(check.msg);
  }

  if (hint.exigeCpf && cpf) {
    const digits = onlyDigits(cpf);
    if (digits.length === 11 && !onlyDigits(params.text).includes(digits)) {
      achados.push(
        "Não encontramos o número do seu CPF no documento — ele precisa estar em seu nome.",
      );
    }
  }

  if (hint.exigeNome) {
    const tokens = normalize(userName)
      .split(" ")
      .filter((t) => t.length >= 3 && !["das", "dos", "da", "de", "do", "e"].includes(t));
    const needed = Math.min(2, tokens.length);
    const found = tokens.filter((t) => norm.includes(t)).length;
    if (tokens.length > 0 && found < needed) {
      achados.push(
        `Não encontramos o seu nome (${userName}) no documento — ele precisa estar em nome da pessoa com deficiência.`,
      );
    }
  }

  return achados;
}

async function callMistralOcr(mimeType: string, dataBase64: string): Promise<string> {
  const dataUrl = `data:${mimeType};base64,${dataBase64}`;
  const document =
    mimeType === "application/pdf"
      ? { type: "document_url", document_url: dataUrl }
      : { type: "image_url", image_url: dataUrl };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);
  try {
    const res = await fetch(MISTRAL_OCR_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authEnv.mistralApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MISTRAL_OCR_MODEL, document }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Mistral OCR HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    const json = (await res.json()) as MistralOcrResponse;
    return (json.pages ?? []).map((p) => p.markdown ?? "").join("\n\n");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Roda o pipeline completo de um documento. Chamada async (fire-and-forget)
 * pelo router de upload; falhas viram ocrStatus="failed" sem travar o fluxo.
 */
export async function runOcr(documentId: number): Promise<void> {
  const db = getDb();
  const doc = await db.query.documents.findFirst({ where: eq(documents.id, documentId) });
  if (!doc) return;

  if (!authEnv.mistralApiKey) {
    console.log(`[ocr:no-op] documento=${documentId} tipo=${doc.docType} (MISTRAL_API_KEY vazia)`);
    await db
      .update(documents)
      .set({ ocrStatus: "none", ocrSummary: null, ocrAnalyzedAt: null })
      .where(eq(documents.id, documentId));
    return;
  }

  await db
    .update(documents)
    .set({ ocrStatus: "processing", ocrSummary: null })
    .where(eq(documents.id, documentId));

  const owner = await db.query.users.findFirst({ where: eq(users.id, doc.userId) });
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, doc.userId) });
  const docLabel = DOC_TYPE_MAP[doc.docType]?.label ?? doc.docType;

  try {
    const text = await callMistralOcr(
      doc.mimeType,
      Buffer.from(doc.data).toString("base64"),
    );
    const achados = sanityCheck({
      docType: doc.docType,
      text,
      userName: owner?.name ?? "",
      cpf: profile?.cpf ?? null,
    });
    const status = achados.length === 0 ? ("ok" as const) : ("attention" as const);
    await db
      .update(documents)
      .set({
        ocrStatus: status,
        ocrSummary: achados.length > 0 ? JSON.stringify(achados) : null,
        ocrAnalyzedAt: new Date(),
      })
      .where(eq(documents.id, documentId));
    console.log(
      `[ocr] documento=${documentId} tipo=${doc.docType} status=${status} achados=${achados.length} chars=${text.length}`,
    );
    if (owner) {
      const tpl =
        status === "ok"
          ? tplDocumentoOcrOk(owner.name, docLabel)
          : tplDocumentoOcrAttention(owner.name, docLabel, achados);
      void sendEmail({ to: owner.email, subject: tpl.subject, html: tpl.html });
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[ocr] documento=${documentId} tipo=${doc.docType} FALHOU: ${reason}`);
    await db
      .update(documents)
      .set({ ocrStatus: "failed", ocrSummary: null, ocrAnalyzedAt: new Date() })
      .where(eq(documents.id, documentId))
      .catch((e) => console.error("[ocr] falha ao registrar erro:", e));
  }
}
