import { pgTable, text, timestamp, primaryKey, uuid } from "drizzle-orm/pg-core";

export const vesselArrivals = pgTable("vessel_arrivals", {
    id: uuid("id").primaryKey(),
    vesselName: text("vessel_name"),
    callsign: text("callsign"),
    imo: text("imo"),
    flag: text("flag"),
    arrivedTime: timestamp("arrived_time", { withTimezone: true }),
    locationFrom: text("location_from"),
    locationTo: text("location_to"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
