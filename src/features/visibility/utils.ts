export function mapTruckStatus(
  status?: string,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (!status) return 'neutral';
  const s = status.toUpperCase();
  if (s.includes('TRANSIT') || s.includes('LOADED')) return 'info';
  if (s.includes('CUSTOMER') || s.includes('OFFLOAD')) return 'success';
  if (s.includes('NOT_TRACKING') || s.includes('IDLE')) return 'danger';
  if (s.includes('PLANT') || s.includes('WAITING')) return 'warning';
  return 'neutral';
}

export function formatStatus(status?: string): string {
  if (!status) return 'Unknown';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
