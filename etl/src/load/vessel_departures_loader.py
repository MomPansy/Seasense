class VesselDeparturesLoader:
    def __init__(self, data_name):
        self.data_name = data_name
    
    def insert_distinct_not_exists(self, conn):
        with conn.cursor() as cur:
            cur.execute(
                f"""
                INSERT INTO public.{self.data_name}(vessel_name, callsign, imo, flag, departed_time)
                SELECT vessel_name, callsign, imo, flag, departed_time FROM (
                    SELECT DISTINCT ON (vessel_name, imo, departed_time) * FROM staging.{self.data_name}
                ) t
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM public.{self.data_name} va
                    WHERE va.vessel_name = t.vessel_name
                    AND va.imo = t.imo
                    AND va.departed_time = t.departed_time
                )
                ORDER BY departed_time ASC
                """
            )
            return cur.rowcount
    
    def load(self, conn):
        num_rows_inserted = self.insert_distinct_not_exists(conn)
        return num_rows_inserted