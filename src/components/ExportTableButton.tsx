import { Table } from "@tanstack/react-table";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "./ui/button";

interface ExportTableButtonProps<TData> {
  table: Table<TData>;
  columnLabels: Record<string, string>;
  filename?: string;
}

export function ExportTableButton<TData>({
  table,
  columnLabels,
  filename = "table_export.xlsx",
}: ExportTableButtonProps<TData>) {
  const exportToXLSX = () => {
    // Generate datetime stamp in YYYYMMDD_HHMMSS format (Singapore time, UTC+8)
    const now = new Date();
    const sgTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const timestamp = sgTime
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "_")
      .slice(0, 15);

    // Insert timestamp before file extension
    const finalFilename = filename.replace(/\.xlsx$/, `_${timestamp}.xlsx`);

    // Get visible columns (excluding select column)
    const visibleColumns = table
      .getAllLeafColumns()
      .filter((col) => col.getIsVisible() && col.id !== "select");

    // Get filtered and sorted rows (respects current sorting and filtering)
    const rows =
      table.getSelectedRowModel().rows.length > 0
        ? table.getSelectedRowModel().rows
        : table.getSortedRowModel().rows;

    // Create header row using user-friendly labels
    const headers = visibleColumns.map((col) => {
      // Use columnLabels for user-friendly names
      return columnLabels[col.id] || col.id;
    });

    // Create data rows
    const dataRows = rows.map((row) => {
      return visibleColumns.map((col) => {
        // Get the displayed value by rendering the cell
        const cell = row.getAllCells().find((c) => c.column.id === col.id);
        if (!cell) return "";

        // Check if column has a custom export formatter
        const meta = col.columnDef.meta as
          | { exportFormatter?: (row: TData) => string }
          | undefined;
        if (meta?.exportFormatter) {
          return meta.exportFormatter(row.original);
        }

        const value = cell.getValue();

        // Handle different cell value types
        if (value === null || value === undefined) {
          return "";
        }

        // Convert value based on type
        if (typeof value === "object") {
          // Handle objects and arrays
          return JSON.stringify(value);
        } else if (typeof value === "string") {
          return value;
        } else {
          // For numbers, booleans, and other primitives
          return value as string | number | boolean;
        }
      });
    });

    // Combine headers and data rows
    const worksheetData = [headers, ...dataRows];

    // Create worksheet and workbook
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Generate and download file
    XLSX.writeFile(workbook, finalFilename);
  };

  return (
    <Button variant="outline" className="gap-2" onClick={exportToXLSX}>
      <Download className="h-4 w-4" />
      Export Table
    </Button>
  );
}
