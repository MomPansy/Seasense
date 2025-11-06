
import pytz
from datetime import datetime

class VesselDeparturesTransformer :
    def __init__(self, data_name, tz):
        self.data_name = data_name
        self.tz = tz

    def staging_transform_row(self, fetched_at, response_json):
        rows = []
        if not response_json:
            return rows
        for record in response_json:
            vessel_particulars = record["vesselParticulars"]

            # Convert departedTime to GMT+8
            raw_departure = record.get("departedTime")
            if raw_departure:
                naive_ts = datetime.strptime(raw_departure, "%Y-%m-%d %H:%M:%S")
                departure_gmt8 = self.tz.localize(naive_ts)
                departure_utc = departure_gmt8.astimezone(pytz.UTC)
            else:
                departure_utc = None

            rows.append({
                "vessel_name": vessel_particulars["vesselName"],
                "callsign": vessel_particulars["callSign"],
                "imo": vessel_particulars["imoNumber"],
                "flag": vessel_particulars["flag"],
                "departed_time": departure_utc,
                "fetched_at": fetched_at,
            })
        return rows
    
    def reset_staging_table(self, conn):
        with conn.cursor() as cur:
            cur.execute(
                f"""
                TRUNCATE staging.{self.data_name}
                RESTART IDENTITY
                """
            )

    def staging_insert_item(self, conn, item):
        with conn.cursor() as cur:
            cur.execute(
                f"""
                INSERT INTO staging.{self.data_name} (
                    vessel_name, callsign, imo, flag,
                    departed_time,
                    fetched_at
                )
                VALUES (
                    %s,%s,%s,%s,
                    %s,
                    %s
                )
                """,
                (item['vessel_name'], item['callsign'], item['imo'], item['flag'],
                item['departed_time'],
                item['fetched_at'])
            )
    
    def mark_raw_processed(self, conn, ids):
        with conn.cursor() as cur:
            cur.execute(
                f"""
                UPDATE raw.{self.data_name}
                SET processed = true
                WHERE id = ANY(%s)
                """,
                (ids,)
            )
    
    def transform(self, conn):
        with conn.cursor() as cur:
            cur.execute(f"""
                        SELECT id, fetched_at, response_json
                        FROM raw.{self.data_name}
                        WHERE status_code=200
                        AND processed=false
                        ORDER BY fetched_at DESC
                        """)
            raw_rows = cur.fetchall()
            
        self.reset_staging_table(conn)

        for rid, fetched_at, response_json in raw_rows:
            items = self.staging_transform_row(fetched_at, response_json)
            if not items:
                continue
            for item in items:
                self.staging_insert_item(conn, item)
            
        ids = [row[0] for row in raw_rows]
        if ids:
            self.mark_raw_processed(conn, ids)