import { Column, Table } from "@tanstack/react-table";
import { format } from "date-fns";
import { FilterIcon } from "lucide-react";
import * as React from "react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface DataTableDateFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  table?: Table<TData>;
  title?: string;
}

export function DataTableDateFilter<TData, TValue>({
  column,
  table,
  title,
}: DataTableDateFilterProps<TData, TValue>) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Get all date values from the table to determine min/max
  const { minDate, maxDate } = React.useMemo(() => {
    if (!table) return { minDate: 0, maxDate: 0 };

    const dates = table
      .getCoreRowModel()
      .rows.map((row) => {
        const value = row.getValue(column?.id ?? "");
        if (typeof value === "string") {
          const timestamp = new Date(value).getTime();
          return isNaN(timestamp) ? null : timestamp;
        }
        return null;
      })
      .filter((d): d is number => d !== null);

    if (dates.length === 0) return { minDate: 0, maxDate: 0 };

    return {
      minDate: Math.min(...dates),
      maxDate: Math.max(...dates),
    };
  }, [table, column?.id]);

  const filterValue = column?.getFilterValue() as
    | { start: number; end: number }
    | undefined;

  const [startValue, setStartValue] = React.useState(minDate);
  const [endValue, setEndValue] = React.useState(maxDate);

  React.useEffect(() => {
    if (filterValue) {
      setStartValue(filterValue.start);
      setEndValue(filterValue.end);
    } else {
      setStartValue(minDate);
      setEndValue(maxDate);
    }
  }, [filterValue, minDate, maxDate]);

  const isFiltered = !!filterValue;

  const handleApply = () => {
    if (startValue !== minDate || endValue !== maxDate) {
      column?.setFilterValue({ start: startValue, end: endValue });
    } else {
      column?.setFilterValue(undefined);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setStartValue(minDate);
    setEndValue(maxDate);
    column?.setFilterValue(undefined);
    setIsOpen(false);
  };

  if (!column || minDate === 0 || maxDate === 0) {
    return null;
  }

  const range = maxDate - minDate;
  const startPercent = ((startValue - minDate) / range) * 100;
  const endPercent = ((endValue - minDate) / range) * 100;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none hover:bg-accent hover:text-accent-foreground h-8 size-8 ${isFiltered ? "text-primary" : ""}`}
      >
        <FilterIcon className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        className="w-96 bg-white"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Filter by {title}</h4>
            <p className="text-sm text-muted-foreground">
              Drag the sliders to select a date range
            </p>
          </div>

          <div className="space-y-6 pt-2">
            {/* Range slider */}
            <div className="relative h-2">
              {/* Track */}
              <div className="absolute w-full h-2 bg-gray-200 rounded-full" />
              {/* Active range */}
              <div
                className="absolute h-2 bg-primary rounded-full"
                style={{
                  left: `${startPercent}%`,
                  right: `${100 - endPercent}%`,
                }}
              />
              {/* Start handle */}
              <input
                type="range"
                min={minDate}
                max={maxDate}
                value={startValue}
                onChange={(e) => {
                  const newStart = Number(e.target.value);
                  setStartValue(Math.min(newStart, endValue));
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                style={{
                  zIndex:
                    startValue > maxDate - (maxDate - minDate) / 2 ? 5 : 3,
                }}
              />
              {/* End handle */}
              <input
                type="range"
                min={minDate}
                max={maxDate}
                value={endValue}
                onChange={(e) => {
                  const newEnd = Number(e.target.value);
                  setEndValue(Math.max(newEnd, startValue));
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                style={{ zIndex: 4 }}
              />
            </div>

            {/* Date labels */}
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-gray-900">From: </span>
                <span className="font-medium text-gray-900">
                  {format(startValue, "dd/MM/yy HH:mm:ss X")}
                </span>
              </div>
              <div>
                <span className="text-gray-900">To: </span>
                <span className="font-medium text-gray-900">
                  {format(endValue, "dd/MM/yy HH:mm:ss X")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-1 bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
            >
              Clear
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
