import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

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

interface ColumnVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnVisibility: ColumnVisibility;
  onToggle: (column: keyof ColumnVisibility) => void;
}

const columnLabels: Record<keyof ColumnVisibility, string> = {
  name: "Vessel Name",
  type: "Vessel Type",
  imo: "IMO Number",
  threatLevel: "Initial Threat Score",
  callSign: "Call Sign",
  locationFrom: "Location From",
  locationTo: "Location To",
  arrivalTime: "Arrival Time",
  lastArrivalTime: "Last Arrival Time",
};

export function ColumnVisibilityModal({
  isOpen,
  onClose,
  columnVisibility,
  onToggle,
}: ColumnVisibilityModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3>Hide/Unhide Columns</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {(Object.keys(columnVisibility) as (keyof ColumnVisibility)[]).map(
              (column) => (
                <label
                  key={column}
                  className="flex items-center gap-3 p-3 rounded-md hover:bg-muted cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={columnVisibility[column]}
                    onCheckedChange={() => onToggle(column)}
                  />
                  <span className="body-small">{columnLabels[column]}</span>
                </label>
              ),
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-border">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}
