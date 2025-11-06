import { eq } from "drizzle-orm";
import { vessels } from "server/drizzle/vessels";
import { factory } from "server/factory.ts";
import { db } from "server/lib/db";
import { scoreVessel } from "server/services/score";

export const scoreRoute = factory
    .createApp()
    .get(
        "/:vesselimo",
        async (c) => {
            const vessel_info = (await db.select().from(vessels).where(eq(vessels.ihslRorImoShipNo, c.req.param('vesselimo'))))[0]
            const score_info = scoreVessel(vessel_info)
            return c.json(score_info)
        },
    )