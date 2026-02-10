export function formatKpiType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getKpiColor(score: number, target = 100): string {
  const ratio = score / target;
  if (ratio >= 0.9) return '#0D9F6E';
  if (ratio >= 0.7) return '#F59E0B';
  return '#EF4444';
}
