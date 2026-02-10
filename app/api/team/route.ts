import { NextResponse } from 'next/server';
import { supabase, PAGE_SIZE } from '@/lib/supabase';

export async function GET() {
  // Fetch team leaderboard from view
  const teamRes = await supabase
    .from('v_monitoring_team')
    .select('*')
    .order('issues_reported', { ascending: false });

  // Fetch all heatmap rows (paginate past 1000-row limit)
  const heatmapRows: { live_monitoring_team: string; facility: string }[] = [];
  let hmFrom = 0;
  let hmMore = true;
  while (hmMore) {
    const { data } = await supabase
      .from('issues')
      .select('live_monitoring_team, facility')
      .not('live_monitoring_team', 'is', null)
      .range(hmFrom, hmFrom + PAGE_SIZE - 1);
    if (data && data.length > 0) {
      heatmapRows.push(...data);
      hmMore = data.length === PAGE_SIZE;
      hmFrom += PAGE_SIZE;
    } else {
      hmMore = false;
    }
  }

  // Fetch all activity rows (paginate past 1000-row limit)
  const activityRows: { live_monitoring_team: string; round_date: string }[] = [];
  let actFrom = 0;
  let actMore = true;
  while (actMore) {
    const { data } = await supabase
      .from('issues')
      .select('live_monitoring_team, round_date')
      .not('live_monitoring_team', 'is', null)
      .not('round_date', 'is', null)
      .order('round_date', { ascending: true })
      .range(actFrom, actFrom + PAGE_SIZE - 1);
    if (data && data.length > 0) {
      activityRows.push(...data);
      actMore = data.length === PAGE_SIZE;
      actFrom += PAGE_SIZE;
    } else {
      actMore = false;
    }
  }

  return NextResponse.json({
    team: teamRes.data || [],
    heatmapRows,
    activityRows,
  });
}
