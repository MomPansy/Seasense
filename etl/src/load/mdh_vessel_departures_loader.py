from load import MdhDataLoader

class MdhVesselDeparturesLoader(MdhDataLoader):
    def __init__(self, conn, data_name):
        super().__init__(
            conn, data_name,
            ['vessel_name', 'callsign', 'imo', 'flag', 'departed_time'],
            ['vessel_name', 'imo', 'departed_time']
        )