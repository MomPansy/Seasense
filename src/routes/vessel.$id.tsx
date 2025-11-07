import { createFileRoute } from "@tanstack/react-router";
import { VesselDetails } from "@/components/VesselDetails";
import { generateDetailedVessel } from "@/utils/mockData";

export const Route = createFileRoute("/vessel/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id: vesselId } = Route.useParams();
  const mockVessel = {
    id: vesselId,
    name: "Mock Vessel",
    type: "Container Ship",
    imo: vesselId,
    flag: "Singapore",
    threatLevel: 1,
    arrivalTime: new Date(),
    lastArrivalTime: new Date(),
  };
  const detailedVessel = generateDetailedVessel(mockVessel);
  return <VesselDetails vessel={detailedVessel} />;
}
