import requests
import json
from datetime import datetime
from loguru import logger

class Ingestor:
    def __init__(self, data_name, endpoint, api_key):
        self.data_name = data_name
        self.endpoint = endpoint
        self.api_key = api_key

    def fetch_data(self, api, api_key):
        try:
            r = requests.get(api, headers={"apikey": api_key}, timeout=10)
            r.raise_for_status()
            data = r.json()
            return r.status_code, data, None
        except Exception as e:
            # record failure for visibility
            logger.error(f"Error trying to fetch '{api}': {e}")
            return getattr(e, "status_code", None), None, str(e)

    def save_raw(self, conn, status_code, response_json, details=None):
        with conn.cursor() as cur:
            cur.execute(
                f"""
                INSERT INTO raw.{self.data_name}
                    (endpoint, status_code, response_json, details)
                VALUES
                    (%s, %s, %s, %s)
                RETURNING id
                """,
                (self.endpoint, status_code, json.dumps(response_json) if response_json is not None else None, details)
            )
        
    def ingest(self, conn):
        status, data, err = self.fetch_data(self.endpoint, self.api_key)
        with conn:
            self.save_raw(conn, status if status else 0, data, err)      
        if status >= 300:
            raise Exception(f"Data fetch failed with status code {status} for {self.data_name}")
