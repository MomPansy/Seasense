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
import { useState, useMemo, useDeferredValue, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { mapStatCode } from "@/lib/utils";
import { downloadFile, exportVesselScores } from "@/utils/exportData";
import { ColumnVisibilityDropdown } from "./ColumnVisibilityDropdown";
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

  // Restore state from sessionStorage
  const getInitialState = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = sessionStorage.getItem(`vesselTable_${key}`);
      return saved ? (JSON.parse(saved) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [sorting, setSorting] = useState<SortingState>(
    getInitialState("sorting", [
      { id: "vesselArrivalDetails_dueToArriveTime", desc: false },
    ]),
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    getInitialState("columnFilters", []),
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    getInitialState("columnVisibility", { score_score: false }),
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchQuery, setSearchQuery] = useState(
    getInitialState("searchQuery", ""),
  );
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [excludeScore100, setExcludeScore100] = useState(
    getInitialState("excludeScore100", true),
  );
  const [includeOnlyTankers, setIncludeOnlyTankers] = useState(
    getInitialState("includeOnlyTankers", false),
  );
  const [activePreset, setActivePreset] = useState<
    "all" | "tankers" | "imo_issues" | null
  >(getInitialState("activePreset", "all"));

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem("vesselTable_sorting", JSON.stringify(sorting));
  }, [sorting]);

  useEffect(() => {
    sessionStorage.setItem(
      "vesselTable_columnFilters",
      JSON.stringify(columnFilters),
    );
  }, [columnFilters]);

  useEffect(() => {
    sessionStorage.setItem(
      "vesselTable_columnVisibility",
      JSON.stringify(columnVisibility),
    );
  }, [columnVisibility]);

  useEffect(() => {
    sessionStorage.setItem(
      "vesselTable_searchQuery",
      JSON.stringify(searchQuery),
    );
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem(
      "vesselTable_excludeScore100",
      JSON.stringify(excludeScore100),
    );
  }, [excludeScore100]);

  useEffect(() => {
    sessionStorage.setItem(
      "vesselTable_includeOnlyTankers",
      JSON.stringify(includeOnlyTankers),
    );
  }, [includeOnlyTankers]);

  useEffect(() => {
    sessionStorage.setItem(
      "vesselTable_activePreset",
      JSON.stringify(activePreset),
    );
  }, [activePreset]);

  // Filter vessels based on search query and preset exclusions
  const filteredVessels = useMemo(() => {
    let filtered = vessels;

    // Apply exclude score 100 filter if active
    if (excludeScore100) {
      filtered = filtered.filter((vessel) => vessel.score.score !== 100);
    }

    // Apply tanker-only filter if active
    if (includeOnlyTankers) {
      filtered = filtered.filter((vessel) => {
        const vesselType = mapStatCode(vessel.vesselDetails?.statCode5);
        return [
          "Chemical Tanker",
          "LNG Tanker",
          "LPG Tanker",
          "Tanker",
        ].includes(vesselType);
      });
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
      const callSign = (vessel.vesselDetails?.callSign ?? "").toLowerCase();
      const flagName = (vessel.vesselDetails?.flagName ?? "").toLowerCase();
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
        callSign.includes(query) ||
        flagName.includes(query) ||
        groupBeneficialOwner.includes(query) ||
        groupBeneficialOwnerCountry.includes(query) ||
        registeredOwner.includes(query) ||
        registeredOwnerCountry.includes(query) ||
        operator.includes(query) ||
        operatorCountry.includes(query)
      );
    });
  }, [vessels, deferredSearchQuery, excludeScore100, includeOnlyTankers]);

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
  const baseColumnLabels: Record<string, string> = {
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

  // Conditionally set columns to display in the visibility dropdown based on the view
  const columnLabels = useMemo(() => {
    switch (activePreset) {
      case "all":
      case "imo_issues":
        return Object.fromEntries(
          Object.entries(baseColumnLabels).filter(
            ([key]) => key !== "score_score",
          ),
        );
      default:
        return { ...baseColumnLabels };
    }
  }, [activePreset]);

  // Preset filter handlers
  const applyAllVesselsPreset = () => {
    setColumnFilters([]);
    setColumnVisibility((prev) => ({ ...prev, score_score: false }));
    setExcludeScore100(true);
    setIncludeOnlyTankers(false);
    setActivePreset("all");
  };

  const applyTankersPreset = () => {
    setExcludeScore100(false);
    setIncludeOnlyTankers(true);
    setColumnFilters([]);
    setColumnVisibility((prev) => ({ ...prev, score_score: true }));
    setActivePreset("tankers");
  };

  const applyIMOIssuesPreset = () => {
    setColumnFilters([{ id: "score_score", value: ["100"] }]);
    setColumnVisibility((prev) => ({ ...prev, score_score: false }));
    setExcludeScore100(false);
    setIncludeOnlyTankers(false);
    setActivePreset("imo_issues");
  };

  const getPresetButtonClassName = (preset: typeof activePreset) => {
    return activePreset === preset
      ? "bg-[#0f796f] hover:bg-[#0f796f]/90 text-white"
      : "";
  };

  // Last updated timestamp calculation
  const lastUpdated = useMemo(() => {
    const timestamps = vessels
      .map((vessel) => vessel.vesselArrivalDetails.fetchedAt)
      .filter((timestamp): timestamp is string => timestamp !== null)
      .map((timestamp) => new Date(timestamp).getTime());

    if (timestamps.length === 0) return null;

    const maxDate = new Date(Math.max(...timestamps));
    const pad = (num: number) => String(num).padStart(2, "0");

    return `${pad(maxDate.getHours())}:${pad(maxDate.getMinutes())}, ${pad(maxDate.getDate())}/${pad(maxDate.getMonth() + 1)}/${String(maxDate.getFullYear()).slice(-2)}`;
  }, [vessels]);

  const handleExport = async () => {
    toast.success("Exporting vessel details to Excel");
    const buffer = await exportVesselScores(table);
    downloadFile({
      data: buffer,
      dataType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: "scores.xlsx",
    });
  };

  return (
    <Stack direction="column" gap="4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={activePreset === "all" ? "default" : "outline"}
            onClick={applyAllVesselsPreset}
            className={getPresetButtonClassName("all")}
          >
            All Ships
          </Button>
          <Button
            variant={activePreset === "tankers" ? "default" : "outline"}
            onClick={applyTankersPreset}
            className={getPresetButtonClassName("tankers")}
          >
            Tankers
          </Button>
          <Button
            variant={activePreset === "imo_issues" ? "default" : "outline"}
            onClick={applyIMOIssuesPreset}
            className={getPresetButtonClassName("imo_issues")}
          >
            IMO Issues
          </Button>
        </div>
        <div className="w-full max-w-md">
          <SearchBar onSearch={setSearchQuery} />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} records
          {activePreset === "imo_issues" &&
            " (MDH IMO is missing, unverified in IHS, or conflicts with stored IHS data)"}
        </span>
        <div className="flex gap-2 items-center">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Last Updated: {lastUpdated}
            </span>
          )}
          <ColumnVisibilityDropdown table={table} columnLabels={columnLabels} />
          {activePreset === "tankers" && (
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Download Vessel Scoring
            </Button>
          )}
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
