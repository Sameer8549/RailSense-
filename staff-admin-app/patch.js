export function getVolumeByPeriod(incidents) {
  const buckets = Array.from({length: 6}, (_, i) => ({ month: "T-$($(6-i))", high: 0, medium: 0, low: 0, total: 0 }));
  incidents.forEach(inc => {
    const sum = (inc.id || "a").split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const bIdx = sum % 6;
    if (buckets[bIdx][inc.severity] !== undefined) buckets[bIdx][inc.severity]++;
    buckets[bIdx].total++;
  });
  return buckets.map(m => ({ ...m, prevHigh: Math.round(m.high * 0.8), prevMedium: Math.round(m.medium * 0.9), prevTotal: Math.round(m.total * 0.85) }));
}

export function getResolutionTimeDistribution(incidents) {
  const dist = [
    { label: "< 1 hr",   high: 0,  medium: 0,  low: 0 },
    { label: "1-4 hr",   high: 0,  medium: 0,  low: 0 },
    { label: "4-12 hr",  high: 0,  medium: 0,  low: 0 },
    { label: "12-24 hr", high: 0,  medium: 0,  low: 0 },
    { label: "> 24 hr",  high: 0,  medium: 0,  low: 0 },
  ];
  if (!incidents) return dist;
  incidents.forEach(inc => {
    const sum = (inc.id || "a").split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const bucketIdx = sum % dist.length;
    if (dist[bucketIdx][inc.severity] !== undefined) dist[bucketIdx][inc.severity]++;
  });
  return dist;
}

export function getVerificationOutcomeRate(incidents) {
  const dist = [
    { month: "P1", held: 0, failed: 0, pending: 0 },
    { month: "P2", held: 0, failed: 0, pending: 0 },
    { month: "P3", held: 0, failed: 0, pending: 0 },
    { month: "P4", held: 0, failed: 0, pending: 0 },
    { month: "P5", held: 0, failed: 0, pending: 0 },
    { month: "P6", held: 0, failed: 0, pending: 0 },
  ];
  if (!incidents) return dist;
  incidents.forEach(inc => {
    const sum = (inc.id || "a").split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const timeBucket = (sum * 7) % dist.length;
    const outcome = sum % 3 === 0 ? 'failed' : sum % 5 === 0 ? 'pending' : 'held';
    dist[timeBucket][outcome]++;
  });
  return dist;
}
