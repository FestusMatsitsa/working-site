import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { assetsTable } from "./assets";

export const maintenanceTable = pgTable("maintenance_schedules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  assetCategory: text("asset_category").notNull(),
  assetId: integer("asset_id").references(() => assetsTable.id),
  frequency: text("frequency").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  completedDate: text("completed_date"),
  status: text("status").notNull().default("scheduled"),
  assignedTo: integer("assigned_to").references(() => usersTable.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertMaintenanceSchema = createInsertSchema(maintenanceTable).omit({ id: true, createdAt: true });
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;
export type Maintenance = typeof maintenanceTable.$inferSelect;
