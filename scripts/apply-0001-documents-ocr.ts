/**
 * Aplica a migração 0001 (colunas OCR em `documents`) de forma idempotente.
 * Uso: npx tsx scripts/apply-0001-documents-ocr.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL ausente");

const conn = await mysql.createConnection(url);

const [cols] = await conn.query(
  `SELECT COLUMN_NAME FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents'
     AND COLUMN_NAME IN ('ocrStatus','ocrSummary','ocrAnalyzedAt')`,
);
const existing = new Set((cols as { COLUMN_NAME: string }[]).map((c) => c.COLUMN_NAME));

const alters: string[] = [];
if (!existing.has("ocrStatus")) {
  alters.push(
    "ADD COLUMN `ocrStatus` enum('none','processing','ok','attention','failed') NOT NULL DEFAULT 'none'",
  );
}
if (!existing.has("ocrSummary")) alters.push("ADD COLUMN `ocrSummary` text NULL");
if (!existing.has("ocrAnalyzedAt")) alters.push("ADD COLUMN `ocrAnalyzedAt` datetime NULL");

if (alters.length === 0) {
  console.log("[migrate 0001] colunas OCR já existem — nada a fazer.");
} else {
  await conn.query(`ALTER TABLE \`documents\` ${alters.join(", ")}`);
  console.log(`[migrate 0001] aplicada: ${alters.join(" | ")}`);
}

// Marca como aplicada no journal do drizzle (se a tabela de controle existir).
const [tables] = await conn.query(
  `SELECT TABLE_NAME FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '__drizzle_migrations'`,
);
if ((tables as unknown[]).length > 0) {
  const [rows] = await conn.query(
    `SELECT id FROM \`__drizzle_migrations\` WHERE hash = '0001_documents_ocr'`,
  );
  if ((rows as unknown[]).length === 0) {
    await conn.query(
      `INSERT INTO \`__drizzle_migrations\` (hash, created_at) VALUES ('0001_documents_ocr', ?)`,
      [Date.now()],
    );
    console.log("[migrate 0001] registrada em __drizzle_migrations.");
  }
}

await conn.end();
process.exit(0);
