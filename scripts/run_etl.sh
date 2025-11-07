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
for TABLE in "${TABLES[@]}"; do
  SCRIPT_PATH="etl/src/update_${TABLE}.py"

  if [ ! -f "$SCRIPT_PATH" ]; then
    echo "ERROR: ETL script not found for data '$TABLE'. Expected file: $SCRIPT_PATH"
    exit 1  # stop the whole run immediately
  fi

  echo "Running ETL for data: $TABLE"
  npm run envx -- run \
    --env-file .env.production \
    --env-file .env.development \
    --overload \
    -- python "$SCRIPT_PATH"
  
done