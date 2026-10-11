import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  integer,
  vector,
} from "drizzle-orm/pg-core";

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),

  ownerId: varchar("owner_id", { length: 255 }).notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});



export const chatbots = pgTable("chatbots", {
  id: uuid("id").defaultRandom().primaryKey(),

  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" })
    .unique(),

  name: varchar("name", { length: 100 })
    .notNull()
    .default("Support Assistant"),

  systemPrompt: text("system_prompt")
    .notNull()
    .default("You are a helpful customer support assistant. Answer using the business knowledge provided."),

  primaryColor: varchar("primary_color", { length: 7 })
    .notNull()
    .default("#2563eb"),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});



export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),

  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),

  filename: varchar("filename", { length: 255 }).notNull(),

  storagePath: varchar("storage_path", { length: 500 })
    .notNull(),

  sizeBytes: integer("size_bytes").notNull(),

  status: varchar("status", { length: 20 })
    .notNull()
    .default("pending"),

  embedding: vector("embedding", { dimensions: 1024 }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});



export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),

  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),

  content: text("content").notNull(),

  chunkIndex: integer("chunk_index").notNull(),

  embedding: vector("embedding", { dimensions: 1024 }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
