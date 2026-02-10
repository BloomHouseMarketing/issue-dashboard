/** Client-side API helpers — all Supabase calls go through server-side API routes */

export async function fetchFilterOptions() {
  const res = await fetch('/api/filter-options');
  if (!res.ok) throw new Error('Failed to fetch filter options');
  return res.json();
}

export async function fetchSyncLog() {
  const res = await fetch('/api/sync-log');
  if (!res.ok) throw new Error('Failed to fetch sync log');
  return res.json();
}

export async function fetchIssues(params: Record<string, unknown>) {
  const res = await fetch('/api/issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to fetch issues');
  return res.json();
}

export async function fetchTeamData() {
  const res = await fetch('/api/team');
  if (!res.ok) throw new Error('Failed to fetch team data');
  return res.json();
}

export async function fetchFacilityData(facility: string, year?: number | null) {
  const params = new URLSearchParams({ facility });
  if (year) params.set('year', String(year));
  const res = await fetch(`/api/facility?${params}`);
  if (!res.ok) throw new Error('Failed to fetch facility data');
  return res.json();
}
