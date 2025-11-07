import argparse

from ingest.mdh_api_ingestor import MdhApiIngestor


def main(datasets):
    for data_name, data_window_hours in datasets.items():
        MdhApiIngestor.ingest(data_name, data_window_hours)

if __name__ == "__main__":
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

    main(datasets)