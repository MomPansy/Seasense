import { Column } from "@tanstack/react-table";
import { FilterIcon } from "lucide-react";
import * as React from "react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface DataTableDateFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
}

type TimeRangePreset = "within24" | "24to48" | "48to72";

export function DataTableDateFilter<TData, TValue>({
  column,
  title,
}: DataTableDateFilterProps<TData, TValue>) {
  const [isOpen, setIsOpen] = React.useState(false);

  const filterValue = column?.getFilterValue() as
    | { start: number; end: number; preset?: TimeRangePreset }
    | undefined;

  // Local state for pending selection
  const [pendingPreset, setPendingPreset] = React.useState<
    TimeRangePreset | undefined
  >(undefined);

  // Sync pending selection with filter value when opening
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setPendingPreset(filterValue?.preset);
    }
  };

  const isFiltered = !!filterValue;

  const handlePresetClick = (preset: TimeRangePreset) => {
    setPendingPreset(preset);
  };

  const handleClear = () => {
    setPendingPreset(undefined);
  };

  const handleApply = () => {
    if (!pendingPreset) {
      column?.setFilterValue(undefined);
      setIsOpen(false);
      return;
    }

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const twentyFourHours = 24 * oneHour;

    let start: number;
    let end: number;

    switch (pendingPreset) {
      case "within24":
        start = now;
        end = now + twentyFourHours;
        break;
      case "24to48":
        start = now + twentyFourHours;
        end = now + 2 * twentyFourHours;
        break;
      case "48to72":
        start = now + 2 * twentyFourHours;
        end = now + 3 * twentyFourHours;
        break;
    }

    column?.setFilterValue({ start, end, preset: pendingPreset });
    setIsOpen(false);
  };

  const handleCancel = () => {
    setPendingPreset(filterValue?.preset);
    setIsOpen(false);
  };

  if (!column) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none hover:bg-accent hover:text-accent-foreground h-8 size-8 ${isFiltered ? "text-primary" : ""}`}
      >
        <FilterIcon className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        className="w-64 bg-white border-gray-200"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">
              {title ?? "Filter"}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!isFiltered}
              className="h-6 px-2 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              Clear
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Select a time range</p>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className={`w-full justify-start bg-white text-gray-900 border-gray-300 hover:bg-[#27867d] hover:text-white ${
                pendingPreset === "within24"
                  ? "bg-[#0f796f] hover:bg-[#27867d] text-white border-[#0f796f]"
                  : ""
              }`}
              onClick={() => handlePresetClick("within24")}
            >
              Within 24hrs
            </Button>
            <Button
              variant="outline"
              className={`w-full justify-start bg-white text-gray-900 border-gray-300 hover:bg-[#27867d] hover:text-white ${
                pendingPreset === "24to48"
                  ? "bg-[#0f796f] hover:bg-[#27867d] text-white border-[#0f796f]"
                  : ""
              }`}
              onClick={() => handlePresetClick("24to48")}
            >
              Between 24-48hrs
            </Button>
            <Button
              variant="outline"
              className={`w-full justify-start bg-white text-gray-900 border-gray-300 hover:bg-[#27867d] hover:text-white ${
                pendingPreset === "48to72"
                  ? "bg-[#0f796f] hover:bg-[#27867d] text-white border-[#0f796f]"
                  : ""
              }`}
              onClick={() => handlePresetClick("48to72")}
            >
              Between 48-72hrs
            </Button>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex-1 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply} className="flex-1">
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
