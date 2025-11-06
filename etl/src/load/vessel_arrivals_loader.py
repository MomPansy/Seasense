class VesselArrivalsLoader:
    def __init__(self, data_name):
        self.data_name = data_name
    
    def insert_distinct_not_exists(self, conn):
        with conn.cursor() as cur:
            cur.execute(
                f"""
                INSERT INTO public.{self.data_name}(vessel_name, callsign, imo, flag, arrived_time, location_from, location_to)
                SELECT vessel_name, callsign, imo, flag, arrived_time, location_from, location_to FROM (
                    SELECT DISTINCT ON (vessel_name, imo, arrived_time) * FROM staging.{self.data_name}
                ) t
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM public.{self.data_name} va
                    WHERE va.vessel_name = t.vessel_name
                    AND va.imo = t.imo
                    AND va.arrived_time = t.arrived_time
                )
                ORDER BY arrived_time ASC
                """
            )
            return cur.rowcount
    
    def load(self, conn):
        num_rows_inserted = self.insert_distinct_not_exists(conn)
        return num_rows_inserted