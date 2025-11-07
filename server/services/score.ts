import { vessels } from "server/drizzle/vessels.ts";

const SHIPCODES_OF_INTEREST = [
  "A11", // LNG/LPG tankers
  "A12", // chem tankers
  "A13", // oil tankers
  "A22", // oil bulk carriers
  "W11", // non-seagoing tanker
];

// TODO: track tripped rules
// TODO: make flexible (don't hardcode rules here)
export const scoreVessel = (vessel_info: typeof vessels.$inferSelect) => {
  let score = 0;
  const tripped_rules: string[] = [];
  // door condition
  if (
    SHIPCODES_OF_INTEREST.some((codeprefix) =>
      vessel_info.statCode5?.startsWith(codeprefix),
    )
  ) {
    score += 30;
    tripped_rules.push(`The vessel is of type ${vessel_info.shiptypeLevel5}.`);
    if (
      [
        vessel_info.shiponEuSanctionList,
        vessel_info.shiponOfacNonSdnSanctionList,
        vessel_info.shiponOfacSanctionList,
        vessel_info.shiponUnSanctionList,
        vessel_info.shiponUsTreasuryOfacAdvisoryList,
      ].some((val) => val === "True")
    ) {
      score += 20;
      tripped_rules.push(
        "The vessel is on one or more of the OFAC, EU and UN sanction lists.",
      );
    }

    const registeredOwner = vessel_info.registeredOwner?.trim().toLowerCase();
    if (
      !registeredOwner ||
      registeredOwner === "." ||
      registeredOwner.includes("unknown")
    ) {
      score += 10;
      tripped_rules.push("The vessel has no registered owner.");
    }
  }

  return {
    score,
    tripped_rules,
  };
};
