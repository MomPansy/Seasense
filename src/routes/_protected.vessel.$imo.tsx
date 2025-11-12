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
      const response = await api.vessels.arriving.$post({ json: { imo } });
      if (!response.ok) {
        throw new Error("Failed to fetch vessel details");
      }
      const vessels = await response.json();
      // Find the vessel with matching IMO
      return vessels.find((v) => v.vesselArrivalDetails.imo === imo);
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
        <div>Vessel not found</div>
      </main>
    );
  }

  return (
    <main className="px-8 py-6">
      <VesselDetails vessel={vessel} />
    </main>
  );
}
