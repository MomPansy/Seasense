
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const vessels = pgTable("vessels", {
    id: uuid("id").primaryKey().notNull(),
    ihsLrOrImoVesselno: text("ihs_lr_or_imo_vesselno").notNull(),
    vesselName: text("vessel_name"),
    callSign: text("call_sign"),
    flagEffectiveDate: text("flag_effective_date"),
    flagName: text("flag_name"),
    groupBeneficialOwner: text("group_beneficial_owner"),
    groupBeneficialOwnerCountryOfControl: text("group_beneficial_owner_country_of_control"),
    groupBeneficialOwnerCountryOfRegistration: text("group_beneficial_owner_country_of_registration"),
    operator: text("operator"),
    operatorCountryOfControl: text("operator_country_of_control"),
    operatorCountryOfRegistration: text("operator_country_of_registration"),
    registeredOwner: text("registered_owner"),
    registeredOwnerCountryOfControl: text("registered_owner_country_of_control"),
    registeredOwnerCountryOfRegistration: text("registered_owner_country_of_registration"),
    vesselManager: text("vessel_manager"),
    vesselManagerCountryOfControl: text("vessel_manager_country_of_control"),
    vesselManagerCountryOfRegistration: text("vessel_manager_country_of_registration"),
    vesseltypeGroup: text("vesseltype_group"),
    comments: text("comments"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});