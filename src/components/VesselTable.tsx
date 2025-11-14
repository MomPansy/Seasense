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
import { Download, X } from "lucide-react";
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

  // Clear state on page refresh BEFORE state initialization
  // This must run synchronously before useState hooks
  const isPageRefresh = !sessionStorage.getItem("vesselTable_isNavigating");
  if (isPageRefresh) {
    // Clear all vesselTable state on fresh page load
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.startsWith("vesselTable_")) {
        sessionStorage.removeItem(key);
      }
    });
  }

  // Set up navigation tracking
  useEffect(() => {
    // Set flag to indicate we're now in navigation mode
    sessionStorage.setItem("vesselTable_isNavigating", "true");

    // Clear the navigation flag when the user actually refreshes or closes the tab
    const handleBeforeUnload = () => {
      sessionStorage.removeItem("vesselTable_isNavigating");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

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
    getInitialState("columnVisibility", {
      score_level: false,
      score_score: false,
    }),
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchQuery, setSearchQuery] = useState(
    getInitialState("searchQuery", ""),
  );
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [excludeScore100, setExcludeScore100] = useState(
    getInitialState("excludeScore100", false),
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
    score_level: "Threat Level",
    score_score: "Score",
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
            ([key]) => key !== "score_score" && key !== "score_level",
          ),
        );
      default:
        return { ...baseColumnLabels };
    }
  }, [activePreset]);

  // Preset filter handlers
  const applyAllVesselsPreset = () => {
    setColumnFilters([]);
    setColumnVisibility((prev) => ({
      ...prev,
      score_level: false,
      score_score: false,
    }));
    setExcludeScore100(false);
    setIncludeOnlyTankers(false);
    setActivePreset("all");
  };

  const applyTankersPreset = () => {
    setExcludeScore100(true);
    setIncludeOnlyTankers(true);
    setColumnFilters([]);
    setColumnVisibility((prev) => ({
      ...prev,
      score_level: true,
      score_score: true,
    }));
    setActivePreset("tankers");
  };

  const applyIMOIssuesPreset = () => {
    setColumnFilters([{ id: "score_score", value: ["100"] }]);
    setColumnVisibility((prev) => ({
      ...prev,
      score_level: false,
      score_score: false,
    }));
    setExcludeScore100(false);
    setIncludeOnlyTankers(false);
    setActivePreset("imo_issues");
  };

  const getPresetButtonClassName = (preset: typeof activePreset) => {
    return activePreset === preset
      ? "bg-[#0f796f] hover:bg-[#0f796f]/90 text-white"
      : "";
  };

  const handleExport = async () => {
    toast.success("Exporting vessel details to Excel");
    const buffer = await exportVesselScores(table);

    // Generate datetime stamp in YYYYMMDD_HHMMSS format (Singapore time, UTC+8)
    const now = new Date();
    const sgTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const timestamp = sgTime
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "_")
      .slice(0, 15);

    downloadFile({
      data: buffer,
      dataType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `scores_export_${timestamp}.xlsx`,
    });
  };

  const handleClearAllFilters = () => {
    setColumnFilters([]);
    setSearchQuery("");
    setExcludeScore100(false);
    setIncludeOnlyTankers(false);
    setActivePreset("all");
    setSorting([{ id: "vesselArrivalDetails_dueToArriveTime", desc: false }]);
  };

  // Check if there are any active filters
  const hasActiveFilters =
    columnFilters.length > 0 ||
    searchQuery !== "" ||
    !excludeScore100 ||
    includeOnlyTankers ||
    activePreset !== "all" ||
    (sorting.length > 0 &&
      (sorting[0]?.id !== "vesselArrivalDetails_dueToArriveTime" ||
        sorting[0]?.desc));

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
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="IMO Number, Vessel Details, Callsign, or Ownership Details"
            value={searchQuery}
          />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} records
          {activePreset === "imo_issues" &&
            " (MDH IMO is missing, unverified in IHS, or conflicts with stored IHS data)"}
        </span>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleClearAllFilters}
            disabled={!hasActiveFilters}
          >
            <X className="h-4 w-4" />
            Clear All Filters
          </Button>
          <ColumnVisibilityDropdown table={table} columnLabels={columnLabels} />
          <ExportTableButton table={table} columnLabels={columnLabels} />
          {activePreset === "tankers" && (
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export Scores
            </Button>
          )}
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
