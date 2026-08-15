-- POC v3: OCR automático (Mistral) nos uploads de documentos.
-- Aplicada manualmente via script tsx (drizzle-kit db:push não converge neste MySQL/TiDB).
ALTER TABLE `documents`
  ADD COLUMN `ocrStatus` enum('none','processing','ok','attention','failed') NOT NULL DEFAULT 'none',
  ADD COLUMN `ocrSummary` text NULL,
  ADD COLUMN `ocrAnalyzedAt` datetime NULL;
