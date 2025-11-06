import React, { useState, useMemo } from "react";
import { ArrowUpDown, Filter, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { ThreatBadge } from "./ThreatBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "./ui/dropdown-menu";

export interface Vessel {
  id: string;
  name: string;
  type: string;
  imo: string;
  threatLevel: number;
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
  | "threatLevel"
  | "arrivalTime"
  | "lastArrivalTime";
type SortDirection = "asc" | "desc";

export function VesselTable({
  vessels,
  onRefresh,
  onVesselClick,
}: VesselTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("arrivalTime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [threatFilter, setThreatFilter] = useState<Set<number>>(new Set());
  const [currentView, setCurrentView] = useState<"all" | "watchlist">("all");

  const vesselTypes = Array.from(new Set(vessels.map((v) => v.type)));

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
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "arrivalTime" || sortField === "lastArrivalTime") {
        aVal = aVal.getTime();
        bVal = bVal.getTime();
      }

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
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
    console.log("Export data:", dataToExport);
  };

  const formatDateTime = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
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
                <th className="px-4 py-3 text-left">
                  <SortButton field="name">Vessel Name</SortButton>
                </th>
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
                <th className="px-4 py-3 text-left">
                  <SortButton field="imo">IMO Number</SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <SortButton field="threatLevel">
                      Preliminary Threat Score
                    </SortButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="hover:text-primary">
                          <Filter className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <DropdownMenuCheckboxItem
                            key={level}
                            checked={threatFilter.has(level)}
                            onCheckedChange={(checked) => {
                              const newFilter = new Set(threatFilter);
                              if (checked) {
                                newFilter.add(level);
                              } else {
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
                <th className="px-4 py-3 text-left">
                  <SortButton field="arrivalTime">Arrival Time</SortButton>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton field="lastArrivalTime">Last Arrival</SortButton>
                </th>
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
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onVesselClick(vessel.id)}
                      className="text-primary hover:underline body-small text-left"
                    >
                      {vessel.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 body-small">{vessel.type}</td>
                  <td className="px-4 py-3">
                    <a
                      href="https://maritime.ihs.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline body-small"
                    >
                      {vessel.imo}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <ThreatBadge level={vessel.threatLevel} />
                  </td>
                  <td className="px-4 py-3 body-small">
                    {formatDateTime(vessel.arrivalTime)}
                  </td>
                  <td className="px-4 py-3 body-small">
                    {formatDateTime(vessel.lastArrivalTime)}
                  </td>
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
    </div>
  );
}
