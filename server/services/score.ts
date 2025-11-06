import { eq } from "drizzle-orm"
import { vessels } from "server/drizzle/vessels"
import { db } from "server/lib/db"

const SHIPTYPES_OF_INTEREST = [
    "Alcohol Tanker",
    "Asphalt/Bitumen Tanker",
    "Beer Tanker",
    "Bitumen Tank Barge, non propelled",
    "Bulk/Oil Carrier (OBO)",
    "Bulk/Oil/Chemical Carrier (CLEANBU)",
    "Bulk/Sulphuric Acid Carrier",
    "Bunkering Tanker (LNG)",
    "Bunkering Tanker (LNG), Inland Waterways",
    "Bunkering Tanker (LNG/Oil)",
    "Bunkering Tanker (Oil)",
    "Bunkering Tanker (Oil), Inland Waterways",
    "CNG Tanker",
    "CO2 Tanker",
    "Caprolactam Tanker",
    "Chemical Tank Barge, non propelled",
    "Chemical Tanker",
    "Chemical Tanker, Inland Waterways",
    "Chemical/Products Tank Barge, non propelled",
    "Chemical/Products Tanker",
    "Chemical/Products Tanker, Inland Waterways",
    "Coal/Oil Mixture Tanker",
    "Combination Gas Tanker (LNG/LPG)",
    "Crude Oil Tank Barge, non propelled",
    "Crude Oil Tanker",
    "Crude/Oil Products Tanker",
    "Edible Oil Tanker",
    "Edible Oil Tanker, Inland Waterways",
    "General Cargo/Tanker",
    "Glue Tanker",
    "LNG Tanker",
    "LPG Tank Barge, non propelled",
    "LPG Tanker",
    "LPG Tanker, Inland Waterways",
    "LPG/Chemical Tanker",
    "Molasses Tanker",
    "Molten Sulphur Tanker",
    "Oil Tanker, Inland Waterways",
    "Ore/Oil Carrier",
    "Products Tank Barge, non propelled",
    "Products Tanker",
    "Replenishment Tanker",
    "Shuttle Tanker",
    "Tanker (unspecified)",
    "Vegetable Oil Tanker",
    "Vegetable Oil Tanker, Inland Waterways",
    "Water Tank Barge, non propelled",
    "Water Tanker",
    "Water Tanker, Inland Waterways",
    "Wine Tanker",
]

// TODO: track tripped rules
// TODO: make flexible (don't hardcode rules here)
export const scoreVessel = async (imoNumber: string) => {
    const vessel_info = (await db.select().from(vessels).where(eq(vessels.ihslRorImoShipNo, imoNumber)))[0]

    let score = 0
    // door condition
    if (SHIPTYPES_OF_INTEREST.includes(vessel_info.shiptypeLevel5 ?? '')) {
        score += 30
        if ([
            vessel_info.shiponEuSanctionList, 
            vessel_info.shiponOfacNonSdnSanctionList, 
            vessel_info.shiponOfacSanctionList, 
            vessel_info.shiponUnSanctionList, 
            vessel_info.shiponUsTreasuryOfacAdvisoryList
        ].some((val) => val === 'True')) {
            score += 20
        }

        if (!vessel_info.registeredOwner) score += 10
    }

    return score
}