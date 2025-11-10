import argparse
import etl.src.util.env as env

from etl.src.ingest.mdh_api_ingestor import MdhApiIngestor


def main(DB_URL, MDH_API_KEY, datasets):
    for data_name, data_window_hours in datasets.items():
        MdhApiIngestor.ingest(DB_URL, MDH_API_KEY, data_name, data_window_hours)

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