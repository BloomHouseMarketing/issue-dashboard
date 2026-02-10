import { NextRequest, NextResponse } from 'next/server';
import { supabase, PAGE_SIZE } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    fields = 'facility, round_date, shift, issue_status, rounds_issue, safety_issue, it_issue, group_name, staff_name',
    facility,
    shift,
    year,
    monthFrom,
    monthTo,
    issueTypes,
    issueSubTypes,
    roundsIssues,
    safetyIssues,
    itIssues,
    // For facility page paginated table
    search,
    page,
    pageSize,
    orderBy,
    orderAsc,
    countOnly,
  } = body;

  let query = supabase.from('issues').select(fields, countOnly ? { count: 'exact' } : undefined);

  if (facility) query = query.eq('facility', facility);
  if (shift) query = query.eq('shift', shift);

  // Date filtering
  if (year && monthFrom && monthTo) {
    const startDate = `${year}-${String(monthFrom).padStart(2, '0')}-01`;
    const endMonth = monthTo === 12 ? 1 : monthTo + 1;
    const endYear = monthTo === 12 ? year + 1 : year;
    query = query.gte('round_date', startDate).lt('round_date', `${endYear}-${String(endMonth).padStart(2, '0')}-01`);
  } else if (year && monthFrom) {
    query = query.gte('round_date', `${year}-${String(monthFrom).padStart(2, '0')}-01`).lt('round_date', `${year + 1}-01-01`);
  } else if (year && monthTo) {
    const endMonth = monthTo === 12 ? 1 : monthTo + 1;
    const endYear = monthTo === 12 ? year + 1 : year;
    query = query.gte('round_date', `${year}-01-01`).lt('round_date', `${endYear}-${String(endMonth).padStart(2, '0')}-01`);
  } else if (year) {
    query = query.gte('round_date', `${year}-01-01`).lt('round_date', `${year + 1}-01-01`);
  }

  // Issue type filter
  if (issueTypes && issueTypes.length > 0) {
    const conds: string[] = [];
    if (issueTypes.includes('Rounds')) conds.push('rounds_issue.not.is.null');
    if (issueTypes.includes('Safety')) conds.push('safety_issue.not.is.null');
    if (issueTypes.includes('IT')) conds.push('it_issue.not.is.null');
    if (conds.length > 0) query = query.or(conds.join(','));
  }

  // Issue sub-type filter
  if (issueSubTypes && issueSubTypes.length > 0) {
    const roundsSubs = issueSubTypes.filter((s: string) => roundsIssues?.includes(s));
    const safetySubs = issueSubTypes.filter((s: string) => safetyIssues?.includes(s));
    const itSubs = issueSubTypes.filter((s: string) => itIssues?.includes(s));
    const orConds: string[] = [];
    if (roundsSubs.length > 0) orConds.push(`rounds_issue.in.(${roundsSubs.join(',')})`);
    if (safetySubs.length > 0) orConds.push(`safety_issue.in.(${safetySubs.join(',')})`);
    if (itSubs.length > 0) orConds.push(`it_issue.in.(${itSubs.join(',')})`);
    if (orConds.length > 0) query = query.or(orConds.join(','));
  }

  // Search (for facility page)
  if (search) {
    query = query.or(`item_name.ilike.%${search}%,issue_note.ilike.%${search}%`);
  }

  // Ordering
  if (orderBy) {
    query = query.order(orderBy, { ascending: orderAsc ?? false });
  }

  // Pagination: either explicit page/pageSize or fetch all with batching
  if (typeof page === 'number' && pageSize) {
    query = query.range(page * pageSize, (page + 1) * pageSize - 1);
    const { data, count, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, count });
  }

  // Fetch all rows with pagination past 1000-row limit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allRows: any[] = [];
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (data && data.length > 0) {
      allRows.push(...data);
      hasMore = data.length === PAGE_SIZE;
      from += PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return NextResponse.json({ data: allRows });
}
