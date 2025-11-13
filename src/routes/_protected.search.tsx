import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { InferResponseType } from "hono";
import { useState } from "react";
import { toast } from "sonner";
import stringSimilarity from "string-similarity-js";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import { api } from "@/lib/api";
export const Route = createFileRoute("/_protected/search")({
  component: SearchPage,
});

type SearchResponse = InferResponseType<typeof api.vessels.search.$post>;

function SearchPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse>([]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      const response = await api.vessels.search.$post({ json: { query } });
      const results = await response.json();

      if (results.length === 0) {
        toast.error("No recently arrived ships found that match the query.");
      } else {
        setSearchResults(results);
      }
    }
  };

  return (
    <div className="flex flex-col h-full px-10 py-6">
      <SearchBar
        onSearch={handleSearch}
        placeholder="Search recent arrivals by IMO, Callsign, or Vessel Name..."
        value={searchQuery}
      />
      {searchResults.length > 0 && (
        <Stack direction="column">
          {searchResults.map((vessel) => {
            if (!vessel.vessels) {
              return (
                <Button
                  variant="destructive"
                  className="justify-start mt-4"
                  onClick={() => {
                    toast.error(
                      "This vessel did not provide an IMO that could be found in the IHS database.",
                    );
                  }}
                >
                  <div className="collapse md:visible w-1/12">
                    IMO: {vessel.vessel_arrivals.imo}
                  </div>
                  <div className="collapse md:visible w-1/12">
                    Callsign: {vessel.vessel_arrivals.callsign ?? "Unknown"}
                  </div>
                  <div className="flex-1">
                    {vessel.vessel_arrivals.vesselName}
                  </div>
                  <div className="collapse md:visible w-1/8">
                    Last arrived:{" "}
                    {vessel.vessel_arrivals.arrivedTime
                      ? format(
                          vessel.vessel_arrivals.arrivedTime,
                          "dd/MM/yy HH:mm",
                        )
                      : "Unknown"}
                  </div>
                </Button>
              );
            } else if (
              stringSimilarity(
                vessel.vessels.shipName ?? "",
                vessel.vessel_arrivals.vesselName ?? "",
              ) < 0.5 &&
              stringSimilarity(
                vessel.vessels.exName ?? "",
                vessel.vessel_arrivals.vesselName ?? "",
              ) < 0.5
            ) {
              return (
                <Button
                  variant="destructive"
                  className="justify-start mt-4"
                  onClick={() => {
                    toast.error(
                      "This vessel's provided IMO refers to a ship with different information in the IHS database.",
                    );
                  }}
                >
                  <div className="collapse md:visible w-1/12">
                    IMO: {vessel.vessel_arrivals.imo}
                  </div>
                  <div className="collapse md:visible w-1/12">
                    Callsign: {vessel.vessel_arrivals.callsign ?? "Unknown"}
                  </div>
                  <div className="flex-1">
                    {vessel.vessel_arrivals.vesselName}
                  </div>
                  <div className="collapse md:visible w-1/8">
                    Last arrived:{" "}
                    {vessel.vessel_arrivals.arrivedTime
                      ? format(
                          vessel.vessel_arrivals.arrivedTime,
                          "dd/MM/yy HH:mm",
                        )
                      : "Unknown"}
                  </div>
                </Button>
              );
            } else {
              return (
                <Button
                  variant="outline"
                  className="flex justify-start mt-4"
                  onClick={() =>
                    navigate({
                      to: `/vessel/$imo`,
                      params: { imo: vessel.vessel_arrivals.imo ?? "0" },
                    })
                  }
                >
                  <div className="collapse md:visible w-1/12">
                    IMO: {vessel.vessel_arrivals.imo}
                  </div>
                  <div className="collapse md:visible w-1/12">
                    Callsign: {vessel.vessel_arrivals.callsign ?? "Unknown"}
                  </div>
                  <div className="flex-1">
                    {vessel.vessel_arrivals.vesselName}
                  </div>
                  <div className="collapse md:visible w-1/8">
                    Last arrived:{" "}
                    {vessel.vessel_arrivals.arrivedTime
                      ? format(
                          vessel.vessel_arrivals.arrivedTime,
                          "dd/MM/yy HH:mm",
                        )
                      : "Unknown"}
                  </div>
                </Button>
              );
            }
          })}
        </Stack>
      )}
    </div>
  );
}
