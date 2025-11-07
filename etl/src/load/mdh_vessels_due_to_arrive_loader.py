from load import MdhDataLoader

class MdhVesselsDueToArriveLoader(MdhDataLoader):
    def __init__(self, conn, data_name):
        super().__init__(
            conn, data_name,
            ['vessel_name', 'callsign', 'imo', 'flag', 'due_to_arrive_time', 'location_from', 'location_to', 'fetched_at'],
            ['vessel_name', 'imo', 'due_to_arrive_time']
        )