import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { VesselTable } from "../components/VesselTable";

export const Route = createFileRoute("/")({
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
      const response = await api.vessels.arriving.$get();
      if (!response.ok) {
        throw new Error("Failed to fetch vessels");
      }
      return await response.json();
    },
  });

  if (isLoading) {
    return (
      <main className="px-8 py-6">
        <div>Loading vessels...</div>
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
        <h1 className="mb-2">Pre-Arrival Notice</h1>
        <p className="text-muted-foreground">
          Vessels arriving within 24-72 hours to Singapore
        </p>
      </div>

      <div className="space-y-6">
        <VesselTable vessels={vessels} />
      </div>
    </main>
  );
}
