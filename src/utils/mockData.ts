import { Vessel } from "../components/VesselTable";

export interface VesselDetails extends Vessel {
  modelNumber: string;
  lastPorts: { port: string; country: string }[];
  groupOwner: string;
  companyCountry: string;
  registeredOwner: string;
  operator: string;
  complianceCountries: string[];
  threatPercentage: number;
  parameters: string[];
}

const vesselTypes = [
  "Chemical Tankers",
  "LNG Tankers",
  "LPG Tankers",
  "Other Tankers",
  "Bulk Carriers",
  "Container",
  "General Cargo",
  "Other Dry Cargo",
  "Passenger",
  "Refrigerated Cargo",
  "Ro-Ro Cargo",
  "Other Non-Merchant Ships",
];

const vesselTypeThreatLevels: Record<string, number> = {
  "Chemical Tankers": 3,
  "LNG Tankers": 4,
  "LPG Tankers": 4,
  "Other Tankers": 2, // default
  "Bulk Carriers": 2,
  Container: 3,
  "General Cargo": 3,
  "Other Dry Cargo": 3,
  Passenger: 3,
  "Refrigerated Cargo": 3,
  "Ro-Ro Cargo": 3,
  "Other Non-Merchant Ships": 3,
};

const vesselNames = [
  "MAERSK ESSEX",
  "OCEAN PRINCESS",
  "ATLANTIC VOYAGER",
  "PACIFIC NAVIGATOR",
  "CARIBBEAN EXPLORER",
  "NORDIC STAR",
  "ASIAN PHOENIX",
  "MEDITERRANEAN QUEEN",
  "ARABIAN PRIDE",
  "BALTIC SPIRIT",
  "INDIAN VENTURE",
  "ARCTIC MONARCH",
  "AUSTRAL EMPEROR",
  "COASTAL CHAMPION",
  "DEEP SEA GUARDIAN",
  "EMERALD DYNASTY",
  "FREEDOM FORTUNE",
  "GLOBAL HARMONY",
  "HORIZON SEEKER",
  "IMPERIAL GLORY",
  "JADE MARINER",
  "KINGDOM TRADER",
  "LIBERTY WAVE",
  "MARITIME LEGEND",
  "NEPTUNE CROWN",
  "ODYSSEY MASTER",
  "PEARL CARRIER",
  "QUANTUM SAILOR",
];

const groupOwners = [
  "Maersk Line",
  "Ocean Network Express",
  "Mediterranean Shipping Company",
  "CMA CGM Group",
  "Hapag-Lloyd",
  "Evergreen Marine",
  "COSCO Shipping",
  "Yang Ming Marine",
  "Hyundai Merchant Marine",
  "Pacific International Lines",
];

const countries = [
  "Denmark",
  "Japan",
  "Switzerland",
  "France",
  "Germany",
  "Taiwan",
  "China",
  "South Korea",
  "Singapore",
  "Panama",
  "Liberia",
  "Marshall Islands",
];

const locationCodes = [
  "PBG01",
  "PBG02",
  "PBG03",
  "PBG04",
  "PBG05",
  "ANC-A",
  "ANC-B",
  "ANC-C",
  "ANC-D",
  "ANC-E",
  "PBG-NORTH",
  "PBG-SOUTH",
  "ANC-EAST",
  "ANC-WEST",
];

const registeredOwners = [
  "Seaborne Ventures Ltd",
  "Oceanic Holdings Inc",
  "Maritime Assets Corp",
  "Global Shipping Partners",
  "Pacific Fleet Management",
  "Atlantic Vessel Co",
  "Eastern Maritime Group",
  "Western Shipping LLC",
  "Nordic Marine Holdings",
  "Southern Ocean Enterprises",
];

const operators = [
  "Maersk Line",
  "Ocean Network Express",
  "Mediterranean Shipping Company",
  "CMA CGM Group",
  "Hapag-Lloyd",
  "Evergreen Marine",
  "COSCO Shipping",
  "Yang Ming Marine",
  "Hyundai Merchant Marine",
  "Pacific International Lines",
];

