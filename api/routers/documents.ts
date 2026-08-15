import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { documents } from "@db/schema";
import {
  DOC_ACCEPTED_MIME,
  DOC_CHECKLIST,
  DOC_MAX_BYTES,
  DOC_TYPE_MAP,
  TAX_DOCTYPES,
} from "@contracts/constants";
import { recordEvent, recordPaywallTrigger } from "./helpers";
import { runOcr } from "../ocr";
import { sendEmail, tplDocumentoRecebido } from "../email";

const uploadSchema = z.object({
  docType: z.string().refine((v) => v in DOC_TYPE_MAP, "Tipo de documento desconhecido."),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(DOC_ACCEPTED_MIME),
  dataBase64: z.string().min(1),
});

function meta(d: typeof documents.$inferSelect) {
  return {
    id: d.id,
    docType: d.docType,
    fileName: d.fileName,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
    status: d.status,
    rejectionReason: d.rejectionReason,
    ocrStatus: d.ocrStatus,
    ocrSummary: d.ocrSummary,
    ocrAnalyzedAt: d.ocrAnalyzedAt,
    version: d.version,
    createdAt: d.createdAt,
  };
}

export const documentsRouter = createRouter({
  /** Checklist gerado de DOC_CHECKLIST + status por docType do usuário. */
  checklist: authedQuery.query(async ({ ctx }) => {
    const rows = await getDb()
      .select()
      .from(documents)
      .where(eq(documents.userId, ctx.user.id));
    const byType = new Map(rows.map((d) => [d.docType, d]));
    return DOC_CHECKLIST.map((group) => ({
      key: group.key,
      title: group.title,
      org: group.org,
      docs: group.docs.map((def) => ({
        ...def,
        upload: byType.has(def.docType) ? meta(byType.get(def.docType)!) : null,
      })),
    }));
  }),

  list: authedQuery.query(async ({ ctx }) => {
    const rows = await getDb()
      .select()
      .from(documents)
      .where(eq(documents.userId, ctx.user.id))
      .orderBy(desc(documents.createdAt));
    return rows.map(meta);
  }),

  /**
   * Upload (base64; máx 5MB; PDF/JPG/PNG). Reenvio do mesmo docType substitui o
   * arquivo e incrementa `version` (histórico de versões na coluna version).
   */
  upload: authedQuery.input(uploadSchema).mutation(async ({ ctx, input }) => {
    const buffer = Buffer.from(input.dataBase64, "base64");
    if (buffer.length === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo vazio." });
    }
    if (buffer.length > DOC_MAX_BYTES) {
      throw new TRPCError({
        code: "PAYLOAD_TOO_LARGE",
        message: "Arquivo maior que 5 MB — envie PDF ou foto (JPG/PNG) menor.",
      });
    }
    const db = getDb();
    const existing = await db.query.documents.findFirst({
      where: and(eq(documents.userId, ctx.user.id), eq(documents.docType, input.docType)),
    });
    let version = 1;
    let documentId: number;
    if (existing) {
      version = existing.version + 1;
      documentId = existing.id;
      await db
        .update(documents)
        .set({
          fileName: input.fileName,
          mimeType: input.mimeType,
          sizeBytes: buffer.length,
          data: buffer,
          status: "pending",
          rejectionReason: null,
          ocrStatus: "processing",
          ocrSummary: null,
          ocrAnalyzedAt: null,
          version,
          createdAt: new Date(),
        })
        .where(eq(documents.id, existing.id));
    } else {
      const [{ id }] = await db
        .insert(documents)
        .values({
          userId: ctx.user.id,
          docType: input.docType,
          fileName: input.fileName,
          mimeType: input.mimeType,
          sizeBytes: buffer.length,
          data: buffer,
          ocrStatus: "processing",
        })
        .$returningId();
      documentId = id;
    }
    await recordEvent(ctx.user.id, "document_uploaded", { docType: input.docType, version });
    // OCR automático (Mistral) — async, não bloqueia a resposta do upload
    void runOcr(documentId).catch((err) => console.error("[ocr] pipeline falhou:", err));
    // Aviso de recebimento (no-op sem RESEND_API_KEY)
    const docLabel = DOC_TYPE_MAP[input.docType]?.label ?? input.docType;
    const tpl = tplDocumentoRecebido(ctx.user.name, docLabel);
    void sendEmail({ to: ctx.user.email, subject: tpl.subject, html: tpl.html });
    // 1º comprovante de guia paga → gatilho do paywall
    if ((TAX_DOCTYPES as readonly string[]).includes(input.docType)) {
      await recordPaywallTrigger(ctx.user.id);
    }
    return { ok: true, version, status: "pending" as const };
  }),

  /**
   * Reprocessa o OCR de um documento (dono ou admin). Útil quando a análise
   * falhou (ocrStatus="failed") ou o arquivo foi lido parcialmente.
   */
  reprocessOcr: authedQuery
    .input(z.object({ documentId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await getDb().query.documents.findFirst({
        where: eq(documents.id, input.documentId),
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Documento não encontrado." });
      if (doc.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Este documento não é seu." });
      }
      await getDb()
        .update(documents)
        .set({ ocrStatus: "processing", ocrSummary: null })
        .where(eq(documents.id, doc.id));
      void runOcr(doc.id).catch((err) => console.error("[ocr] reprocess falhou:", err));
      return { ok: true };
    }),

  /** Serve o blob autenticado — só o dono ou admin. */
  download: authedQuery
    .input(z.object({ documentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const doc = await getDb().query.documents.findFirst({
        where: eq(documents.id, input.documentId),
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Documento não encontrado." });
      if (doc.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Este documento não é seu." });
      }
      return {
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        dataBase64: Buffer.from(doc.data).toString("base64"),
      };
    }),

  /** Exclusão pelo dono (LGPD — direito de eliminação). */
  remove: authedQuery
    .input(z.object({ documentId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const doc = await db.query.documents.findFirst({ where: eq(documents.id, input.documentId) });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Documento não encontrado." });
      if (doc.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Este documento não é seu." });
      }
      await db.delete(documents).where(eq(documents.id, doc.id));
      await recordEvent(ctx.user.id, "document_removed", { docType: doc.docType });
      return { ok: true };
    }),
});
