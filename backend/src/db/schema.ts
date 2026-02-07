import { pgTable, serial, varchar, integer, real, timestamp } from "drizzle-orm/pg-core";

export const devices = pgTable("devices", {
    id: serial("id").primaryKey(),
    device_raw: varchar("device_raw").notNull(),
    length: integer("length"),
    width: integer("width"),
    height: integer("height"),
    description: varchar("description").notNull(),
    manufacturer: varchar("manufacturer"),
    model: varchar("model"),
    price: integer("price"),
    device_matched: varchar("device_matched"),
    marge: real("marge"),
    created_at: timestamp("created_at").defaultNow(),
});

export type DeviceRow = typeof devices.$inferSelect;