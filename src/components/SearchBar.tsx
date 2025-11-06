import { Search, ChevronDown, X, Clock } from "lucide-react";
import { useState } from "react";
import { AdvancedSearch } from "./AdvancedSearch";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface RecentlyViewed {
  id: string;
  name: string;
  type: string;
  imo: string;
}

const recentlyViewedShips: RecentlyViewed[] = [
  { id: "1", name: "MAERSK ESSEX", type: "Container Ship", imo: "IMO9876543" },
  { id: "2", name: "OCEAN PRINCESS", type: "Tanker", imo: "IMO9234567" },
  {
    id: "3",
    name: "ATLANTIC VOYAGER",
    type: "Bulk Carrier",
    imo: "IMO9345678",
  },
];

interface VesselFilters {
  vesselName: string;
  vesselType: string;
  imoNumber: string;
  threatScore: string;
  arrivalDateFrom: string;
  arrivalDateTo: string;
  lastArrivalFrom: string;
  lastArrivalTo: string;
  lastPorts: string;
}

interface SearchBarProps {
  onSearch: (query: string) => void;
  onAdvancedSearch: (filters: VesselFilters) => void;
}

export function SearchBar({ onSearch, onAdvancedSearch }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by Vessel Name, Vessel Type, or IMO Number..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowRecent(true)}
            onBlur={() => setTimeout(() => setShowRecent(false), 200)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}

          {showRecent && !searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50">
              <div className="p-2">
                <div className="flex items-center gap-2 px-2 py-1 text-muted-foreground caption">
                  <Clock className="h-4 w-4" />
                  <span>Recently Viewed</span>
                </div>
                {recentlyViewedShips.map((ship) => (
                  <button
                    key={ship.id}
                    onClick={() => handleSearch(ship.name)}
                    className="w-full text-left px-2 py-2 hover:bg-muted rounded-sm"
                  >
                    <div className="body-small">{ship.name}</div>
                    <div className="caption text-muted-foreground">
                      {ship.type} • {ship.imo}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              Advanced Search
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[600px]" align="end">
            <AdvancedSearch
              onSearch={(filters) => {
                onAdvancedSearch(filters);
                setShowAdvanced(false);
              }}
              onClose={() => setShowAdvanced(false)}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
