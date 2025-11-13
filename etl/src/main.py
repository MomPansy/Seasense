import argparse
import etl.src.util.env as env
import requests
import traceback

from etl.src.ingest.mdh_api_ingestor import MdhApiIngestor


def fetch_location_codes(MDH_API_KEY):
    try:
        endpoint = "https://sg-mdh-api.mpa.gov.sg/v1/mdhvessel/reference/locations/filetype/json"
        r = requests.get(endpoint, headers={"apikey": MDH_API_KEY}, allow_redirects=True, timeout=10)
        r.raise_for_status
        location_header = r.headers.get('Location')
    except Exception as e:
        traceback.print_exc()
        raise Exception(f'Data fetch for location_codes resource location failed: "{e}".')
    
    try:
        r = requests.get(location_header)
        return r.json()
    except Exception as e:
        traceback.print_exc()
        raise Exception(f'Data fetch for location_codes data failed: "{e}".')

def main(DB_URL, MDH_API_KEY, datasets):
    location_code_mappings = None
    if any(item in datasets for item in ["vessels_due_to_arrive", "vessel_arrivals"]):
        location_codes_json = fetch_location_codes(MDH_API_KEY)
        location_code_mappings = {entry['locationDescription']: entry['locationCode'] for entry in location_codes_json}
    for data_name, data_window_hours in datasets.items():
        MdhApiIngestor.ingest(DB_URL, MDH_API_KEY, data_name, data_window_hours, location_code_mappings)

if __name__ == "__main__":
    DB_URL = env.require_env("DB_URL")
    MDH_API_KEY = env.require_env("MDH_API_KEY")
    
    DEFAULTS = {
        "vessel_arrivals": 24,
        "vessel_departures": 24,
        "vessels_due_to_arrive": 73
    }
    
    parser = argparse.ArgumentParser(description="Run ETL for datasets")
    parser.add_argument(
        "datasets",
        nargs="*",
        help="Dataset names, optionally with data_window_hours to fetch for, e.g. vessel_arrivals=24"
    )
    args = parser.parse_args()

    datasets = {}
    if not args.datasets:
        datasets = DEFAULTS.copy()
    for arg in args.datasets:
        if "=" in arg:
            name, value = arg.split("=", 1)
            if name not in DEFAULTS:
                raise Exception(f'Invalid dataset name: "{name}".')
            datasets[name] = int(value)
        else:
            if arg not in DEFAULTS:
                raise Exception(f'Invalid dataset name: "{arg}".')
            datasets[arg] = DEFAULTS.get(arg, 1)

    main(DB_URL, MDH_API_KEY, datasets)