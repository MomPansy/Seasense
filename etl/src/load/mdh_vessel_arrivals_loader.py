from etl.src.load import MdhDataLoader

class MdhVesselArrivalsLoader(MdhDataLoader):
    def __init__(self, conn, data_name):
        super().__init__(
            conn, data_name,
            ['vessel_name', 'callsign', 'imo', 'flag', 'arrived_time','location_from', 'location_to'],
            ['vessel_name', 'imo', 'arrived_time']
        )