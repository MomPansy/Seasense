import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const vesselDepartures = pgTable("vessel_departures", {
  id: uuid("id").primaryKey().defaultRandom(),
  vesselName: text("vessel_name"),
  callsign: text("callsign"),
  imo: text("imo"),
  flag: text("flag"),
  departedTime: timestamp("departed_time", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
