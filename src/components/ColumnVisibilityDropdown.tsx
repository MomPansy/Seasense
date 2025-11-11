import { Table } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface ColumnVisibilityDropdownProps<TData> {
  table: Table<TData>;
  columnLabels: Record<string, string>;
}

export function ColumnVisibilityDropdown<TData>({
  table,
  columnLabels,
}: ColumnVisibilityDropdownProps<TData>) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pendingColumnVisibility, setPendingColumnVisibility] = useState<
    Record<string, boolean>
  >({});

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            // Initialize pending state with current visibility
            const current: Record<string, boolean> = {};
            table.getAllLeafColumns().forEach((col) => {
              current[col.id] = col.getIsVisible();
            });
            setPendingColumnVisibility(current);
            setIsDropdownOpen(true);
          }}
        >
          <Eye className="h-4 w-4" />
          View Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-white border-gray-200"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-64 overflow-y-auto px-1">
          {table
            .getAllLeafColumns()
            .filter(
              (column) => column.id !== "select" && column.id in columnLabels,
            )
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="cursor-pointer text-gray-900 hover:bg-gray-100"
                  checked={pendingColumnVisibility[column.id] ?? true}
                  onCheckedChange={(value) =>
                    setPendingColumnVisibility((prev) => ({
                      ...prev,
                      [column.id]: value,
                    }))
                  }
                  onSelect={(e) => e.preventDefault()}
                >
                  {columnLabels[column.id] || column.id}
                </DropdownMenuCheckboxItem>
              );
            })}
        </div>
        <div className="flex items-center justify-end gap-2 px-2 pt-2 border-t border-gray-200">
          <Button
            size="sm"
            onClick={() => {
              // Apply pending changes to actual column visibility
              Object.entries(pendingColumnVisibility).forEach(
                ([columnId, isVisible]) => {
                  const column = table
                    .getAllLeafColumns()
                    .find((col) => col.id === columnId);
                  if (column) {
                    column.toggleVisibility(isVisible);
                  }
                },
              );
              setIsDropdownOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
