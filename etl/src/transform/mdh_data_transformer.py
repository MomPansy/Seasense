import pytz
from etl.src.util.logger import logger

class MdhDataTransformer:
    def __init__(self, conn, data_name, location_code_mappings):
        self.conn = conn
        self.data_name = data_name
        self.tz = pytz.timezone("Asia/Singapore")
        self.location_code_mappings = location_code_mappings
    
    
    def reset_staging_table(self):
        with self.conn.cursor() as cur:
            cur.execute(
                f"""
                TRUNCATE staging.{self.data_name}
                RESTART IDENTITY
                """
            )
        
    def mark_raw_processed(self, ids):
        with self.conn.cursor() as cur:
            cur.execute(
                f"""
                UPDATE raw.{self.data_name}
                SET processed = true
                WHERE id = ANY(%s)
                """,
                (ids,)
            )
    def get_unprocessed_rows(self):
        with self.conn.cursor() as cur:
            cur.execute(f"""
                        SELECT id, fetched_at, response_json
                        FROM raw.{self.data_name}
                        WHERE status_code=200
                        AND processed=false
                        ORDER BY fetched_at DESC
                        """)
            return cur.fetchall()
    
    def staging_transform_row(self, fetched_at, response_json):
        raise NotImplementedError
    
    def staging_insert_item(self, item):
        column_names = list(item.keys())
        values = [item[column] for column in column_names]
        with self.conn.cursor() as cur:
            cur.execute(
                f"""
                INSERT INTO staging.{self.data_name} ({', '.join(column_names)}                )
                VALUES ({', '.join(['%s'] * len(column_names))})
                """,
                values
            )
    
    
    def transform(self):
        raw_rows = self.get_unprocessed_rows()
        if not raw_rows:
            logger.debug(f"There are no new api fetches to process for {self.data_name}.")
            return

        self.reset_staging_table()
        
        for rid, fetched_at, response_json in raw_rows:
            items = self.staging_transform_row(fetched_at, response_json)
            if not items:
                continue
            for item in items:
                self.staging_insert_item(item)
            
        ids = [row[0] for row in raw_rows]
        if ids:
            self.mark_raw_processed(ids)