import pytz
from datetime import datetime
from transform import MdhDataTransformer

class VesselDeparturesTransformer(MdhDataTransformer):
    def __init__(self, conn, data_name):
        super().__init__(conn, data_name)

    def staging_transform_row(self, fetched_at, response_json):
        rows = []
        if not response_json:
            return rows
        for record in response_json:
            vessel_particulars = record["vesselParticulars"]

            # Convert departedTime to GMT+8
            raw_departure = record.get("departedTime")
            if raw_departure:
                naive_ts = datetime.strptime(raw_departure, "%Y-%m-%d %H:%M:%S")
                departure_gmt8 = self.tz.localize(naive_ts)
                departure_utc = departure_gmt8.astimezone(pytz.UTC)
            else:
                departure_utc = None

            rows.append({
                "vessel_name": vessel_particulars["vesselName"],
                "callsign": vessel_particulars["callSign"],
                "imo": vessel_particulars["imoNumber"],
                "flag": vessel_particulars["flag"],
                "departed_time": departure_utc,
                "fetched_at": fetched_at,
            })
        return rows
