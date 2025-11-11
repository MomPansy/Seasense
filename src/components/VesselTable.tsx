import { useNavigate } from "@tanstack/react-router";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from "@tanstack/react-table";
import { InferResponseType } from "hono/client";
import { Download } from "lucide-react";
import { useState, useMemo, useDeferredValue } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { mapStatCode } from "@/lib/utils";
import { ColumnVisibilityDropdown } from "./ColumnVisibilityDropdown";
import { downloadFile, exportVesselScores } from "@/utils/exportData";
import { DataTable } from "./data-table";
import { ExportTableButton } from "./ExportTableButton";
import { SearchBar } from "./SearchBar";
import { Button } from "./ui/button";
import { Stack } from "./ui/stack";
import { createColumns } from "./vessel-columns";

export type ArrivingVesselsResponse = InferResponseType<
  typeof api.vessels.arriving.$post
>;

interface VesselTableProps {
  vessels: ArrivingVesselsResponse;
}

export function VesselTable({ vessels }: VesselTableProps) {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    score_score: false,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [excludeScore100, setExcludeScore100] = useState(true);
  const [activePreset, setActivePreset] = useState<
    "all" | "interest" | "suspicious" | null
  >("all");

  // Filter vessels based on search query and preset exclusions
  const filteredVessels = useMemo(() => {
    let filtered = vessels;

    // Apply exclude score 100 filter if active
    if (excludeScore100) {
      filtered = filtered.filter((vessel) => vessel.score.score !== 100);
    }

    // Apply search query filter
    if (!deferredSearchQuery) return filtered;

    const query = deferredSearchQuery.toLowerCase();
    return filtered.filter((vessel) => {
      const vesselName = (
        vessel.vesselArrivalDetails.vesselName ?? ""
      ).toLowerCase();
      const vesselType = mapStatCode(
        vessel.vesselDetails?.statCode5,
      ).toLowerCase();
      const imo = (vessel.vesselArrivalDetails.imo ?? "").toLowerCase();
      const groupBeneficialOwner = (
        vessel.vesselDetails?.groupBeneficialOwner ?? ""
      ).toLowerCase();
      const groupBeneficialOwnerCountry = (
        vessel.vesselDetails?.groupBeneficialOwnerCountryOfRegistration ?? ""
      ).toLowerCase();
      const registeredOwner = (
        vessel.vesselDetails?.registeredOwner ?? ""
      ).toLowerCase();
      const registeredOwnerCountry = (
        vessel.vesselDetails?.registeredOwnerCountryOfRegistration ?? ""
      ).toLowerCase();
      const operator = (vessel.vesselDetails?.operator ?? "").toLowerCase();
      const operatorCountry = (
        vessel.vesselDetails?.operatorCountryOfRegistration ?? ""
      ).toLowerCase();

      return (
        vesselName.includes(query) ||
        vesselType.includes(query) ||
        imo.includes(query) ||
        groupBeneficialOwner.includes(query) ||
        groupBeneficialOwnerCountry.includes(query) ||
        registeredOwner.includes(query) ||
        registeredOwnerCountry.includes(query) ||
        operator.includes(query) ||
        operatorCountry.includes(query)
      );
    });
  }, [vessels, deferredSearchQuery, excludeScore100]);

  const columns = useMemo(() => createColumns(navigate), [navigate]);

  const table = useReactTable({
    data: filteredVessels,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Column labels for the visibility dropdown - match table headers
  const columnLabels: Record<string, string> = {
    vesselArrivalDetails_imo: "IMO Number",
    vesselArrivalDetails_vesselName: "Vessel Name",
    vesselArrivalDetails_callsign: "Call Sign",
    vesselDetails_statCode5: "Vessel Type",
    vesselDetails_flagName: "Flag",
    score_score: "Initial Threat Score",
    vesselArrivalDetails_locationFrom: "From",
    vesselArrivalDetails_locationTo: "To",
    vesselArrivalDetails_dueToArriveTime: "Arrival Time",
  };

  // Preset filter handlers
  const applyAllVesselsPreset = () => {
    setColumnFilters([]);
    setColumnVisibility((prev) => ({ ...prev, score_score: false }));
    setExcludeScore100(true);
    setActivePreset("all");
  };

  const applyVesselsOfInterestPreset = () => {
    setExcludeScore100(false);
    setColumnFilters([
      {
        id: "vesselDetails_statCode5",
        value: ["Chemical Tanker", "LNG Tanker", "LPG Tanker", "Tanker"],
      },
    ]);
    setColumnVisibility((prev) => ({ ...prev, score_score: true }));
    setActivePreset("interest");
  };

  const applySuspiciousPreset = () => {
    setColumnFilters([{ id: "score_score", value: ["100"] }]);
    setColumnVisibility((prev) => ({ ...prev, score_score: false }));
    setExcludeScore100(false);
    setActivePreset("suspicious");
  };

  const getPresetButtonClassName = (preset: typeof activePreset) => {
    return activePreset === preset
      ? "bg-[#0f796f] hover:bg-[#0f796f]/90 text-white"
      : "";
  };
  const handleExport = async () => {
    toast.success("Exporting vessel details to Excel");
    const buffer = await exportVesselScores(filteredVessels);
    downloadFile({
      data: buffer,
      dataType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: "scores.xlsx",
    });
  };

  return (
    <Stack direction="column" gap="4">
      <div className="flex items-center justify-end">
        <div className="w-full max-w-md">
          <SearchBar onSearch={setSearchQuery} />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={activePreset === "all" ? "default" : "outline"}
            onClick={applyAllVesselsPreset}
            className={getPresetButtonClassName("all")}
          >
            All Vessels
          </Button>
          <Button
            variant={activePreset === "interest" ? "default" : "outline"}
            onClick={applyVesselsOfInterestPreset}
            className={getPresetButtonClassName("interest")}
          >
            Vessels of Interest
          </Button>
          <Button
            variant={activePreset === "suspicious" ? "default" : "outline"}
            onClick={applySuspiciousPreset}
            className={getPresetButtonClassName("suspicious")}
          >
            Suspicious
          </Button>
        </div>
        <div className="flex gap-2">
          <ColumnVisibilityDropdown table={table} columnLabels={columnLabels} />
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Download Vessel Scoring
          </Button>
          <ExportTableButton table={table} columnLabels={columnLabels} />
        </div>
      </div>
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
    </Stack>
  );
}
