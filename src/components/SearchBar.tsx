import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "./ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  value?: string;
}

export function SearchBar({ onSearch, value = "" }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(value);

  // Sync internal state with external value when it changes
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch(searchQuery);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    onSearch("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="IMO Number, Vessel Details, Callsign, or Ownership Details"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
