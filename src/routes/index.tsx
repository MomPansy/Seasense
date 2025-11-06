import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SearchBar } from "../components/SearchBar";
import { VesselDetails } from "../components/VesselDetails";
import { VesselTable, Vessel } from "../components/VesselTable";
import {
  generateMockVessels,
  generateDetailedVessel,
  VesselDetails as VesselDetailsType,
} from "../utils/mockData";

interface VesselFilters {
  vesselName: string;
  vesselType: string;
  imoNumber: string;
  threatScore: string;
  arrivalDateFrom: string;
  arrivalDateTo: string;
  lastArrivalFrom: string;
  lastArrivalTo: string;
  lastPorts: string;
}

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [filteredVessels, setFilteredVessels] = useState<Vessel[]>([]);
  const [selectedVessel, setSelectedVessel] =
    useState<VesselDetailsType | null>(null);

  useEffect(() => {
    const mockVessels = generateMockVessels(30);
    setVessels(mockVessels);
    setFilteredVessels(mockVessels);
  }, []);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredVessels(vessels);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = vessels.filter(
      (vessel) =>
        vessel.name.toLowerCase().includes(lowerQuery) ||
        vessel.type.toLowerCase().includes(lowerQuery) ||
        vessel.imo.toLowerCase().includes(lowerQuery),
    );
    setFilteredVessels(filtered);
  };

  const handleAdvancedSearch = (filters: VesselFilters) => {
    let filtered = [...vessels];

    if (filters.vesselName) {
      filtered = filtered.filter((v) =>
        v.name.toLowerCase().includes(filters.vesselName.toLowerCase()),
      );
    }

    if (filters.vesselType && filters.vesselType !== "all") {
      const typeMap: Record<string, string> = {
        container: "Container Ship",
        tanker: "Tanker",
        bulk: "Bulk Carrier",
        cargo: "Cargo Ship",
        passenger: "Passenger Ship",
      };
      const mappedType = typeMap[filters.vesselType] || filters.vesselType;
      filtered = filtered.filter((v) => v.type.includes(mappedType));
    }

    if (filters.imoNumber) {
      filtered = filtered.filter((v) =>
        v.imo.toLowerCase().includes(filters.imoNumber.toLowerCase()),
      );
    }

    if (filters.threatScore && filters.threatScore !== "all") {
      filtered = filtered.filter(
        (v) => v.threatLevel === parseInt(filters.threatScore),
      );
    }

    if (filters.arrivalDateFrom) {
      const fromDate = new Date(filters.arrivalDateFrom);
      filtered = filtered.filter((v) => v.arrivalTime >= fromDate);
    }

    if (filters.arrivalDateTo) {
      const toDate = new Date(filters.arrivalDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((v) => v.arrivalTime <= toDate);
    }

    if (filters.lastArrivalFrom) {
      const fromDate = new Date(filters.lastArrivalFrom);
      filtered = filtered.filter((v) => v.lastArrivalTime >= fromDate);
    }

    if (filters.lastArrivalTo) {
      const toDate = new Date(filters.lastArrivalTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((v) => v.lastArrivalTime <= toDate);
    }

    setFilteredVessels(filtered);
  };

  const handleRefresh = () => {
    const mockVessels = generateMockVessels(30);
    setVessels(mockVessels);
    setFilteredVessels(mockVessels);
  };

  const handleVesselClick = (vesselId: string) => {
    const vessel = vessels.find((v) => v.id === vesselId);
    if (vessel) {
      const detailedVessel = generateDetailedVessel(vessel);
      setSelectedVessel(detailedVessel);
    }
  };

  const handleBackToList = () => {
    setSelectedVessel(null);
  };

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
            <SearchBar
              onSearch={handleSearch}
              onAdvancedSearch={handleAdvancedSearch}
            />

            <VesselTable
              vessels={filteredVessels}
              onRefresh={handleRefresh}
              onVesselClick={handleVesselClick}
            />
          </div>
        </>
      )}
    </main>
  );
}
