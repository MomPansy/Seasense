from load import VesselArrivalsLoader
from loguru import logger
import psycopg2
import os
import pytz
from datetime import datetime
from ingest.ingestor import Ingestor
from init_db.db_initializer import DbInitializer
from transform import VesselArrivalsTransformer

DB_URL = os.getenv("DB_URL")
MDH_API_KEY = os.getenv("MDH_API_KEY")

def main(data_for_past_n_hours=24):
    try:
        conn = psycopg2.connect(DB_URL)
        data_name = "vessel_arrivals"


        # Init db for etl
        dbinit = DbInitializer(conn, data_name)
        dbinit.init_etl_db()
        
        
        # Fetch data and store to staging
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        endpoint = f"https://sg-mdh-api.mpa.gov.sg/v1/vessel/arrivals/date/{now}/hours/{data_for_past_n_hours}"

        logger.info(f"Fetching data for {data_name}...")
        ingestor = Ingestor(data_name, endpoint, MDH_API_KEY)
        ingestor.ingest(conn)
        logger.info(f"Data fetched and stored in raw table for {data_name}.")


        # Transform data and insert into staging table
        logger.info(f"Transforming and inserting data for {data_name} into staging...")
        transformer = VesselArrivalsTransformer(data_name, pytz.timezone("Asia/Singapore"))
        transformer.transform(conn)
        logger.info(f"Data transformed and inserted into staging table for {data_name}.")


        # Load data from staging to final table
        loader = VesselArrivalsLoader(data_name)
        logger.info(f"Loading data from staging to final table for {data_name}...")
        num_rows_inserted = loader.load(conn)
        logger.info(f"{num_rows_inserted} rows of new data loaded into final table for {data_name}.")

        conn.commit()
    except Exception as e:
        logger.error(f"Error updating data for {data_name}: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()