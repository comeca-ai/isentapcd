import {
  mysqlTable,
  mysqlEnum,
  uniqueIndex,
  index,
  serial,
  bigint,
  int,
  tinyint,
  boolean,
  varchar,
  char,
  text,
  json,
  date,
  datetime,
  timestamp,
  customType,
} from "drizzle-orm/mysql-core";

/** drizzle 0.45 não expõe longblob em mysql-core — definimos via customType. */
const longblob = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "longblob";
  },
});

// ── users ──────────────────────────────────────────────────────────────────
export const users = mysqlTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    role: mysqlEnum("role", ["user", "admin"]).notNull().default("user"),
    // código/nome de quem indicou (matching com leads.referredBy)
    referredBy: varchar("referredBy", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [index("users_referred_by_idx").on(t.referredBy)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── vehicles (catálogo do simulador) ───────────────────────────────────────
export const vehicles = mysqlTable("vehicles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }).notNull(),
  categoria: varchar("categoria", { length: 60 }).notNull(), // hatch | sedan | suv
  precoCentavos: int("precoCentavos").notNull(),
  combustivel: mysqlEnum("combustivel", ["flex", "gasolina", "diesel", "eletrico", "hibrido"]).notNull(),
  adaptacao: boolean("adaptacao").notNull().default(false),
  imagem: varchar("imagem", { length: 255 }).notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;

// ── leads ──────────────────────────────────────────────────────────────────
export const leads = mysqlTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    whatsapp: varchar("whatsapp", { length: 30 }).notNull(),
    lgpdConsent: boolean("lgpdConsent").notNull(),
    source: mysqlEnum("source", ["simulator", "quiz", "site"]).notNull(),
    uf: char("uf", { length: 2 }),
    quizAnswers: json("quizAnswers"),
    eligibilityResult: json("eligibilityResult"),
    referredBy: varchar("referredBy", { length: 255 }),
    status: mysqlEnum("status", ["new", "contacted", "converted", "lost"]).notNull().default("new"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [index("leads_status_idx").on(t.status), index("leads_uf_idx").on(t.uf)],
);

export type Lead = typeof leads.$inferSelect;

// ── profiles (cadastro multi-etapas) ───────────────────────────────────────
export const profiles = mysqlTable("profiles", {
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .primaryKey()
    .references(() => users.id),
  cpf: varchar("cpf", { length: 11 }),
  telefone: varchar("telefone", { length: 30 }),
  uf: char("uf", { length: 2 }),
  disabilityType: varchar("disabilityType", { length: 40 }),
  isDriver: boolean("isDriver"),
  cnhSpecial: boolean("cnhSpecial"),
  laudoInfo: json("laudoInfo"), // { temLaudo, emissor, dataEmissao, cid, teaNivel }
  endereco: json("endereco"), // { cep, logradouro, numero, complemento, bairro, cidade, uf }
  intendedVehicleId: bigint("intendedVehicleId", { mode: "number", unsigned: true }).references(
    () => vehicles.id,
  ),
  purchaseDate: date("purchaseDate"),
  plateFinalDigit: tinyint("plateFinalDigit"),
  formStep: int("formStep").notNull().default(0),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;

// ── processes ──────────────────────────────────────────────────────────────
export const processes = mysqlTable(
  "processes",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id),
    uf: char("uf", { length: 2 }),
    currentStage: varchar("currentStage", { length: 40 }).notNull().default("descoberta"),
    paidAt: datetime("paidAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [index("processes_user_idx").on(t.userId)],
);

export type Process = typeof processes.$inferSelect;

// ── process_stages ─────────────────────────────────────────────────────────
export const processStages = mysqlTable(
  "process_stages",
  {
    id: serial("id").primaryKey(),
    processId: bigint("processId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => processes.id),
    stageKey: varchar("stageKey", { length: 40 }).notNull(),
    status: mysqlEnum("status", [
      "pending",
      "in_progress",
      "waiting_org",
      "waiting_user",
      "done",
      "blocked",
    ])
      .notNull()
      .default("pending"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("process_stages_process_stage_uniq").on(t.processId, t.stageKey)],
);

export type ProcessStage = typeof processStages.$inferSelect;

// ── documents (bytes em LONGBLOB) ──────────────────────────────────────────
export const documents = mysqlTable(
  "documents",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id),
    docType: varchar("docType", { length: 60 }).notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 100 }).notNull(),
    sizeBytes: int("sizeBytes").notNull(),
    data: longblob("data").notNull(),
    status: mysqlEnum("status", ["pending", "in_review", "approved", "rejected"])
      .notNull()
      .default("pending"),
    rejectionReason: text("rejectionReason"),
    version: int("version").notNull().default(1),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("documents_user_doctype_uniq").on(t.userId, t.docType)],
);

export type Document = typeof documents.$inferSelect;

// ── events (timeline do usuário / auditoria) ───────────────────────────────
export const events = mysqlTable(
  "events",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id),
    kind: varchar("kind", { length: 60 }).notNull(),
    payload: json("payload"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [index("events_user_idx").on(t.userId)],
);

export type AppEvent = typeof events.$inferSelect;

// ── email_reminders (dedup de lembretes) ───────────────────────────────────
export const emailReminders = mysqlTable(
  "email_reminders",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id),
    kind: varchar("kind", { length: 60 }).notNull(),
    refKey: varchar("refKey", { length: 120 }).notNull(),
    sentAt: timestamp("sentAt").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("email_reminders_uniq").on(t.userId, t.kind, t.refKey)],
);
