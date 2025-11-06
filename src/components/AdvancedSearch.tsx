import React, { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface AdvancedSearchProps {
  onSearch: (filters: any) => void;
  onClose: () => void;
}

export function AdvancedSearch({ onSearch, onClose }: AdvancedSearchProps) {
  const [filters, setFilters] = useState({
    vesselName: '',
    vesselType: '',
    imoNumber: '',
    threatScore: '',
    arrivalDateFrom: '',
    arrivalDateTo: '',
    lastArrivalFrom: '',
    lastArrivalTo: '',
    lastPorts: '',
  });

  const handleSubmit = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      vesselName: '',
      vesselType: '',
      imoNumber: '',
      threatScore: '',
      arrivalDateFrom: '',
      arrivalDateTo: '',
      lastArrivalFrom: '',
      lastArrivalTo: '',
      lastPorts: '',
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3>Advanced Search</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vessel Name</Label>
          <Input
            placeholder="Enter vessel name"
            value={filters.vesselName}
            onChange={(e) => setFilters({ ...filters, vesselName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Vessel Type</Label>
          <Select value={filters.vesselType} onValueChange={(value) => setFilters({ ...filters, vesselType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select vessel type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="container">Container Ship</SelectItem>
              <SelectItem value="tanker">Tanker</SelectItem>
              <SelectItem value="bulk">Bulk Carrier</SelectItem>
              <SelectItem value="cargo">Cargo Ship</SelectItem>
              <SelectItem value="passenger">Passenger Ship</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>IMO Number</Label>
          <Input
            placeholder="Enter IMO number"
            value={filters.imoNumber}
            onChange={(e) => setFilters({ ...filters, imoNumber: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Threat Evaluation Score</Label>
          <Select value={filters.threatScore} onValueChange={(value) => setFilters({ ...filters, threatScore: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select threat level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="1">Level 1</SelectItem>
              <SelectItem value="2">Level 2</SelectItem>
              <SelectItem value="3">Level 3</SelectItem>
              <SelectItem value="4">Level 4</SelectItem>
              <SelectItem value="5">Level 5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Arrival Date From</Label>
          <Input
            type="date"
            value={filters.arrivalDateFrom}
            onChange={(e) => setFilters({ ...filters, arrivalDateFrom: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Arrival Date To</Label>
          <Input
            type="date"
            value={filters.arrivalDateTo}
            onChange={(e) => setFilters({ ...filters, arrivalDateTo: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Last Arrival From</Label>
          <Input
            type="date"
            value={filters.lastArrivalFrom}
            onChange={(e) => setFilters({ ...filters, lastArrivalFrom: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Last Arrival To</Label>
          <Input
            type="date"
            value={filters.lastArrivalTo}
            onChange={(e) => setFilters({ ...filters, lastArrivalTo: e.target.value })}
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label>Last 5 Ports of Call</Label>
          <Input
            placeholder="Enter port name and country (e.g., Rotterdam, Netherlands)"
            value={filters.lastPorts}
            onChange={(e) => setFilters({ ...filters, lastPorts: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button onClick={handleSubmit}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
