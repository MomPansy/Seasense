import { ColumnDef } from "@tanstack/react-table";
import { InferResponseType } from "hono/client";
import { ArrowUpDown } from "lucide-react";
import { api } from "src/lib/api";
import { ThreatBadge } from "./ThreatBadge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

// This will give you the exact response type from the endpoint
type ArrivingVesselsResponse = InferResponseType<
  typeof api.vessels.arriving.$get
>[number];

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const createColumns = (
  onVesselClick: (vesselId: string) => void,
): ColumnDef<ArrivingVesselsResponse>[] => [
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
    accessorKey: "vesselArrivalDetails.vesselName",
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
        onClick={() =>
          onVesselClick(row.original.vesselArrivalDetails.id.toString())
        }
      >
        {row.original.vesselArrivalDetails.vesselName ?? "N/A"}
      </Button>
    ),
  },
  {
    accessorKey: "vesselDetails.shiptypeLevel5",
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
    cell: ({ row }) => row.original.vesselDetails?.shiptypeLevel5 ?? "N/A",
  },
  {
    accessorKey: "vesselArrivalDetails.imo",
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
        {row.original.vesselArrivalDetails.imo ?? "N/A"}
      </a>
    ),
  },
  {
    accessorKey: "score.score",
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
    cell: ({ row }) => <ThreatBadge level={row.original.score.score} />,
  },
  {
    accessorKey: "vesselArrivalDetails.dueToArriveTime",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Due to Arrive
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) =>
      formatDateTime(row.original.vesselArrivalDetails.dueToArriveTime),
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.original.vesselArrivalDetails.dueToArriveTime
        ? new Date(rowA.original.vesselArrivalDetails.dueToArriveTime).getTime()
        : 0;
      const dateB = rowB.original.vesselArrivalDetails.dueToArriveTime
        ? new Date(rowB.original.vesselArrivalDetails.dueToArriveTime).getTime()
        : 0;
      return dateA - dateB;
    },
  },
  {
    accessorKey: "vesselArrivalDetails.locationFrom",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          From
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "vesselArrivalDetails.locationTo",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          To
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
];
