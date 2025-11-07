import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { vesselArrivals } from "./server/drizzle/vessel_arrivals.ts";
import { vesselDepartures } from "./server/drizzle/vessel_departures.ts";
import { vessels } from "./server/drizzle/vessels.ts";
import { vesselsDueToArrive } from "./server/drizzle/vessels_due_to_arrive.ts";

// Vessels
export type Vessel = InferSelectModel<typeof vessels>;
export type NewVessel = InferInsertModel<typeof vessels>;

// Vessel Arrivals
export type VesselArrival = InferSelectModel<typeof vesselArrivals>;
export type NewVesselArrival = InferInsertModel<typeof vesselArrivals>;

// Vessel Departures
export type VesselDeparture = InferSelectModel<typeof vesselDepartures>;
export type NewVesselDeparture = InferInsertModel<typeof vesselDepartures>;

// Vessels Due to Arrive
export type VesselDueToArrive = InferSelectModel<typeof vesselsDueToArrive>;
export type NewVesselDueToArrive = InferInsertModel<typeof vesselsDueToArrive>;
