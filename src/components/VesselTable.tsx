import { useState } from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import { RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { DataTable } from "./data-table";
import { createColumns, Vessel } from "./vessel-columns";

export type { Vessel } from "./vessel-columns";

interface VesselTableProps {
  vessels: Vessel[];
  onRefresh: () => void;
  onVesselClick: (vesselId: string) => void;
}

export function VesselTable({
  vessels,
  onRefresh,
  onVesselClick,
}: VesselTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [currentView, setCurrentView] = useState<"all" | "watchlist">("all");

  const columns = createColumns(onVesselClick);

  const handleExport = () => {
    const selectedCount = Object.keys(rowSelection).length;
    const dataToExport = selectedCount > 0 ? selectedCount : vessels.length;

    toast.success(`Exporting ${dataToExport} vessel(s) to Excel`);
  };

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={currentView === "all" ? "default" : "outline"}
              onClick={() => setCurrentView("all")}
            >
              All Ships ({vessels.length})
            </Button>
            <Button
              variant={currentView === "watchlist" ? "default" : "outline"}
              onClick={() => setCurrentView("watchlist")}
            >
              Preset Watchlists
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

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

      {selectedCount > 0 && (
        <div className="flex items-center justify-between bg-primary/10 px-4 py-2 rounded-md">
          <span className="text-sm">
            {selectedCount} vessel(s) selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRowSelection({})}
          >
            Clear Selection
          </Button>
        </div>
      )}
    </div>
  );
}
