import pytz
from datetime import datetime
from etl.src.transform import MdhDataTransformer

class VesselsDueToArriveTransformer(MdhDataTransformer):
    def __init__(self, conn, data_name):
        super().__init__(conn, data_name)

    def staging_transform_row(self, fetched_at, response_json):
        rows = []
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

            rows.append({
                "vessel_name": vessel_particulars["vesselName"],
                "callsign": vessel_particulars["callSign"],
                "imo": vessel_particulars["imoNumber"],
                "flag": vessel_particulars["flag"],
                "due_to_arrive_time": raw_arrival,
                "location_from": record["locationFrom"],
                "location_to": record["locationTo"],
                "fetched_at": fetched_at,
            })
        return rows
    