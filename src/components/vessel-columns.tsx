import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { ThreatBadge } from "./ThreatBadge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

export interface Vessel {
  id: string;
  name: string;
  type: string;
  imo: string;
  threatLevel: number;
  arrivalTime: Date;
  lastArrivalTime: Date;
}

const formatDateTime = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const createColumns = (
  onVesselClick: (vesselId: string) => void,
): ColumnDef<Vessel>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
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
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Vessel Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <Button
        variant="link"
        className="p-0 h-auto font-normal"
        onClick={() => onVesselClick(row.original.id)}
      >
        {row.getValue("name")}
      </Button>
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Vessel Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "imo",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          IMO Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <a
        href="https://maritime.ihs.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {row.getValue("imo")}
      </a>
    ),
  },
  {
    accessorKey: "threatLevel",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Preliminary Threat Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <ThreatBadge level={row.getValue("threatLevel")} />,
  },
  {
    accessorKey: "arrivalTime",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Arrival Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => formatDateTime(row.getValue("arrivalTime")),
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.original.arrivalTime.getTime();
      const dateB = rowB.original.arrivalTime.getTime();
      return dateA - dateB;
    },
  },
  {
    accessorKey: "lastArrivalTime",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Arrival
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => formatDateTime(row.getValue("lastArrivalTime")),
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.original.lastArrivalTime.getTime();
      const dateB = rowB.original.lastArrivalTime.getTime();
      return dateA - dateB;
    },
  },
];
