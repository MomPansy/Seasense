import { ArrowUpDown, Filter, Download, Eye } from "lucide-react";
import { useState, useMemo, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { ColumnVisibilityModal } from "./ColumnVisibilityModal";
import { ThreatBadge } from "./ThreatBadge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "./ui/dropdown-menu";
import { WatchlistModal } from "./WatchlistModal";

export interface Vessel {
  id: string;
  name: string;
  type: string;
  imo: string;
  callSign: string;
  locationFrom: string;
  locationTo: string;
  threatLevel: number;
  threatPercentage: number;
  arrivalTime: Date;
  lastArrivalTime: Date;
}

interface VesselTableProps {
  vessels: Vessel[];
  onRefresh: () => void;
  onVesselClick: (vesselId: string) => void;
}

type SortField =
  | "name"
  | "type"
  | "imo"
  | "callSign"
  | "locationFrom"
  | "locationTo"
  | "threatLevel"
  | "arrivalTime"
  | "lastArrivalTime";
type SortDirection = "asc" | "desc";

interface ColumnVisibility {
  name: boolean;
  type: boolean;
  imo: boolean;
  threatLevel: boolean;
  callSign: boolean;
  locationFrom: boolean;
  locationTo: boolean;
  arrivalTime: boolean;
  lastArrivalTime: boolean;
}

export function VesselTable({ vessels, onVesselClick }: VesselTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("arrivalTime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [threatFilter, setThreatFilter] = useState<Set<number>>(new Set());
  const [currentView, setCurrentView] = useState<"all" | "watchlist">("all");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    name: true,
    type: true,
    imo: true,
    threatLevel: true,
    callSign: true,
    locationFrom: true,
    locationTo: true,
    arrivalTime: true,
    lastArrivalTime: true,
  });
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);

  useEffect(() => {
    setLastUpdated(new Date());
  }, [vessels]);

  const vesselTypes = [
    "Chemical Tankers",
    "LNG Tankers",
    "LPG Tankers",
    "Other Tankers",
    "Bulk Carriers",
    "Container",
    "General Cargo",
    "Other Dry Cargo",
    "Passenger",
    "Refrigerated Cargo",
    "Ro-Ro Cargo",
    "Other Non-Merchant Ships",
  ];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedAndFilteredVessels = useMemo(() => {
    let filtered = [...vessels];

    // Apply filters
    if (typeFilter.size > 0) {
      filtered = filtered.filter((v) => typeFilter.has(v.type));
    }
    if (threatFilter.size > 0) {
      filtered = filtered.filter((v) => threatFilter.has(v.threatLevel));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      // Handle Date sorting
      if (sortField === "arrivalTime" || sortField === "lastArrivalTime") {
        const aTime = (aVal as Date).getTime();
        const bTime = (bVal as Date).getTime();
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }

      // Handle string sorting
      if (typeof aVal === "string" && typeof bVal === "string") {
        const aLower = aVal.toLowerCase();
        const bLower = bVal.toLowerCase();
        if (sortDirection === "asc") {
          return aLower > bLower ? 1 : -1;
        } else {
          return aLower < bLower ? 1 : -1;
        }
      }

      // Handle number sorting
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return filtered;
  }, [vessels, sortField, sortDirection, typeFilter, threatFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedAndFilteredVessels.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedAndFilteredVessels.map((v) => v.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      // eslint-disable-next-line drizzle/enforce-delete-with-where
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleExport = () => {
    const selectedVessels = sortedAndFilteredVessels.filter((v) =>
      selectedIds.has(v.id),
    );
    const dataToExport =
      selectedVessels.length > 0 ? selectedVessels : sortedAndFilteredVessels;

    toast.success(`Exporting ${dataToExport.length} vessel(s) to Excel`);
  };

  const formatDateTime = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatLastUpdated = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `Last Updated: ${hours}:${minutes}, ${day}/${month}/${year}`;
  };

  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: ReactNode;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {children}
      <ArrowUpDown className="h-4 w-4" />
    </button>
  );

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
              onClick={() => setShowWatchlistModal(true)}
            >
              Preset Watchlists
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="body-small text-muted-foreground">
            {formatLastUpdated(lastUpdated)}
          </span>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColumnModal(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Hide/Unhide Columns
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={
                      selectedIds.size === sortedAndFilteredVessels.length &&
                      sortedAndFilteredVessels.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                {columnVisibility.name && (
                  <th className="px-4 py-3 text-left">
                    <SortButton field="name">Vessel Name</SortButton>
                  </th>
                )}
                {columnVisibility.type && (
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <SortButton field="type">Vessel Type</SortButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="hover:text-primary">
                            <Filter className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {vesselTypes.map((type) => (
                            <DropdownMenuCheckboxItem
                              key={type}
                              checked={typeFilter.has(type)}
                              onCheckedChange={(checked) => {
                                const newFilter = new Set(typeFilter);
                                if (checked) {
                                  newFilter.add(type);
                                } else {
                                  // eslint-disable-next-line drizzle/enforce-delete-with-where
                                  newFilter.delete(type);
                                }
                                setTypeFilter(newFilter);
                              }}
                            >
                              {type}
                            </DropdownMenuCheckboxItem>
                          ))}
                          {typeFilter.size > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setTypeFilter(new Set())}
                              >
                                Clear Filters
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </th>
                )}
                {columnVisibility.imo && (
                  <th className="px-4 py-3 text-left">
                    <SortButton field="imo">IMO Number</SortButton>
                  </th>
                )}
                {columnVisibility.threatLevel && (
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <SortButton field="threatLevel">
                        Initial Threat Score
                      </SortButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="hover:text-primary">
                            <Filter className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {[2, 3, 4, 5].map((level) => (
                            <DropdownMenuCheckboxItem
                              key={level}
                              checked={threatFilter.has(level)}
                              onCheckedChange={(checked) => {
                                const newFilter = new Set(threatFilter);
                                if (checked) {
                                  newFilter.add(level);
                                } else {
                                  // eslint-disable-next-line drizzle/enforce-delete-with-where
                                  newFilter.delete(level);
                                }
                                setThreatFilter(newFilter);
                              }}
                            >
                              Level {level}
                            </DropdownMenuCheckboxItem>
                          ))}
                          {threatFilter.size > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setThreatFilter(new Set())}
                              >
                                Clear Filters
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </th>
                )}
                {columnVisibility.callSign && (
                  <th className="px-4 py-3 text-left">
                    <SortButton field="callSign">Call Sign</SortButton>
                  </th>
                )}
                {columnVisibility.locationFrom && (
                  <th className="px-4 py-3 text-left">
                    <SortButton field="locationFrom">Location From</SortButton>
                  </th>
                )}
                {columnVisibility.locationTo && (
                  <th className="px-4 py-3 text-left">
                    <SortButton field="locationTo">Location To</SortButton>
                  </th>
                )}
                {columnVisibility.arrivalTime && (
                  <th className="px-4 py-3 text-left">
                    <SortButton field="arrivalTime">Arrival Time</SortButton>
                  </th>
                )}
                {columnVisibility.lastArrivalTime && (
                  <th className="px-4 py-3 text-left">
                    <SortButton field="lastArrivalTime">
                      Last Arrival
                    </SortButton>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredVessels.map((vessel) => (
                <tr
                  key={vessel.id}
                  className="border-t border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedIds.has(vessel.id)}
                      onCheckedChange={() => toggleSelect(vessel.id)}
                    />
                  </td>
                  {columnVisibility.name && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onVesselClick(vessel.id)}
                        className="text-primary hover:underline body-small text-left"
                      >
                        {vessel.name}
                      </button>
                    </td>
                  )}
                  {columnVisibility.type && (
                    <td className="px-4 py-3 body-small">{vessel.type}</td>
                  )}
                  {columnVisibility.imo && (
                    <td className="px-4 py-3">
                      <a
                        // Link to vessel-specfic page on MarineTraffic
                        href={`https://www.marinetraffic.com/en/ais/details/ships/imo:${vessel.imo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline body-small"
                      >
                        {vessel.imo}
                      </a>
                    </td>
                  )}
                  {columnVisibility.threatLevel && (
                    <td className="px-4 py-3">
                      <ThreatBadge
                        level={vessel.threatLevel}
                        percentage={vessel.threatPercentage}
                      />
                    </td>
                  )}
                  {columnVisibility.callSign && (
                    <td className="px-4 py-3 body-small">{vessel.callSign}</td>
                  )}
                  {columnVisibility.locationFrom && (
                    <td className="px-4 py-3 body-small">
                      {vessel.locationFrom}
                    </td>
                  )}
                  {columnVisibility.locationTo && (
                    <td className="px-4 py-3 body-small">
                      {vessel.locationTo}
                    </td>
                  )}
                  {columnVisibility.arrivalTime && (
                    <td className="px-4 py-3 body-small">
                      {formatDateTime(vessel.arrivalTime)}
                    </td>
                  )}
                  {columnVisibility.lastArrivalTime && (
                    <td className="px-4 py-3 body-small">
                      {formatDateTime(vessel.lastArrivalTime)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-primary/10 px-4 py-2 rounded-md">
          <span className="body-small">
            {selectedIds.size} vessel(s) selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear Selection
          </Button>
        </div>
      )}

      <WatchlistModal
        isOpen={showWatchlistModal}
        onClose={() => setShowWatchlistModal(false)}
        hasSelectedShips={selectedIds.size > 0}
        shipsInWatchlist={false}
      />

      <ColumnVisibilityModal
        isOpen={showColumnModal}
        onClose={() => setShowColumnModal(false)}
        columnVisibility={columnVisibility}
        onToggle={toggleColumnVisibility}
      />
    </div>
  );
}
