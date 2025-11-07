import { createFileRoute } from "@tanstack/react-router";
import { VesselDetails } from "@/components/VesselDetails";
import { generateDetailedVessel } from "@/utils/mockData";

export const Route = createFileRoute("/vessel/$imo")({
  component: RouteComponent,
});

function RouteComponent() {
  const { imo } = Route.useParams();
  // const { data } = useQuery({
  //   queryKey: ["vessel", imo],
  //   queryFn: async () => {
  //     const response = await api.vessels.imo[":imo"].$get({
  //       'param': {
  //         imo: imo
  //       }
  //     });
  //     if (!response.ok) {
  //       throw new Error("Failed to fetch vessel details");
  //     }
  //     return await response.json();
  //   },
  //   select: (data) => ({
  //     name: data.shipName,
  //     type: data.shiptypeLevel5
  //   })
  // })
  const mockVessel = {
    id: imo,
    name: "Mock Vessel",
    type: "Container Ship",
    imo: imo,
    flag: "Singapore",
    threatLevel: 1,
    arrivalTime: new Date(),
    lastArrivalTime: new Date(),
  };
  const detailedVessel = generateDetailedVessel(mockVessel);
  return <VesselDetails vessel={detailedVessel} />;
}
