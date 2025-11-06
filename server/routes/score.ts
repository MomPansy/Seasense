import { factory } from "server/factory.ts";
import { scoreVessel } from "server/services/score";

export const scoreRoute = factory
    .createApp()
    .get(
        "/:vesselimo",
        async (c) => {
            const score_info = await scoreVessel(c.req.param('vesselimo'))
            return c.json(score_info)
        },
    )