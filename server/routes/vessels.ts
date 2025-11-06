import { zValidator } from "@hono/zod-validator";
import { eq, ilike } from "drizzle-orm";
import { stringSimilarity } from "string-similarity-js";
import { z } from "zod";
import { vessels } from "server/drizzle/vessels.ts";
import { vesselsDueToArrive } from "server/drizzle/vessels_due_to_arrive.ts";
import { factory } from "server/factory.ts";
import { db } from "server/lib/db.ts";
import { scoreVessel } from "server/services/score.ts";

export const route = factory
  .createApp()
  // Search vessels by name
  .get(
    "/name/:vesselName",
    zValidator(
      "param",
      z.object({
        vesselName: z.string().min(1),
      }),
    ),
    async (c) => {
      const name = c.req.param("vesselName");

      const results = await db
        .select()
        .from(vessels)
        .where(ilike(vessels.shipName, name)); // Case-insensitive

      return c.json(results);
    },
  )
  // Search vessel by imo number
  .get(
    "/imo/:imo",
    zValidator(
      "param",
      z.object({
        imo: z.string().min(1),
      }),
    ),
    async (c) => {
      const imo = c.req.param("imo");
      const vessel = await db
        .select()
        .from(vessels)
        .where(eq(vessels.ihslRorImoShipNo, imo))
        .limit(1);

      if (vessel.length === 0) {
        return c.json({ error: "Vessel not found" }, 404);
      }

      return c.json(vessel[0]);
    },
  )
  .get("/arriving", async (c) => {
    const vesselInfo = await db
      .select()
      .from(vesselsDueToArrive)
      .leftJoin(vessels, eq(vesselsDueToArrive.imo, vessels.ihslRorImoShipNo));

    const vesselInfoWithScores = vesselInfo.map((vessel) => {
      let score = {
        score: 0,
        tripped_rules: new Array<string>(),
      };
      if (!vessel.vessels) {
        score.score = -1;
        score.tripped_rules.push(
          "This vessel could not be found in the IHS database.",
        );
      } else if (
        stringSimilarity(
          vessel.vessels.shipName ?? "",
          vessel.vessels_due_to_arrive.vesselName ?? "",
        ) < 0.5 &&
        stringSimilarity(
          vessel.vessels.exName ?? "",
          vessel.vessels_due_to_arrive.vesselName ?? "",
        ) < 0.5
      ) {
        score.score = -1;
        score.tripped_rules.push(
          "This IMO number refers to different vessels within the MDH and IHS databases.",
        );
      } else {
        score = scoreVessel(vessel.vessels);
      }

      return {
        vesselDetails: vessel.vessels,
        vesselArrivalDetails: vessel.vessels_due_to_arrive,
        score,
      };
    });

    return c.json(vesselInfoWithScores);
  });
