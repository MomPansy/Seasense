import { useNavigate } from "@tanstack/react-router";
import { InferResponseType } from "hono/client";
import { ArrowLeft, Copy } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { mapStatCode } from "@/lib/utils";
import { ThreatBadge } from "./ThreatBadge";
import { Button } from "./ui/button";

type ArrivingVesselsResponse = InferResponseType<
  typeof api.vessels.arriving.$post
>;
type VesselType = ArrivingVesselsResponse[number];

interface VesselDetailsProps {
  vessel: VesselType;
}

// Constants
const TANKER_TYPES = ["Chemical Tanker", "LPG Tanker", "LNG Tanker", "Tanker"];
const THREAT_SCORE_THRESHOLD = 50;

// Helper Components
const DetailCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="border border-border rounded-lg p-6 bg-card space-y-4">
    <h3 className="font-bold">{title}</h3>
    {children}
  </div>
);

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="grid grid-cols-[160px_1fr] gap-2">
    <span className="body-small text-muted-foreground">{label}:</span>
    <span className="body-small">{value}</span>
  </div>
);

// Helper functions
const getThreatLevel = (score: number) =>
  score < THREAT_SCORE_THRESHOLD ? "low" : "high";

const getThreatMessage = (score: number) => {
  const level = getThreatLevel(score);
  const warningText =
    score >= THREAT_SCORE_THRESHOLD ? " and this warrants further checks." : "";
  return `Vessel has a ${level} threat score of ${score}%${warningText}.`;
};

const formatNumber = (value: string | number | null | undefined) => {
  if (!value) return "-";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("en-US");
};

