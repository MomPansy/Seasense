import { useNavigate } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { differenceInMilliseconds, format } from "date-fns";
import { InferResponseType } from "hono/client";
import { ArrowUpDown } from "lucide-react";
import { api } from "src/lib/api";
import { mapStatCode } from "src/lib/utils";
import { DataTableColumnFilter } from "./data-table-column-filter";
import { DataTableDateFilter } from "./data-table-date-filter";
import { ThreatBadge } from "./ThreatBadge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Stack } from "./ui/stack";

// This will give you the exact response type from the endpoint
type ArrivingVesselsResponse = InferResponseType<
  typeof api.vessels.arriving.$post
>[number];

export const createColumns = (
  navigate: ReturnType<typeof useNavigate>,
): ColumnDef<ArrivingVesselsResponse>[] => [
  {
    id: "select",
    size: 40,
    header: ({ table }) => (
      <div className="pl-2.5">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "vesselArrivalDetails.imo",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          size="sm"
        >
          IMO Number
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const imo = row.original.vesselArrivalDetails.imo;
      const href = imo
        ? `https://www.marinetraffic.com/en/ais/details/ships/imo:${imo}`
        : "https://www.marinetraffic.com/";

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {imo ?? "N/A"}
        </a>
      );
    },
  },
  {
    accessorKey: "vesselArrivalDetails.vesselName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          size="sm"
        >
          Vessel Name
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      if (row.original.score.score === 100) {
        return row.original.vesselArrivalDetails.vesselName ?? "N/A";
      }
      return (
        <Button
          variant="link"
          className="p-0 h-auto font-normal cursor-pointer"
          onClick={() => {
            if (!row.original.vesselArrivalDetails.imo) return;
            navigate({
              to: `/vessel/$imo`,
              params: { imo: row.original.vesselArrivalDetails.imo },
            });
          }}
          disabled={!row.original.vesselArrivalDetails.imo}
        >
          {row.original.vesselArrivalDetails.vesselName ?? "N/A"}
        </Button>
      );
    },
  },
  {
    accessorKey: "vesselArrivalDetails.callsign",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          size="sm"
        >
          Call Sign
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "vesselDetails.statCode5",
    header: ({ column }) => {
      return (
        <Stack direction="row" items="center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="gap-1"
            size="sm"
          >
            Vessel Type
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <DataTableColumnFilter column={column} title="Vessel Type" />
        </Stack>
      );
    },
    cell: ({ row }) => mapStatCode(row.original.vesselDetails?.statCode5),
    accessorFn: (row) => mapStatCode(row.vesselDetails?.statCode5),
    filterFn: (row, _columnId, filterValue: string[]) => {
      if (filterValue.length === 0) return true;
      const mappedValue = mapStatCode(row.original.vesselDetails?.statCode5);
      return filterValue.includes(mappedValue);
    },
  },
  {
    accessorKey: "vesselDetails.flagName",
    header: ({ column }) => {
      return (
        <Stack direction="row" items="center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="gap-1"
            size="sm"
          >
            Flag
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <DataTableColumnFilter column={column} title="Flag" />
        </Stack>
      );
    },
    filterFn: (row, columnId, filterValue: string[]) => {
      if (filterValue.length === 0) return true;
      const cellValue = String(row.getValue(columnId));
      return filterValue.includes(cellValue);
    },
  },
  {
    accessorKey: "score.score",
    header: ({ column }) => {
      return (
        <Stack direction="row" items="center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="gap-1"
            size="sm"
          >
            Initial Threat Score
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <DataTableColumnFilter column={column} title="Initial Threat Score" />
        </Stack>
      );
    },
    cell: ({ row }) => (
      <ThreatBadge
        level={row.original.score.level}
        percentage={row.original.score.score}
      />
    ),
    meta: {
      exportFormatter: (row: ArrivingVesselsResponse) => {
        const level = row.score.level;
        const percentage = row.score.score;
        return `Level ${level} - ${percentage}%`;
      },
    },
    filterFn: (row, columnId, filterValue: string[]) => {
      if (filterValue.length === 0) return true;
      const cellValue = String(row.getValue(columnId));
      return filterValue.includes(cellValue);
    },
  },
  {
    accessorKey: "vesselArrivalDetails.locationFrom",
    header: ({ column }) => {
      return (
        <Stack direction="row" items="center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="gap-1"
            size="sm"
          >
            From
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <DataTableColumnFilter column={column} title="From" />
        </Stack>
      );
    },
    filterFn: (row, columnId, filterValue: string[]) => {
      if (filterValue.length === 0) return true;
      const cellValue = String(row.getValue(columnId));
      return filterValue.includes(cellValue);
    },
  },
  {
    accessorKey: "vesselArrivalDetails.locationTo",
    header: ({ column }) => {
      return (
        <Stack direction="row" items="center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="gap-1"
            size="sm"
          >
            To
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <DataTableColumnFilter column={column} title="To" />
        </Stack>
      );
    },
    filterFn: (row, columnId, filterValue: string[]) => {
      if (filterValue.length === 0) return true;
      const cellValue = String(row.getValue(columnId));
      return filterValue.includes(cellValue);
    },
  },
  {
    accessorKey: "vesselArrivalDetails.dueToArriveTime",
    header: ({ column, table }) => {
      return (
        <Stack direction="row" items="center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="gap-1"
            size="sm"
          >
            Arrival Time
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <DataTableDateFilter
            column={column}
            table={table}
            title="Arrival Time"
          />
        </Stack>
      );
    },
    cell: ({ row }) => {
      return row.original.vesselArrivalDetails.dueToArriveTime
        ? format(
            row.original.vesselArrivalDetails.dueToArriveTime,
            "dd/MM/yy HH:mm:ss X",
          )
        : "N/A";
    },
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.original.vesselArrivalDetails.dueToArriveTime ?? 0;
      const dateB = rowB.original.vesselArrivalDetails.dueToArriveTime ?? 0;
      return differenceInMilliseconds(dateA, dateB);
    },
    filterFn: (row, _columnId, filterValue: { start: number; end: number }) => {
      const dateStr = row.original.vesselArrivalDetails.dueToArriveTime;
      if (!dateStr) return false;

      const date = new Date(dateStr).getTime();
      return date >= filterValue.start && date <= filterValue.end;
    },
  },
];
