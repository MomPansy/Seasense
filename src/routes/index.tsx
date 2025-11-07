import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { VesselDetails } from "../components/VesselDetails";
import { VesselTable } from "../components/VesselTable";
import {
  generateDetailedVessel,
  VesselDetails as VesselDetailsType,
} from "../utils/mockData";

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
  const [selectedVessel, setSelectedVessel] =
    useState<VesselDetailsType | null>(null);

  const handleVesselClick = (vesselId: string) => {
    // TODO: Fetch actual vessel details by ID from API
    // For now, using mock data
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
    setSelectedVessel(detailedVessel);
  };

  const handleBackToList = () => {
    setSelectedVessel(null);
  };

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
      {selectedVessel ? (
        <VesselDetails vessel={selectedVessel} onBack={handleBackToList} />
      ) : (
        <>
          <div className="mb-6">
            <h1 className="mb-2">Pre-Arrival Notice</h1>
            <p className="text-muted-foreground">
              Vessels arriving within 24-72 hours to Singapore
            </p>
          </div>

          <div className="space-y-6">
            <VesselTable vessels={vessels} onVesselClick={handleVesselClick} />
          </div>
        </>
      )}
    </main>
  );
}
