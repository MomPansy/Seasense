import requests
import json
from datetime import datetime
from etl.src.util.logger import logger

class DataFetcher:
    def __init__(self, data_name, endpoint, api_key):
        self.data_name = data_name
        self.endpoint = endpoint
        self.api_key = api_key

    def call_api(self):
        try:
            r = requests.get(self.endpoint, headers={"apikey": self.api_key}, timeout=10)
            r.raise_for_status()
            data = r.json()
            return r.status_code, data, None
        except Exception as e:
            err_details = r.json() if r else e
            # logger.error(f"Error trying to fetch '{api}': {err_details}")
            return getattr(e, "status_code", None), None, str(err_details)

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
        
    def fetch_and_save(self, conn):
        status, data, err = self.call_api()
        with conn:
            self.save_raw(conn, status if status else 0, data, err)      
        if not status or status >= 300:
            raise Exception(f'Data fetch for {self.data_name} failed: "{err}".')
        