// Section Components
const VesselDetailsSection = ({ vessel }: { vessel: VesselType }) => (
  <DetailCard title="Vessel Details">
    <div className="space-y-3">
      <DetailRow
        label="Name"
        value={vessel.vesselArrivalDetails.vesselName ?? "-"}
      />
      <DetailRow label="Flag" value={vessel.vesselDetails?.flagName ?? "-"} />
      <DetailRow
        label="IMO Number"
        value={
          <a
            href={`https://www.marinetraffic.com/en/ais/details/ships/imo:${vessel.vesselDetails?.ihslRorImoShipNo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {vessel.vesselDetails?.ihslRorImoShipNo ?? "-"}
          </a>
        }
      />
      <DetailRow
        label="Call Sign"
        value={vessel.vesselArrivalDetails.callsign ?? "-"}
      />
      <DetailRow
        label="Gross Tonnage"
        value={formatNumber(vessel.vesselDetails?.grossTonnage)}
      />
      <DetailRow
        label="Length Overall"
        value={
          vessel.vesselDetails?.lengthOverallLoa
            ? `${parseFloat(vessel.vesselDetails.lengthOverallLoa)}m`
            : "-"
        }
      />
    </div>
  </DetailCard>
);

const OwnershipSection = ({ vessel }: { vessel: VesselType }) => (
  <DetailCard title="Ownership">
    <div className="space-y-3">
      <DetailRow
        label="Group Owner"
        value={vessel.vesselDetails?.groupBeneficialOwner ?? "-"}
      />
      <DetailRow
        label="Registered Owner"
        value={vessel.vesselDetails?.registeredOwner ?? "-"}
      />
      <DetailRow
        label="Operator"
        value={vessel.vesselDetails?.operator ?? "-"}
      />
    </div>
  </DetailCard>
);

const CrewSection = () => (
  <DetailCard title="Crew">
    <div className="space-y-3">
      <DetailRow
        label="No. Of Crew"
        value={<span className="text-muted-foreground">-</span>}
      />
      <DetailRow
        label="Nationalities"
        value={<span className="text-muted-foreground">-</span>}
      />
      <DetailRow
        label="Remarks"
        value={<span className="text-muted-foreground">-</span>}
      />
    </div>
  </DetailCard>
);

const CargoSection = () => (
  <DetailCard title="Cargo">
    <div className="space-y-3">
      <DetailRow
        label="Cargo Carried"
        value={<span className="text-muted-foreground">-</span>}
      />
    </div>
  </DetailCard>
);

const AssessmentSection = ({
  vessel,
  isTanker,
  trippedRules,
}: {
  vessel: VesselType;
  isTanker: boolean;
  trippedRules: { name: string; tripped: boolean }[];
}) => (
  <DetailCard title="Assessment">
    <div className="min-h-[200px] space-y-4">
      {!isTanker ? (
        <span className="body-small text-muted-foreground">-</span>
      ) : (
        <>
          <div>
            <p className="body-small mb-2">Threat evaluation score of</p>
            <ThreatBadge
              level={vessel.score.level || -1}
              percentage={vessel.score.score || 0}
            />
          </div>

          <p className="body-small">
            {getThreatMessage(vessel.score.score || 0)}
          </p>

          <div>
            <p className="body-small mb-2">
              The following parameters were tripped when the vessel arrived / is
              arriving in Singapore:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              {trippedRules.map((rule, index) => (
                <li key={index} className="body-small">
                  {rule.name}
                </li>
              ))}
              {trippedRules.length === 0 && (
                <li className="body-small text-muted-foreground">
                  No parameters tripped
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  </DetailCard>
);

const ActionsSection = () => (
  <DetailCard title="Actions">
    <div className="min-h-[200px]">
      <span className="body-small text-muted-foreground">-</span>
    </div>
  </DetailCard>
);

export function VesselDetails({ vessel }: VesselDetailsProps) {
  const navigate = useNavigate();

  // Memoized vessel type and tanker checking
  const vesselType = useMemo(
    () => mapStatCode(vessel.vesselDetails?.statCode5),
    [vessel.vesselDetails?.statCode5],
  );

  const isTanker = useMemo(
    () => TANKER_TYPES.includes(vesselType),
    [vesselType],
  );

  const trippedRules = useMemo(
    () => vessel.score.checkedRules.filter((rule) => rule.tripped),
    [vessel.score.checkedRules],
  );

  const copyToClipboard = async () => {
    const assessmentContent = isTanker
      ? `Threat evaluation score of
Level ${vessel.score.level || -1} - ${vessel.score.score || 0}%
${getThreatMessage(vessel.score.score || 0)}

Parameters tripped:
${trippedRules.length > 0 ? trippedRules.map((rule) => `- ${rule.name}`).join("\n") : "- No parameters tripped"}`
      : "-";

    const text = `Details of VVOCC for ${vessel.vesselArrivalDetails.vesselName ?? "-"}

Vessel Name: ${vessel.vesselArrivalDetails.vesselName ?? "-"}
Vessel Type: ...
Flag: ${vessel.vesselDetails?.flagName ?? "-"}
IMO: ${vessel.vesselDetails?.ihslRorImoShipNo ?? "-"}
C/S: ${vessel.vesselArrivalDetails.callsign ?? "-"}
Gross Tonnage: ${formatNumber(vessel.vesselDetails?.grossTonnage)} t
Length Overall: ${vessel.vesselDetails?.lengthOverallLoa ? `${parseFloat(vessel.vesselDetails.lengthOverallLoa)} m` : "-"}

Voyage:
LPOC: 
L2POC: 
L3POC: 
L4POC: 
L5POC: 

Current Location:
-

Owner:
Group Owner: ${vessel.vesselDetails?.groupBeneficialOwner ?? "-"} (...)
Registered Owner: ${vessel.vesselDetails?.registeredOwner ?? "-"} (...)
Operator: ${vessel.vesselDetails?.operator ?? "-"} (...)

Crew:
No. Of Crew: -
Nationalities: -
Remarks: -

Cargo:
-

Assessment:
${assessmentContent}

Actions:
-
`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Vessel details copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => navigate({ to: "/" })}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </Button>
        <Button variant="outline" className="gap-2" onClick={copyToClipboard}>
          <Copy className="h-4 w-4" />
          Copy to text
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1 */}
        <div className="space-y-6">
          <VesselDetailsSection vessel={vessel} />

          {/* Voyage (Last 5 POC) */}
          <DetailCard title="Voyage (Last 5 POC)">
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left body-small">
                      Port of Call
                    </th>
                    <th className="px-4 py-3 text-left body-small">Country</th>
                    <th className="px-4 py-3 text-left body-small">
                      Arrival Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-4 py-3 body-small" colSpan={3}>
                      <span className="body-small text-muted-foreground">
                        No voyage data available
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </DetailCard>

          {/* Vessel Current Location */}
          <DetailCard title="Vessel Current Location">
            <span className="body-small text-muted-foreground">-</span>
          </DetailCard>
        </div>

        {/* Column 2 */}
        <div className="space-y-6">
          <OwnershipSection vessel={vessel} />
          <CrewSection />
          <CargoSection />
          <AssessmentSection
            vessel={vessel}
            isTanker={isTanker}
            trippedRules={trippedRules}
          />
          <ActionsSection />
        </div>
      </div>
    </div>
  );
}
