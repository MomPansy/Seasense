import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { VesselDetails } from "@/components/VesselDetails";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_protected/vessel/$imo")({
  component: RouteComponent,
});

function RouteComponent() {
  const { imo } = Route.useParams();

  const {
    data: vessel,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["vessel", imo],
    queryFn: async () => {
      const response = await api.vessels.vesselDetails.$post({ json: { imo } });
      if (response.status === 404) {
        return null;
      } else if (!response.ok) {
        throw new Error("Failed to fetch vessel details");
      }
      const vessel = await response.json();
      // Find the vessel with matching IMO
      return vessel;
    },
  });

  if (isLoading) {
    return (
      <main className="px-8 py-6">
        <div>Loading vessel details...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-8 py-6">
        <div>Error loading vessel: {error.message}</div>
      </main>
    );
  }

  if (!vessel) {
    return (
      <main className="px-8 py-6">
        <div>No vessel with that IMO could be found.</div>
      </main>
    );
  }

  return (
    <main className="px-8 py-6">
      <VesselDetails vessel={vessel} />
    </main>
  );
}
