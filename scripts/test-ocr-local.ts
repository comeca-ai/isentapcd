/** Validação local do pipeline OCR sem egress de rede: mock do fetch da Mistral. */
import "dotenv/config";
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL!);
const [rows] = await conn.query(
  "SELECT id, docType, status, ocrStatus, ocrSummary, ocrAnalyzedAt FROM documents ORDER BY id DESC LIMIT 2",
);
console.log("[db] documents:", JSON.stringify(rows, null, 2));

// sanityCheck — casos de teste
const { sanityCheck } = await import("../api/ocr");
const okText =
  "LAUDO MÉDICO — Paciente: Maria da Silva, CPF 123.456.789-09. Diagnóstico: deficiência física (CID G80.1). Dr. João, CRM 123456.";
console.log(
  "[sanity] laudo completo →",
  sanityCheck({ docType: "laudo_medico", text: okText, userName: "Maria da Silva", cpf: "12345678909" }),
);
console.log(
  "[sanity] laudo sem CID →",
  sanityCheck({
    docType: "laudo_medico",
    text: "Laudo medico de Maria da Silva, CPF 12345678909, com deficiencia. Dr Joao CRM 1.",
    userName: "Maria da Silva",
    cpf: "12345678909",
  }),
);
console.log(
  "[sanity] guia ok →",
  sanityCheck({
    docType: "guia_pericia",
    text: "Comprovante de pagamento. Valor R$ 268,94. Vencimento 10/09/2026. Beneficiario IMESC.",
    userName: "Maria da Silva",
    cpf: null,
  }),
);

// Pipeline completo com fetch mockado (simula resposta da Mistral)
const realFetch = globalThis.fetch;
(globalThis as Record<string, unknown>).fetch = async () =>
  new Response(JSON.stringify({ pages: [{ markdown: okText }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
const { runOcr } = await import("../api/ocr");
await runOcr(Number((rows as { id: number }[])[0].id));
(globalThis as Record<string, unknown>).fetch = realFetch;

const [after] = await conn.query(
  "SELECT id, ocrStatus, ocrSummary, ocrAnalyzedAt FROM documents ORDER BY id DESC LIMIT 1",
);
console.log("[db] após runOcr mockado:", JSON.stringify(after, null, 2));
await conn.end();
process.exit(0);
