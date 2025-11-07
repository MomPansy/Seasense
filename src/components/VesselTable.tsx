import { useNavigate } from "@tanstack/react-router";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import { InferResponseType } from "hono/client";
import { useState } from "react";
import { api } from "@/lib/api";
import { DataTable } from "./data-table";
import { Stack } from "./ui/stack";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { createColumns } from "./vessel-columns";

type ArrivingVesselsResponse = InferResponseType<
  typeof api.vessels.arriving.$get
>;

interface VesselTableProps {
  vessels: ArrivingVesselsResponse;
}

export function VesselTable({ vessels }: VesselTableProps) {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = createColumns(navigate);

  return (
    <Stack direction="column" gap="4">
      <Tabs defaultValue="Vessel Scoring & Threat Evaluation">
        <TabsList>
          <TabsTrigger value="Vessel Scoring & Threat Evaluation">
            Vessel Scoring & Threat Evaluation
          </TabsTrigger>
          <TabsTrigger value="Vessel Risk Profiling">
            Vessel Risk Profiling
          </TabsTrigger>
        </TabsList>
        <TabsContent value="Vessel Scoring & Threat Evaluation">
          <DataTable
            columns={columns}
            data={vessels}
            sorting={sorting}
            setSorting={setSorting}
            columnFilters={columnFilters}
            setColumnFilters={setColumnFilters}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
          />
        </TabsContent>
      </Tabs>
    </Stack>
  );
}
