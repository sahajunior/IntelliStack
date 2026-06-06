import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const metrics = pgTable(
  "metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: text("org_id").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    mrr: integer("mrr").notNull().default(0),
    newUsers: integer("new_users").notNull().default(0),
    activeSessions: integer("active_sessions").notNull().default(0),
    churnRate: real("churn_rate").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("metrics_org_date_unique").on(table.orgId, table.date),
    index("metrics_org_date_idx").on(table.orgId, table.date),
  ],
);

export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: text("org_id").notNull(),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("activity_events_org_created_idx").on(
      table.orgId,
      table.createdAt,
    ),
  ],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: text("org_id").notNull(),
    userId: text("user_id").notNull(),
    turnId: text("turn_id"),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("chat_messages_org_user_created_idx").on(
      table.orgId,
      table.userId,
      table.createdAt,
    ),
    uniqueIndex("chat_messages_org_user_turn_role_unique").on(
      table.orgId,
      table.userId,
      table.turnId,
      table.role,
    ),
  ],
);

export const orgSettings = pgTable("org_settings", {
  orgId: text("org_id").primaryKey(),
  displayName: text("display_name"),
  logoUrl: text("logo_url"),
  notificationsEnabled: boolean("notifications_enabled")
    .notNull()
    .default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
