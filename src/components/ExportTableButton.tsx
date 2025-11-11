import { Table } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { Button } from "./ui/button";

interface ExportTableButtonProps<TData> {
  table: Table<TData>;
  columnLabels: Record<string, string>;
  filename?: string;
}

export function ExportTableButton<TData>({
  table,
  columnLabels,
  filename = "table-export.csv",
}: ExportTableButtonProps<TData>) {
  const exportToCSV = () => {
    // Get visible columns (excluding select column)
    const visibleColumns = table
      .getAllLeafColumns()
      .filter((col) => col.getIsVisible() && col.id !== "select");

    // Get filtered and sorted rows (respects current sorting and filtering)
    const rows =
      table.getSelectedRowModel().rows.length > 0
        ? table.getSelectedRowModel().rows
        : table.getSortedRowModel().rows;

    // Create CSV header using user-friendly labels
    const headers = visibleColumns
      .map((col) => {
        // Use columnLabels for user-friendly names
        return columnLabels[col.id] || col.id;
      })
      .map((h) => `"${h}"`)
      .join(",");

    // Create CSV rows
    const csvRows = rows.map((row) => {
      return visibleColumns
        .map((col) => {
          // Get the displayed value by rendering the cell
          const cell = row.getAllCells().find((c) => c.column.id === col.id);
          if (!cell) return '""';

          // Check if column has a custom export formatter
          const meta = col.columnDef.meta as
            | { exportFormatter?: (row: TData) => string }
            | undefined;
          if (meta?.exportFormatter) {
            const formattedValue = meta.exportFormatter(row.original);
            const cellStr = formattedValue.replace(/"/g, '""');
            return `"${cellStr}"`;
          }

          const value = cell.getValue();

          // Handle different cell value types
          if (value === null || value === undefined) {
            return '""';
          }

          // Convert value to string based on type
          let cellStr: string;
          if (typeof value === "object") {
            // Handle objects and arrays
            cellStr = JSON.stringify(value);
          } else if (typeof value === "string") {
            cellStr = value;
          } else {
            // For numbers, booleans, and other primitives
            cellStr = String(value as string | number | boolean);
          }

          // Escape quotes
          cellStr = cellStr.replace(/"/g, '""');
          return `"${cellStr}"`;
        })
        .join(",");
    });

    // Combine headers and rows
    const csv = [headers, ...csvRows].join("\n");

    // Create blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button variant="outline" className="gap-2" onClick={exportToCSV}>
      <Download className="h-4 w-4" />
      Export Table
    </Button>
  );
}
