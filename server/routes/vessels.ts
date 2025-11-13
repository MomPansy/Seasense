import { zValidator } from "@hono/zod-validator";
import { addHours, format, subHours } from "date-fns";
import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { stringSimilarity } from "string-similarity-js";
import { z } from "zod";
import { arrivalRuleset } from "server/constants/rules.ts";
import { vesselArrivals } from "server/drizzle/vessel_arrivals.ts";
import { vessels } from "server/drizzle/vessels.ts";
import { vesselsDueToArrive } from "server/drizzle/vessels_due_to_arrive.ts";
import { factory } from "server/factory.ts";
import { db } from "server/lib/db.ts";
import { requireAuth } from "server/middlewares/clerk.ts";
import { scoreVessel, checkedRule } from "server/services/score.ts";

export const route = factory
  .createApp()
  // Apply requireAuth to all routes in this file
  .use("/*", requireAuth)
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

      const vesselDetails = vessel[0];
      const score = scoreVessel(vesselDetails, arrivalRuleset);

      return c.json({
        vesselDetails,
        score,
      });
    },
  )
  .post(
    "/vesselDetails",
    zValidator(
      "json",
      z.object({
        imo: z.string().min(1),
      }),
    ),
    async (c) => {
      const validated = c.req.valid("json");
      const imo = validated.imo;
      const vessel = await db
        .select()
        .from(vessels)
        .where(eq(vessels.ihslRorImoShipNo, imo))
        .limit(1);

      if (vessel.length === 0) {
        throw new HTTPException(404, { message: "Ship not found." });
      }

      const vesselDetails = vessel[0];
      const score = scoreVessel(vesselDetails, arrivalRuleset);

      return c.json({
        vesselDetails,
        score,
      });
    },
  )
  .post(
    "/search",
    zValidator(
      "json",
      z.object({
        query: z.string().min(1),
      }),
    ),
    async (c) => {
      const hoursToPull = 72; // to change if necessary
      const currDate = new Date();
      const validated = c.req.valid("json");
      const query = validated.query;
      const results = await db
        .selectDistinctOn([vesselArrivals.imo])
        .from(vesselArrivals)
        .where(
          and(
            gte(vesselArrivals.arrivedTime, subHours(currDate, hoursToPull)),
            or(
              ilike(vesselArrivals.imo, `%${query}%`),
              ilike(vesselArrivals.vesselName, `%${query}%`),
              ilike(vesselArrivals.callsign, `%${query}%`),
            ),
          ),
        )
        .leftJoin(vessels, eq(vesselArrivals.imo, vessels.ihslRorImoShipNo))
        .orderBy(vesselArrivals.imo, desc(vesselArrivals.arrivedTime));

      return c.json(results);
    },
  )
  .post(
    "/arriving",
    zValidator(
      "json",
      z.object({
        imo: z.string().min(1).optional(),
      }),
    ),
    async (c) => {
      const validated = c.req.valid("json");
      const reqImo = validated.imo;
      const hoursToPull = 72; // to change if necessary
      const currDate = new Date();
      const vesselInfo = await db
        .selectDistinctOn([vesselsDueToArrive.imo])
        .from(vesselsDueToArrive)
        .orderBy(vesselsDueToArrive.imo, desc(vesselsDueToArrive.fetchedAt))
        .leftJoin(vessels, eq(vesselsDueToArrive.imo, vessels.ihslRorImoShipNo))
        .where(
          and(
            lte(
              vesselsDueToArrive.dueToArriveTime,
              format(addHours(currDate, hoursToPull), "yyyy-MM-dd HH:mm:ssX"),
            ),
            gte(
              vesselsDueToArrive.dueToArriveTime,
              format(currDate, "yyyy-MM-dd HH:mm:ssX"),
            ),
          ),
        );

      let vesselInfoToEvaluate = vesselInfo;
      if (reqImo) {
        vesselInfoToEvaluate = vesselInfoToEvaluate.filter((vesselDetails) => {
          return vesselDetails.vessels_due_to_arrive.imo === reqImo;
        });
      }

      const vesselInfoWithScores = vesselInfoToEvaluate.map((vessel) => {
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
          vesselDetails:
            vessel.vessels && score.score < 100
              ? {
                  ihslRorImoShipNo: vessel.vessels.ihslRorImoShipNo,
                  shipName: vessel.vessels.shipName,
                  exName: vessel.vessels.exName,
                  shipStatus: vessel.vessels.shipStatus,
                  callSign: vessel.vessels.callSign,
                  flagCode: vessel.vessels.flagCode,
                  flagName: vessel.vessels.flagName,
                  maritimeMobileServiceIdentityMmsiNumber:
                    vessel.vessels.maritimeMobileServiceIdentityMmsiNumber,
                  grossTonnage: vessel.vessels.grossTonnage,
                  lengthOverallLoa: vessel.vessels.lengthOverallLoa,
                  shiptypeLevel5: vessel.vessels.shiptypeLevel5,
                  statCode5: vessel.vessels.statCode5,
                  shiponOfacSanctionList: vessel.vessels.shiponOfacSanctionList,
                  shiponOfacNonSdnSanctionList:
                    vessel.vessels.shiponOfacNonSdnSanctionList,
                  shiponUsTreasuryOfacAdvisoryList:
                    vessel.vessels.shiponUsTreasuryOfacAdvisoryList,
                  shiponEuSanctionList: vessel.vessels.shiponEuSanctionList,
                  shiponUnSanctionList: vessel.vessels.shiponUnSanctionList,
                  groupBeneficialOwner: vessel.vessels.groupBeneficialOwner,
                  groupBeneficialOwnerCountryOfRegistration:
                    vessel.vessels.groupBeneficialOwnerCountryOfRegistration,
                  operator: vessel.vessels.operator,
                  operatorCountryOfRegistration:
                    vessel.vessels.operatorCountryOfRegistration,
                  registeredOwner: vessel.vessels.registeredOwner,
                  registeredOwnerCountryOfRegistration:
                    vessel.vessels.registeredOwnerCountryOfRegistration,
                }
              : null,
          vesselArrivalDetails: vessel.vessels_due_to_arrive,
          score,
        };
      });

      return c.json(vesselInfoWithScores);
    },
  );
