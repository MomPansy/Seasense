import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { arrivalRuleset } from "server/constants/rules.ts";
import { vessels } from "server/drizzle/vessels.ts";
import { factory } from "server/factory.ts";
import { db } from "server/lib/db.ts";
import { scoreVessel } from "server/services/score.ts";

export const scoreRoute = factory
  .createApp()
  .get(
    "/vessel/:vesselimo",
    zValidator(
      "param",
      z.object({
        vesselimo: z.string().min(1),
      }),
    ),
    async (c) => {
      const vesselimo = c.req.param("vesselimo");
      const vesselInfo = (
        await db
          .select()
          .from(vessels)
          .where(eq(vessels.ihslRorImoShipNo, vesselimo))
      )[0];
      const scoreInfo = scoreVessel(vesselInfo, arrivalRuleset);
      return c.json(scoreInfo);
    },
  )
  .get("/headers", (c) => {
    const doorRuleHeader = arrivalRuleset.door.name;
    const autoRuleHeaders = arrivalRuleset.rules.map((rule) => rule.name);
    const manualRuleHeaders = arrivalRuleset.manualRules.map(
      (rule) => `${rule.name} [MANUAL]`,
    );
    const otherHeaders = ["Score", "Threat level"];

    return c.json(
      ["Vessel Name", doorRuleHeader]
        .concat(autoRuleHeaders)
        .concat(manualRuleHeaders)
        .concat(otherHeaders),
    );
  });
