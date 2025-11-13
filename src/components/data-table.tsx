import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getSortedRowModel,
  useReactTable,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table";
import { ArrayElement } from "@/utils/type";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "src/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "src/components/ui/tooltip";
import { ArrivingVesselsResponse } from "./VesselTable";

type VesselData = ArrayElement<ArrivingVesselsResponse>;

interface DataTableProps {
  columns: ColumnDef<VesselData>[];
  data: VesselData[];
  sorting?: SortingState;
  setSorting?: OnChangeFn<SortingState>;
  columnFilters?: ColumnFiltersState;
  setColumnFilters?: OnChangeFn<ColumnFiltersState>;
  columnVisibility?: VisibilityState;
  setColumnVisibility?: OnChangeFn<VisibilityState>;
  rowSelection?: RowSelectionState;
  setRowSelection?: OnChangeFn<RowSelectionState>;
}

export function DataTable({
  columns,
  data,
  sorting = [],
  setSorting,
  columnFilters = [],
  setColumnFilters,
  columnVisibility = {},
  setColumnVisibility,
  rowSelection = {},
  setRowSelection,
}: DataTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => {
              // Check if row has score property and if score is 100
              const incorrectImo = row.original.score.checkedRules.find(
                (rule) => rule.name === "Incorrect IMO",
              );
              const invalidImo = row.original.score.checkedRules.find(
                (rule) => rule.name === "Invalid IMO",
              );

              const rowContent = (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    incorrectImo || invalidImo
                      ? "bg-red-50 hover:bg-red-100"
                      : ""
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );

              if (incorrectImo) {
                return (
                  <Tooltip key={row.id}>
                    <TooltipTrigger asChild>{rowContent}</TooltipTrigger>
                    <TooltipContent align="start">
                      <p>
                        This IMO number refers to different vessels within the
                        MDH and IHS databases.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              } else if (invalidImo) {
                return (
                  <Tooltip key={row.id}>
                    <TooltipTrigger asChild>{rowContent}</TooltipTrigger>
                    <TooltipContent align="start">
                      <p>
                        This vessel either did not provide an IMO number or
                        provided an invalid one.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return rowContent;
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
