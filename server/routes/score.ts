import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { vessels } from "server/drizzle/vessels.ts";
import { factory } from "server/factory.ts";
import { db } from "server/lib/db.ts";
import { scoreVessel } from "server/services/score.ts";

export const scoreRoute = factory.createApp().get(
  "/:vesselimo",
  zValidator(
    "param",
    z.object({
      vesselimo: z.string().min(1),
    }),
  ),
  async (c) => {
    const vesselimo = c.req.param("vesselimo");
    const vessel_info = (
      await db
        .select()
        .from(vessels)
        .where(eq(vessels.ihslRorImoShipNo, vesselimo))
    )[0];
    const score_info = scoreVessel(vessel_info);
    return c.json(score_info);
  },
);
