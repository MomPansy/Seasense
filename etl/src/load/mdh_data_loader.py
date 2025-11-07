class MdhDataLoader:
    def __init__(self, conn, data_name, column_names_for_insert, record_identifier_columns):
        self.conn = conn
        self.data_name = data_name
        self.column_names_for_insert = column_names_for_insert
        self.record_identifier_columns = record_identifier_columns
    
    def insert_distinct_not_exists(self):
        with self.conn.cursor() as cur:
            cur.execute(
                f"""
                INSERT INTO public.{self.data_name}({', '.join(self.column_names_for_insert)})
                SELECT {', '.join(self.column_names_for_insert)} FROM (
                    SELECT DISTINCT ON ({', '.join(self.record_identifier_columns)}) * FROM staging.{self.data_name}
                ) t2
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM public.{self.data_name} t1
                    WHERE {' AND '.join(f"t1.{col} = t2.{col}" for col in self.record_identifier_columns)}
                )
                ORDER BY {self.record_identifier_columns[-1]} ASC
                """
            )
            return cur.rowcount
        
        
    def load(self):
        num_rows_inserted = self.insert_distinct_not_exists()
        return num_rows_inserted