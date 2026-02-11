const KPI_DISPLAY_NAMES: Record<string, string> = {
  DISPATCH_VOLUME: 'Dispatch Volume',
  GIGO: 'Gate In / Gate Out',
  CICO_CUSTOMER: 'Check In / Check Out',
  BACKHAUL: 'Backhaul',
  LEAD_TIME: 'Lead Time',
  OTD_RING_1: 'OTD Ring 1',
  AVG_DISTANCE_PER_TRIP: 'Avg Distance/Trip',
  TRIPS_PER_TRUCK_PER_WEEK: 'Trips/Truck/Week',
  TI: 'Turnaround In',
  TO: 'Turnaround Out',
  AVERAGE_SCORE_CARD: 'Avg Score Card',
  AVAILABILITY: 'Availability',
  TOTAL_TRUCKS: 'Total Trucks',
  VIOLATION_RATE: 'Violation Rate',
  SKMD: 'SKMD',
  HRD: 'HRD',
};

export function formatKpiType(type: string): string {
  return (
    KPI_DISPLAY_NAMES[type] ??
    type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function getKpiColor(score: number, target = 100): string {
  const ratio = score / target;
  if (ratio >= 0.9) return '#0D9F6E';
  if (ratio >= 0.7) return '#F59E0B';
  return '#EF4444';
}
