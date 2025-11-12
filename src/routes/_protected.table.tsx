import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { TableSkeleton } from "@/components/TableSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { VesselTable } from "@/components/VesselTable";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_protected/table")({
  component: App,
});

function App() {
  const {
    data: vessels = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["vessels", "arriving"],
    queryFn: async () => {
      const response = await api.vessels.arriving.$post({ json: {} });
      if (!response.ok) {
        throw new Error("Failed to fetch vessels");
      }
      return await response.json();
    },
  });

  if (isLoading) {
    return (
      <main className="px-8 py-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-96 mb-2" />
        </div>
        <TableSkeleton rows={10} columns={8} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-8 py-6">
        <div>Error loading vessels: {error.message}</div>
      </main>
    );
  }

  return (
    <main className="px-8 py-6">
      <div className="mb-6">
        <h1 className="mb-2">
          Vessels arriving to Singapore within 24-72 hours
        </h1>
      </div>

      <div className="space-y-6">
        <VesselTable vessels={vessels} />
      </div>
    </main>
  );
}
