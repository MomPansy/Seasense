CREATE TABLE "vessels_due_to_arrive" (
	"id" integer PRIMARY KEY NOT NULL,
	"vessel_name" text,
	"callsign" text,
	"imo" text,
	"flag" text,
	"due_to_arrive_time" timestamp with time zone,
	"location_from" text,
	"location_to" text,
	"fetched_at" timestamp with time zone
);

ALTER TABLE "vessels" ALTER COLUMN "IHSLRorIMOShipNo" SET DATA TYPE text;