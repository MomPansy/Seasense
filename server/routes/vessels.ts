import { zValidator } from "@hono/zod-validator";
import { addHours, format } from "date-fns";
import { and, eq, gte, ilike, lte } from "drizzle-orm";
import { stringSimilarity } from "string-similarity-js";
import { z } from "zod";
import { arrivalRuleset } from "server/constants/rules.ts";
import { vessels } from "server/drizzle/vessels.ts";
import { vesselsDueToArrive } from "server/drizzle/vessels_due_to_arrive.ts";
import { factory } from "server/factory.ts";
import { db } from "server/lib/db.ts";
import { scoreVessel, checkedRule } from "server/services/score.ts";

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
    const hoursToPull = 72; // to change if necessary
    const currDate = new Date();
    const vesselInfo = await db
      .select()
      .from(vesselsDueToArrive)
      .leftJoin(vessels, eq(vesselsDueToArrive.imo, vessels.ihslRorImoShipNo))
      .where(
        and(
          lte(
            vesselsDueToArrive.dueToArriveTime,
            format(addHours(currDate, hoursToPull), "yyyy-MM-dd HH:mm:ss"),
          ),
          gte(
            vesselsDueToArrive.dueToArriveTime,
            format(currDate, "yyyy-MM-dd HH:mm:ss"),
          ),
        ),
      );

    const vesselInfoWithScores = vesselInfo.map((vessel) => {
      let score = {
        score: 100,
        level: -1,
        checkedRules: new Array<checkedRule>(),
        manualRules: arrivalRuleset.rules.concat(arrivalRuleset.manualRules),
      };
      if (!vessel.vessels) {
        score.checkedRules.push({
          name: "Invalid IMO",
          weight: 100,
          description:
            "This vessel either did not provide an IMO number or provided an invalid one.",
          tripped: true,
        });
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
        score.checkedRules.push({
          name: "Incorrect IMO",
          weight: 100,
          description:
            "This IMO number refers to different vessels within the MDH and IHS databases.",
          tripped: true,
        });
      } else {
        score = scoreVessel(vessel.vessels, arrivalRuleset);
      }

      return {
        vesselDetails: vessel.vessels,
        vesselArrivalDetails: vessel.vessels_due_to_arrive,
        score,
      };
    });

    return c.json(vesselInfoWithScores);
  });
