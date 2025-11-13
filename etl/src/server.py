import etl.src.util.env as env
import requests

from fastapi import FastAPI, Header, Query, HTTPException
from typing import Dict, Optional
from etl.src.ingest.mdh_api_ingestor import MdhApiIngestor
from loguru import logger

DEFAULT_DATASETS_WINDOWS = {
    "vessel_arrivals": 24,
    "vessel_departures": 24,
    "vessels_due_to_arrive": 73
}

API_KEY_HEADER = "x-api-key"
ETL_SERVICE_API_KEY = env.require_env("ETL_SERVICE_API_KEY")

DB_URL = env.require_env("DB_URL")
MDH_API_KEY = env.require_env("MDH_API_KEY")


app = FastAPI(title="Data Ingestion Service")

@app.post("/trigger-ingestion")
def trigger_ingestion(
    datasets: Optional[Dict[str, Optional[int]]] = None,
    x_api_key: str = Header(None)
):
    """
    Trigger ingestion for specified datasets and their respective data windows.
        datasets: dict of {dataset_name: data_window_hour}, window is optional.
    If no dataset specified, trigger all with default window.
    """
    # Check API key
    if x_api_key != ETL_SERVICE_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if not datasets:
        selected = DEFAULT_DATASETS_WINDOWS
    else:
        # Validate dataset names
        invalid = [d for d in datasets.keys() if d not in DEFAULT_DATASETS_WINDOWS]
        if invalid:
            raise HTTPException(status_code=400, detail=f"Invalid dataset(s): {invalid}")

        # Apply provided data window or default if None
        selected = {
            name: (window if window is not None else DEFAULT_DATASETS_WINDOWS[name])
            for name, window in datasets.items()
        }
    
    # Fetch location codes data
    location_code_mappings = None
    if any(item in selected for item in ["vessels_due_to_arrive", "vessel_arrivals"]):
        logger.info(f"Fetching latest location code values...")
        try:
            endpoint = "https://sg-mdh-api.mpa.gov.sg/v1/mdhvessel/reference/locations/filetype/json"
            r = requests.get(endpoint, headers={"apikey": MDH_API_KEY}, allow_redirects=True, timeout=10)
            r.raise_for_status
            location_header = r.headers.get('Location')
        except Exception as e:
            raise HTTPException(status_code=400, detail=f'Data fetch for location_codes resource location failed: "{e}".')
        try:
            r = requests.get(location_header)
            location_codes_json = r.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f'Data fetch for location_codes data failed: "{e}".')
        location_code_mappings = {entry['locationDescription']: entry['locationCode'] for entry in location_codes_json}
        logger.info(f"Data fetched for location code values: {len(location_codes_json)} entries.")

    results = {}
    for data_name, data_window_hours in selected.items():
        try:
            num_rows_inserted = MdhApiIngestor.ingest(DB_URL, MDH_API_KEY, data_name, data_window_hours, location_code_mappings)
            results[data_name] = f"success (data_window_hours={data_window_hours}): {num_rows_inserted} new row(s) added."
        except Exception as e:
            results[data_name] = f"error: {str(e)}"

    return {"triggered": list(selected.keys()), "results": results}