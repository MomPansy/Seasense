import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const vesselsDueToArrive = pgTable("vessels_due_to_arrive", {
  id: integer().primaryKey().notNull(),
  vesselName: text("vessel_name"),
  callsign: text(),
  imo: text(),
  flag: text(),
  dueToArriveTime: timestamp("due_to_arrive_time", {
    withTimezone: true,
    mode: "string",
  }),
  locationFrom: text("location_from"),
  locationTo: text("location_to"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: "string" }),
});
