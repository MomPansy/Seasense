import os
import psycopg2
import pytz
import traceback

from datetime import datetime
from init_db import EtlDbInitializer
from extract import DataFetcher
from transform import VesselArrivalsTransformer, VesselDeparturesTransformer, VesselsDueToArriveTransformer
from load import MdhVesselArrivalsLoader, MdhVesselDeparturesLoader, MdhVesselsDueToArriveLoader
from loguru import logger

class MdhApiIngestor:
    def ingest(data_name, data_window_hours):
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        apis = {
            "vessel_arrivals": f"https://sg-mdh-api.mpa.gov.sg/v1/vessel/arrivals/date/{now}/hours/{data_window_hours}",
            "vessel_departures": f"https://sg-mdh-api.mpa.gov.sg/v1/vessel/departure/date/{now}/hours/{data_window_hours}",
            "vessels_due_to_arrive": f"https://sg-mdh-api.mpa.gov.sg/v1/vessel/duetoarrive/date/{now}/hours/{data_window_hours}",
        }

        try:
            DB_URL = os.getenv("DB_URL")
            MDH_API_KEY = os.getenv("MDH_API_KEY")

            conn = psycopg2.connect(DB_URL)

            # Init db for etl
            logger.debug(f"Getting db ready for etl...")
            dbinit = EtlDbInitializer(conn, data_name)
            dbinit.init_etl_db()
            
            # Fetch data and store to staging
            logger.info(f"Fetching data for {data_name} with data_window_hours={data_window_hours}...")
            endpoint = apis[data_name]
            ingestor = DataFetcher(data_name, endpoint, MDH_API_KEY)
            ingestor.fetch(conn)
            logger.debug(f"Data fetched and stored in raw table for {data_name}.")

            # Transform data and insert into staging table
            logger.debug(f"Transforming and inserting data for {data_name} into staging...")
            TRANSFORMERS = {
                "vessel_arrivals": VesselArrivalsTransformer,
                "vessel_departures": VesselDeparturesTransformer,
                "vessels_due_to_arrive": VesselsDueToArriveTransformer,
            }
            if data_name not in TRANSFORMERS:
                raise ValueError(f"No transformer defined for data_name: {data_name}")
            transformer_class = TRANSFORMERS[data_name]
            transformer = transformer_class(conn, data_name)
            transformer.transform()
            logger.debug(f"Data transformed and inserted into staging table for {data_name}.")

            # Load data from staging to final table
            logger.debug(f"Loading data from staging to final table for {data_name}...")
            LOADERS = {
                "vessel_arrivals": MdhVesselArrivalsLoader,
                "vessel_departures": MdhVesselDeparturesLoader,
                "vessels_due_to_arrive": MdhVesselsDueToArriveLoader,
            }
            loader_class = LOADERS[data_name]
            loader = loader_class(conn, data_name)
            num_rows_inserted = loader.load()
            logger.info(f"{num_rows_inserted} rows of new data loaded into final table for {data_name}.")

            conn.commit()
        except Exception as e:
            logger.error(f"Error updating data for {data_name}: {e}")
            conn.rollback()
            traceback.print_exc()
        finally:
            conn.close()
