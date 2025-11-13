import { Column } from "@tanstack/react-table";
import { FilterIcon } from "lucide-react";
import * as React from "react";
import { Button } from "src/components/ui/button";
import { Checkbox } from "src/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "src/components/ui/popover";

interface DataTableColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
  title?: string;
}

export function DataTableColumnFilter<TData, TValue>({
  column,
  title,
}: DataTableColumnFilterProps<TData, TValue>) {
  const facetedUniqueValues = column.getFacetedUniqueValues();
  const filterValue = (column.getFilterValue() as string[] | undefined) ?? [];

  // Local state for pending selections
  const [pendingSelection, setPendingSelection] = React.useState<string[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  // Sync pending selection with filter value when opening
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setPendingSelection(filterValue);
    }
  };

  // Convert faceted values to sorted array
  const uniqueValues = React.useMemo(() => {
    const values = Array.from(facetedUniqueValues.keys())
      .filter((value) => value !== null && value !== undefined)
      .map((value) => String(value))
      .sort();
    return values;
  }, [facetedUniqueValues]);

  const handleToggle = (value: string) => {
    let newSelection: string[];

    if (pendingSelection.includes(value)) {
      newSelection = pendingSelection.filter((v) => v !== value);
    } else {
      newSelection = [...pendingSelection, value];
    }

    setPendingSelection(newSelection);
  };

  const handleSelectAll = () => {
    if (pendingSelection.length === uniqueValues.length) {
      setPendingSelection([]);
    } else {
      setPendingSelection(uniqueValues);
    }
  };

  const handleClear = () => {
    setPendingSelection([]);
  };

  const handleApply = () => {
    column.setFilterValue(
      pendingSelection.length > 0 ? pendingSelection : undefined,
    );
    setIsOpen(false);
  };

  const handleCancel = () => {
    setPendingSelection(filterValue);
    setIsOpen(false);
  };

  if (uniqueValues.length === 0) {
    return null;
  }

  const isFiltered = filterValue.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none hover:bg-accent hover:text-accent-foreground h-8 size-8 ${isFiltered ? "text-blue-600" : ""}`}
      >
        {isFiltered ? (
          <FilterIcon className="size-3.5 fill-current" />
        ) : (
          <FilterIcon className="size-3.5" />
        )}
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

          <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
            <Checkbox
              id="select-all"
              checked={
                pendingSelection.length === uniqueValues.length &&
                uniqueValues.length > 0
              }
              onCheckedChange={handleSelectAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer text-gray-900"
            >
              Select All ({uniqueValues.length})
            </label>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {uniqueValues.map((value) => {
              const isChecked = pendingSelection.includes(value);

              return (
                <div
                  key={value}
                  className="flex items-center space-x-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    id={`filter-${value}`}
                    checked={isChecked}
                    onCheckedChange={() => handleToggle(value)}
                  />
                  <label
                    htmlFor={`filter-${value}`}
                    className="text-sm flex-1 cursor-pointer truncate text-gray-900"
                    title={value}
                  >
                    {value}
                  </label>
                </div>
              );
            })}
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
