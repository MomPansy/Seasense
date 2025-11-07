import { X, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasSelectedShips: boolean;
  shipsInWatchlist: boolean;
}

const existingWatchlists = [
  "High Risk Vessels",
  "Tanker Watch",
  "Frequent Visitors",
  "Under Investigation",
  "VIP Monitoring",
  "Suspicious Activity",
  "Compliance Review",
];

export function WatchlistModal({
  isOpen,
  onClose,
  hasSelectedShips,
  shipsInWatchlist,
}: WatchlistModalProps) {
  const [currentPage, setCurrentPage] = useState<"main" | "select">("main");
  const [selectedWatchlists, setSelectedWatchlists] = useState<Set<string>>(
    new Set(),
  );

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentPage("main");
    setSelectedWatchlists(new Set());
    onClose();
  };

  const handleDone = () => {
    // Handle the done action
    console.info("Selected watchlists:", Array.from(selectedWatchlists));
    handleClose();
  };

  const toggleWatchlist = (watchlist: string) => {
    const newSelected = new Set(selectedWatchlists);
    if (newSelected.has(watchlist)) {
      // eslint-disable-next-line drizzle/enforce-delete-with-where
      newSelected.delete(watchlist);
    } else {
      newSelected.add(watchlist);
    }
    setSelectedWatchlists(newSelected);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3>
            {currentPage === "main"
              ? "Add Selected Ships to Watchlists"
              : "Select Watchlists"}
          </h3>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentPage === "main" ? (
            <div className="space-y-3">
              <button
                onClick={() => setCurrentPage("select")}
                disabled={!hasSelectedShips}
                className={`w-full text-left p-4 border border-border rounded-md transition-colors ${
                  hasSelectedShips
                    ? "hover:bg-muted cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="body">Add to Other Watchlists</div>
                {!hasSelectedShips && (
                  <div className="caption text-muted-foreground mt-1">
                    Select ships from the table to enable this option
                  </div>
                )}
              </button>

              <button
                disabled={!shipsInWatchlist}
                className={`w-full text-left p-4 border border-border rounded-md transition-colors ${
                  shipsInWatchlist
                    ? "hover:bg-muted cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="body">Remove From This Watchlist</div>
                {!shipsInWatchlist && (
                  <div className="caption text-muted-foreground mt-1">
                    No ships in watchlist
                  </div>
                )}
              </button>

              <button
                disabled={!hasSelectedShips}
                className={`w-full text-left p-4 border border-border rounded-md transition-colors ${
                  hasSelectedShips
                    ? "hover:bg-muted cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="body">Stop Watching</div>
                {!hasSelectedShips && (
                  <div className="caption text-muted-foreground mt-1">
                    Select ships from the table to enable this option
                  </div>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => console.info("Add new watchlist")}
                className="w-full flex items-center gap-2 p-3 border border-border rounded-md hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4 text-primary" />
                <span className="body text-primary">Add New Watchlist</span>
              </button>

              <div className="border-t border-border pt-4">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {existingWatchlists.map((watchlist) => (
                    <label
                      key={watchlist}
                      className="flex items-center gap-3 p-3 rounded-md hover:bg-muted cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedWatchlists.has(watchlist)}
                        onCheckedChange={() => toggleWatchlist(watchlist)}
                      />
                      <span className="body-small">{watchlist}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-border">
          {currentPage === "select" && (
            <Button onClick={handleDone}>Done</Button>
          )}
        </div>
      </div>
    </div>
  );
}
