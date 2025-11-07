import { Rule, Ruleset } from "server/constants/rules.ts";
import { VesselDetails } from "server/drizzle/vessels.ts";

export interface checkedRule extends Rule {
  tripped: boolean;
}

export const scoreVessel = (vesselInfo: VesselDetails, ruleset: Ruleset) => {
  let score = 0;
  let level = 0;
  const checkedRules: checkedRule[] = [];
  const manualRules = ruleset.manualRules;

  if (ruleset.door.ruleFn?.(vesselInfo)) {
    score += ruleset.door.weight;
    checkedRules.push({ ...ruleset.door, tripped: true });
    ruleset.rules.forEach((rule) => {
      if (rule.ruleFn?.(vesselInfo)) {
        checkedRules.push({ ...rule, tripped: true });
        score += rule.weight;
      } else {
        checkedRules.push({ ...rule, tripped: false });
      }
    });
    ruleset.levels.forEach((levelThreshold) => {
      if (score >= levelThreshold.threshold) level = levelThreshold.level;
    });
  } else {
    checkedRules.push({ ...ruleset.door, tripped: false });
    ruleset.rules.forEach((rule) => {
      checkedRules.push({ ...rule, tripped: false });
    });
  }

  return {
    score,
    level,
    checkedRules,
    manualRules,
  };
};
