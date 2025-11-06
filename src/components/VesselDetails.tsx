import { ArrowLeft, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ThreatBadge } from './ThreatBadge';
import { VesselDetails as VesselDetailsType } from '../utils/mockData';
import { toast } from 'sonner';

interface VesselDetailsProps {
  vessel: VesselDetailsType;
  onBack: () => void;
}

export function VesselDetails({ vessel, onBack }: VesselDetailsProps) {
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleExport = () => {
    toast.success('Exporting vessel details to Excel');
    console.log('Export vessel details:', vessel);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <h1>{vessel.name}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Vessel Section */}
        <Card>
          <CardHeader>
            <CardTitle>Vessel</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              <strong>{vessel.name}</strong>, a {vessel.type} of {vessel.modelNumber}, and{' '}
              <a 
                href="https://maritime.ihs.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {vessel.imo}
              </a>
              , arrived in Singapore on {formatDate(vessel.arrivalTime)} at{' '}
              {formatTime(vessel.arrivalTime)}. The last arrival to Singapore was on{' '}
              {formatDate(vessel.lastArrivalTime)}.
            </p>
          </CardContent>
        </Card>

        {/* Voyage Section */}
        <Card>
          <CardHeader>
            <CardTitle>Voyage</CardTitle>
          </CardHeader>
          <CardContent>
            <p>It's last 5 ports of call are:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {vessel.lastPorts.map((portInfo, index) => (
                <li key={index}>
                  {portInfo.port}, {portInfo.country}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Organisation Section */}
        <Card>
          <CardHeader>
            <CardTitle>Organisation</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              The group owner is <strong>{vessel.groupOwner}</strong> and company was incorporated in{' '}
              <strong>{vessel.companyCountry}</strong>.
            </p>
          </CardContent>
        </Card>

        {/* Preliminary Threat Evaluation Section */}
        <Card>
          <CardHeader>
            <CardTitle>Preliminary Threat Evaluation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span>Threat evaluation score of</span>
              <ThreatBadge level={vessel.threatLevel} />
            </div>
            
            <p>
              Vessel has a high threat score of <strong>{vessel.threatPercentage}%</strong> and this
              warrants further checks.
            </p>

            <div>
              <p className="mb-2">
                The following parameters were tripped when the vessel arrived / is arriving in
                Singapore:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                {vessel.parameters.map((param, index) => (
                  <li key={index}>{param}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