function generateCallSign(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let callSign = "";
  for (let i = 0; i < 5; i++) {
    callSign += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return callSign;
}

function getRandomLocation(): string {
  return locationCodes[Math.floor(Math.random() * locationCodes.length)];
}

function getRandomCountries(count: number): string[] {
  const shuffled = [...countries].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const ports = [
  { port: "Port Klang", country: "Malaysia" },
  { port: "Jakarta", country: "Indonesia" },
  { port: "Manila", country: "Philippines" },
  { port: "Dubai", country: "United Arab Emirates" },
  { port: "Hong Kong", country: "China" },
  { port: "Shanghai", country: "China" },
  { port: "Rotterdam", country: "Netherlands" },
  { port: "Hamburg", country: "Germany" },
  { port: "Los Angeles", country: "United States" },
  { port: "Tokyo", country: "Japan" },
  { port: "Busan", country: "South Korea" },
  { port: "Chennai", country: "India" },
  { port: "Colombo", country: "Sri Lanka" },
  { port: "Bangkok", country: "Thailand" },
];

function generateRandomDate(hoursFromNow: number, maxHoursRange: number): Date {
  const now = new Date();
  const randomHours = hoursFromNow + Math.random() * maxHoursRange;
  return new Date(now.getTime() + randomHours * 60 * 60 * 1000);
}

function generatePastDate(minDaysAgo: number, maxDaysAgo: number): Date {
  const now = new Date();
  const daysAgo = minDaysAgo + Math.random() * (maxDaysAgo - minDaysAgo);
  return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
}

function getRandomPorts(count: number): { port: string; country: string }[] {
  const shuffled = [...ports].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateThreatParameters(
  vesselType: string,
  threatLevel: number,
): string[] {
  const baseParams = [`Vessel is a ${vesselType}`];

  const possibleParams = [
    "Vessel is in the OFAC watchlist",
    "Vessel carries Dangerous Cargo, which is Ammonium Nitrate",
    "Vessel had submitted a late pre-arrival notice",
    "Vessel had an inactive AIS for 24 hours, which is more than the baseline of 16 hours",
    "Vessel had last 5 port calls from high-risk regions (MY, ID, PH, Middle East)",
    "Vessel ownership structure is complex with multiple shell companies",
    "Vessel has flag state deficiencies",
    "Vessel crew composition includes high-risk nationalities",
  ];

  const paramCount = Math.min(threatLevel + 2, possibleParams.length);
  const shuffled = [...possibleParams].sort(() => 0.5 - Math.random());

  return [...baseParams, ...shuffled.slice(0, paramCount)];
}

export function generateMockVessels(count = 30): Vessel[] {
  const vessels: Vessel[] = [];

  for (let i = 0; i < count; i++) {
    const vesselType =
      vesselTypes[Math.floor(Math.random() * vesselTypes.length)];
    // Use predefined threat level for vessel type, with some randomness
    const baseThreatLevel = vesselTypeThreatLevels[vesselType] || 2;
    const threatLevel = Math.max(
      2,
      Math.min(5, baseThreatLevel + Math.floor(Math.random() * 2) - 1),
    );
    const threatPercentage =
      10 + threatLevel * 15 + Math.floor(Math.random() * 10);

    vessels.push({
      id: `vessel-${i + 1}`,
      name:
        vesselNames[i % vesselNames.length] +
        (i >= vesselNames.length
          ? ` ${Math.floor(i / vesselNames.length) + 1}`
          : ""),
      type: vesselType,
      imo: `${9000000 + Math.floor(Math.random() * 999999)}`,
      callSign: generateCallSign(),
      locationFrom: getRandomLocation(),
      locationTo: getRandomLocation(),
      threatLevel,
      threatPercentage,
      arrivalTime: generateRandomDate(24, 48), // 24-72 hours from now
      lastArrivalTime: generatePastDate(30, 180), // 1-6 months ago
    });
  }

  return vessels;
}

export function generateDetailedVessel(vessel: Vessel): VesselDetails {
  return {
    ...vessel,
    modelNumber: `MK-${Math.floor(Math.random() * 9000) + 1000}`,
    lastPorts: getRandomPorts(5),
    groupOwner: groupOwners[Math.floor(Math.random() * groupOwners.length)],
    companyCountry: countries[Math.floor(Math.random() * countries.length)],
    registeredOwner:
      registeredOwners[Math.floor(Math.random() * registeredOwners.length)],
    operator: operators[Math.floor(Math.random() * operators.length)],
    complianceCountries: getRandomCountries(2 + Math.floor(Math.random() * 3)),
    parameters: generateThreatParameters(vessel.type, vessel.threatLevel),
  };
}
