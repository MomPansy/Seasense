import { useNavigate } from "@tanstack/react-router";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import { InferResponseType } from "hono/client";
import { useState, useMemo, useDeferredValue } from "react";
import { api } from "@/lib/api";
import { DataTable } from "./data-table";
import { SearchBar } from "./SearchBar";
import { Stack } from "./ui/stack";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { createColumns } from "./vessel-columns";

type ArrivingVesselsResponse = InferResponseType<
  typeof api.vessels.arriving.$post
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
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Filter vessels based on search query
  const filteredVessels = useMemo(() => {
    if (!deferredSearchQuery) return vessels;

    const query = deferredSearchQuery.toLowerCase();
    return vessels.filter((vessel) => {
      const vesselName = (
        vessel.vesselArrivalDetails.vesselName ?? ""
      ).toLowerCase();
      const vesselType = (
        vessel.vesselDetails?.shiptypeLevel5 ?? ""
      ).toLowerCase();
      const imo = (vessel.vesselArrivalDetails.imo ?? "").toLowerCase();

      return (
        vesselName.includes(query) ||
        vesselType.includes(query) ||
        imo.includes(query)
      );
    });
  }, [vessels, deferredSearchQuery]);

  const columns = createColumns(navigate);

  return (
    <Stack direction="column" gap="4">
      <div className="flex justify-end">
        <div className="w-full max-w-md">
          <SearchBar onSearch={setSearchQuery} />
        </div>
      </div>
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
            data={filteredVessels}
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
