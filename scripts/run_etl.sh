#!/bin/bash
set -e

# All possible ETL tables (add more later)
ALL_TABLES=("vessel_arrivals" "vessel_departures" "vessels_due_to_arrive")

# Read parameters (tables to run)
if [ $# -eq 0 ]; then
  TABLES=("${ALL_TABLES[@]}")
else
  TABLES=("$@")  # all args passed to script
fi

# Set up venv
python3 -m venv .venv
source .venv/bin/activate

# Install Python deps if needed (optional)
pip install -r etl/requirements.txt -q

# Run Python ETL scripts
npm run envx -- run --env-file .env.production --env-file .env.development --overload -- python etl/src/main.py "$@"
