import pytz
from datetime import datetime
from etl.src.transform import MdhDataTransformer
from loguru import logger

class VesselsDueToArriveTransformer(MdhDataTransformer):
    def __init__(self, conn, data_name, location_code_mappings):
        super().__init__(conn, data_name, location_code_mappings)

    def staging_transform_row(self, fetched_at, response_json):
        rows = []
        location_from_transformed_count = 0
        location_to_transformed_count = 0
        logger.debug(f"Transforming {len(response_json)} records...")
        
        if not response_json:
            return rows
        for record in response_json:
            vessel_particulars = record["vesselParticulars"]

            # Convert dueToArrive to GMT+8
            raw_arrival = record.get("duetoArriveTime")
            if raw_arrival:
                naive_ts = datetime.strptime(raw_arrival, "%Y-%m-%d %H:%M:%S")
                arrival_gmt8 = self.tz.localize(naive_ts)
                arrival_utc = arrival_gmt8.astimezone(pytz.UTC)
            else:
                arrival_utc = None
                
            # Convert location names from long form to short form
            location_from = record["locationFrom"]
            if (location_from in self.location_code_mappings):
                location_from = self.location_code_mappings.get(location_from)
                location_from_transformed_count += 1
            location_to = record["locationTo"]
            if (location_to in self.location_code_mappings):
                location_to = self.location_code_mappings.get(location_to)
                location_to_transformed_count += 1
                
            rows.append({
                "vessel_name": vessel_particulars["vesselName"],
                "callsign": vessel_particulars["callSign"],
                "imo": vessel_particulars["imoNumber"],
                "flag": vessel_particulars["flag"],
                "due_to_arrive_time": arrival_utc,
                "location_from": location_from,
                "location_to": location_to,
                "fetched_at": fetched_at,
            })
        
        logger.debug(f"Shortened {location_from_transformed_count} long names to short names for 'location_from'.")
        logger.debug(f"Shortened {location_to_transformed_count} long names to short names for 'location_to'.")
            
        return rows
    