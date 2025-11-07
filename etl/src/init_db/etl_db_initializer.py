class EtlDbInitializer:
    def __init__(self, conn, data_name):
        self.conn = conn
        self.data_name = data_name

    def init_raw(self):
        with self.conn.cursor() as cur:
            cur.execute(
                f"""
                CREATE SCHEMA IF NOT EXISTS raw;
                CREATE TABLE IF NOT EXISTS "raw".{self.data_name}
                (
                    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 CACHE 1 ),
                    endpoint text COLLATE pg_catalog."default" NOT NULL,
                    fetched_at timestamp with time zone DEFAULT now(),
                    status_code integer,
                    response_json jsonb,
                    details text COLLATE pg_catalog."default",
                    processed boolean NOT NULL DEFAULT false
                )
                """
            )
            
    def init_staging(self):
        with self.conn.cursor() as cur:
            if self.data_name == "vessel_arrivals":
                cur.execute(
                    f"""
                    CREATE SCHEMA IF NOT EXISTS staging;
                    CREATE TABLE IF NOT EXISTS "staging".{self.data_name}
                    (
                        id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 CACHE 1 ),
                        vessel_name text COLLATE pg_catalog."default",
                        callsign text COLLATE pg_catalog."default",
                        imo text COLLATE pg_catalog."default",
                        flag text COLLATE pg_catalog."default",
                        arrived_time timestamp with time zone,
                        location_from text COLLATE pg_catalog."default",
                        location_to text COLLATE pg_catalog."default",
                        fetched_at timestamp with time zone
                    )
                    """)
            elif self.data_name == "vessel_departures": 
                cur.execute(
                    f"""
                    CREATE SCHEMA IF NOT EXISTS staging;
                    CREATE TABLE IF NOT EXISTS "staging".{self.data_name}
                    (
                        id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 CACHE 1 ),
                        vessel_name text COLLATE pg_catalog."default",
                        callsign text COLLATE pg_catalog."default",
                        imo text COLLATE pg_catalog."default",
                        flag text COLLATE pg_catalog."default",
                        departed_time timestamp with time zone,
                        fetched_at timestamp with time zone
                    )
                    """)
            elif self.data_name == "vessels_due_to_arrive": 
                cur.execute(
                    f"""
                    CREATE SCHEMA IF NOT EXISTS staging;
                    CREATE TABLE IF NOT EXISTS "staging".{self.data_name}
                    (
                        id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 CACHE 1 ),
                        vessel_name text COLLATE pg_catalog."default",
                        callsign text COLLATE pg_catalog."default",
                        imo text COLLATE pg_catalog."default",
                        flag text COLLATE pg_catalog."default",
                        due_to_arrive_time timestamp with time zone,
                        location_from text COLLATE pg_catalog."default",
                        location_to text COLLATE pg_catalog."default",
                        fetched_at timestamp with time zone
                    )
                    """)
    
    def init_etl_db(self):
        self.init_raw()
        self.init_staging()