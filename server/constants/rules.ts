import { VesselDetails } from "server/drizzle/vessels.ts";

export interface Rule {
  name: string;
  description: string | ((vesselInfo: VesselDetails) => string);
  weight: number;
  ruleFn?: (vesselInfo: VesselDetails) => boolean;
}

export interface Ruleset {
  door: Rule;
  rules: Rule[];
  manualRules: Rule[];
  levels: {
    level: number;
    threshold: number;
  }[];
}

const tankerRule = (vesselInfo: VesselDetails) => {
  const shipcodesOfInterest = [
    "A1", // all (seagoing) tankers
  ];

  return shipcodesOfInterest.some((codeprefix) =>
    vesselInfo.statCode5?.startsWith(codeprefix),
  );
};

const sanctionRule = (vesselInfo: VesselDetails) => {
  return [
    vesselInfo.shiponEuSanctionList,
    vesselInfo.shiponOfacNonSdnSanctionList,
    vesselInfo.shiponOfacSanctionList,
    vesselInfo.shiponUnSanctionList,
    vesselInfo.shiponUsTreasuryOfacAdvisoryList,
  ].some((val) => val === "True");
};

const ownerRule = (vesselInfo: VesselDetails) => {
  const registeredOwner = vesselInfo.registeredOwner?.trim().toLowerCase();
  return (
    !registeredOwner ||
    registeredOwner === "." ||
    registeredOwner.includes("unknown")
  );
};

export const arrivalRuleset: Ruleset = {
  door: {
    name: "Hazardous Liquid Tanker",
    description: (vesselInfo) =>
      `The vessel is of type ${vesselInfo.shiptypeLevel5}.`,
    weight: 30,
    ruleFn: tankerRule,
  },
  rules: [
    {
      name: "Sanction List",
      description:
        "The vessel is on one or more of the OFAC, EU and UN sanction lists.",
      weight: 20,
      ruleFn: sanctionRule,
    },
    {
      name: "Owner Unknown",
      description: "The vessel has no registered owner.",
      weight: 10,
      ruleFn: ownerRule,
    },
  ],
  manualRules: [
    {
      name: "Dangerous Cargo",
      description: "The vessel is carrying dangerous cargo.",
      weight: 10,
    },
    {
      name: "Late Pre-arrival",
      description: "The vessel submitted its pre-arrival notice late.",
      weight: 10,
    },
    {
      name: "AIS inactive",
      description: "The vessel's AIS has been inactive for more than 16 hours.",
      weight: 10,
    },
    {
      name: "COI Port Calls",
      description:
        "The vessel's last 5 port calls include countries of interest.",
      weight: 10,
    },
  ],
  levels: [
    { level: 5, threshold: 30 },
    { level: 4, threshold: 50 },
    { level: 3, threshold: 70 },
    { level: 2, threshold: 100 },
  ],
};
