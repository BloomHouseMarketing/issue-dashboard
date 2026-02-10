import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const facility = searchParams.get('facility');
  const year = searchParams.get('year');

  if (!facility) {
    return NextResponse.json({ error: 'facility is required' }, { status: 400 });
  }

  const [statsRes, groupsRes, trendRes, staffRes] = await Promise.all([
    supabase.rpc('get_dashboard_stats', {
      p_facility: facility,
      p_group_name: null,
      p_year: year ? parseInt(year) : null,
      p_month: null,
    }),
    supabase.from('v_group_breakdown').select('*').eq('facility', facility).order('issue_count', { ascending: false }),
    supabase.from('v_monthly_trend').select('facility, year_month, total_issues, rounds_count, safety_count, it_count').eq('facility', facility),
    supabase.from('v_staff_summary').select('*').eq('facility', facility).order('total_issues', { ascending: false }),
  ]);

  return NextResponse.json({
    stats: statsRes.data,
    groups: groupsRes.data || [],
    trend: trendRes.data || [],
    staff: staffRes.data || [],
  });
}
