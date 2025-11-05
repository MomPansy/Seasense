import { factory } from "server/factory.ts";
import { db } from "server/lib/db.ts";
import { vessels } from "server/drizzle/vessels.ts";
import { eq, ilike } from "drizzle-orm";

export const route = factory
    .createApp()
    // Search vessels by name
    .get("/name/:vesselName", async (c) => {
        const name = c.req.param("vesselName");

        const results = await db.select()
            .from(vessels)
            .where(ilike(vessels.shipName, name)); // Case-insensitive

        return c.json(results);
    })
    // Search vessel by imo number
    .get("/imo/:imo", async (c) => {
        const imo = c.req.param("imo");
        const vessel = await db.select()
            .from(vessels)
            .where(eq(vessels.ihslRorImoShipNo, imo))
            .limit(1);

        if (vessel.length === 0) {
            return c.json({ error: "Vessel not found" }, 404);
        }

        return c.json(vessel[0]);
    });
