# Phase 2: MHC Rounds Dashboard — Plan of Action

## Built with Claude Code + Supabase

---

## Overview

A web-based dashboard that visualizes MHC Rounds data across 13 facilities in 4 states. Data lives in Supabase (synced every 30 minutes from Monday.com via n8n). The dashboard will use the existing views and RPC functions already deployed in Supabase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) or React + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts or Chart.js |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (optional — Phase 2b) |
| Hosting | Vercel or Netlify |

---

## Existing Supabase Assets (Ready to Use)

### Tables
- `issues` — 1,900+ rows across 13 facilities, 30 columns per row
- `facilities` — 13 facilities with state and board ID
- `sync_log` — Sync history

### Views (pre-built, query directly)
- `v_facility_overview` — Top-level KPIs per facility
- `v_monthly_trend` — Monthly trend by facility + group
- `v_group_breakdown` — Group breakdown per facility
- `v_shift_distribution` — Shift percentages per facility
- `v_staff_summary` — Staff involvement stats
- `v_monitoring_team` — Monitoring team performance

### RPC Functions (pre-built, call via Supabase client)
- `get_dashboard_stats(facility, group, year, month)` — Summary card data
- `get_chart_data(facility, group, issue_type, shift, year, month, group_by)` — Dynamic chart data
- `get_filter_options()` — Dropdown values from real data
- `get_month_comparison(facility, group, year_a, month_a, year_b, month_b)` — Month-over-month comparison

---

## Dashboard Pages

### Page 1: Executive Overview (Home)

**Purpose:** High-level snapshot across all 13 facilities.

**Components:**
1. **Summary Cards (top row)**
   - Total Issues (all facilities)
   - Active Facilities count
   - Issues This Month vs Last Month (% change)
   - Top Issue Type breakdown (Rounds / Safety / IT)
   - Data source: `get_dashboard_stats()`

2. **Facility Comparison Bar Chart**
   - Horizontal bar chart — all 13 facilities ranked by total issues
   - Color-coded by state (California, Tennessee, Texas, Kentucky)
   - Data source: `v_facility_overview`

3. **Monthly Trend Line Chart**
   - Line chart showing total issues per month across all facilities
   - Toggle: combined view vs per-facility lines
   - Data source: `v_monthly_trend`

4. **Issue Type Distribution (Donut/Pie)**
   - Rounds vs Safety vs IT breakdown
   - Data source: `get_chart_data(group_by='issue_type')`

5. **Shift Distribution (Stacked Bar)**
   - NOC PST / AM PST / Swing per facility
   - Data source: `v_shift_distribution`

6. **Recent Sync Status**
   - Last sync time, items synced, status badge
   - Data source: `sync_log` (latest row)

---

### Page 2: Facility Deep Dive

**Purpose:** Drill into a single facility's data.

**Components:**
1. **Facility Selector (dropdown)**
   - Populated from `get_filter_options()` → facilities

2. **Facility Summary Cards**
   - Total issues, groups, staff involved, date range
   - Data source: `get_dashboard_stats(facility=selected)`

3. **Group Breakdown Table**
   - Each group (location) within the facility
   - Columns: Group Name, Issue Count, Rounds, Safety, IT, Date Range
   - Sortable columns
   - Data source: `v_group_breakdown` filtered by facility

4. **Monthly Trend (facility-specific)**
   - Line chart for selected facility
   - Breakdown by issue type (Rounds / Safety / IT lines)
   - Data source: `v_monthly_trend` filtered by facility

5. **Staff Summary Table**
   - Staff members involved in issues at this facility
   - Columns: Name, Total Issues, Groups Involved, First/Last Issue
   - Data source: `v_staff_summary` filtered by facility

6. **Issues Table (detailed)**
   - Paginated table of all issues for this facility
   - Columns: Date, Group, Shift, Issue Status, Issue Type, Staff, Result
   - Search and filter capability
   - Data source: `issues` table filtered by facility

---

### Page 3: Month-over-Month Comparison

**Purpose:** Compare two time periods side by side.

**Components:**
1. **Period Selectors**
   - Month A picker (year + month)
   - Month B picker (year + month)
   - Facility filter (optional — all or specific)
   - Group filter (optional)

2. **Comparison Cards**
   - Side-by-side: Month A total vs Month B total
   - Percentage change badge (green ↓ = improvement, red ↑ = worse)
   - Breakdown: Rounds change, Safety change, IT change
   - Data source: `get_month_comparison()`

3. **Comparison Bar Chart**
   - Grouped bars: Month A vs Month B for each issue type
   - Data source: `get_month_comparison()`

4. **Facility-by-Facility Comparison Table**
   - Each facility's Month A vs Month B numbers
   - Highlight facilities with biggest increase/decrease
   - Data source: Loop `get_month_comparison()` per facility

---

### Page 4: Monitoring Team Performance

**Purpose:** Track monitoring team effectiveness.

**Components:**
1. **Team Leaderboard**
   - Ranked by issues reported
   - Columns: Team Member, Issues Reported, Facilities Covered, Active Days
   - Data source: `v_monitoring_team`

2. **Team Coverage Heatmap**
   - Grid: Team members × Facilities
   - Cell color = issue count
   - Data source: `issues` grouped by live_monitoring_team + facility

3. **Team Activity Timeline**
   - Calendar heatmap or timeline showing active days per team member
   - Data source: `issues` grouped by live_monitoring_team + round_date

---

## Global Features (All Pages)

### Filters Bar
- Facility (multi-select)
- State (California / Tennessee / Texas / Kentucky)
- Date Range picker
- Shift (NOC PST / AM PST / Swing)
- Issue Type
- Populated dynamically from `get_filter_options()`

### Data Freshness Indicator
- "Last synced: X minutes ago" badge in header
- From `sync_log` latest row

### Export
- Download filtered data as CSV
- Download charts as PNG (optional)

### Responsive Design
- Desktop-first but mobile-friendly
- Charts resize for tablet/mobile

---

## Build Order (Recommended Sequence)

| Step | What to Build | Priority | Complexity |
|---|---|---|---|
| 1 | Project setup (Next.js + Supabase client + Tailwind) | 🔴 Must | Low |
| 2 | Supabase connection + test RPC calls | 🔴 Must | Low |
| 3 | Global filters bar + `get_filter_options()` | 🔴 Must | Medium |
| 4 | Page 1: Executive Overview — Summary Cards | 🔴 Must | Low |
| 5 | Page 1: Facility Comparison Bar Chart | 🔴 Must | Medium |
| 6 | Page 1: Monthly Trend Line Chart | 🔴 Must | Medium |
| 7 | Page 1: Issue Type + Shift Distribution charts | 🟡 Should | Medium |
| 8 | Page 2: Facility Deep Dive — all components | 🔴 Must | Medium |
| 9 | Page 3: Month Comparison — cards + charts | 🔴 Must | Medium |
| 10 | Page 4: Monitoring Team Performance | 🟡 Should | Medium |
| 11 | Issues detail table with pagination + search | 🟡 Should | Medium |
| 12 | Export functionality (CSV) | 🟢 Nice | Low |
| 13 | Auth (Supabase Auth + RLS policies) | 🟢 Nice | High |
| 14 | Hosting + deployment | 🔴 Must | Low |

---

## Supabase Connection Setup

```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rbcyxdfknuvyigwdxatt.supabase.co'
const supabaseAnonKey = 'YOUR_ANON_KEY'  // Use anon key for frontend (not service_role)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Example: Calling RPC Functions
```javascript
// Get dashboard stats
const { data } = await supabase.rpc('get_dashboard_stats', {
  p_facility: 'OPUS',
  p_year: 2026,
  p_month: 2
})

// Get filter options
const { data: filters } = await supabase.rpc('get_filter_options')

// Get month comparison
const { data: comparison } = await supabase.rpc('get_month_comparison', {
  p_facility: 'OPUS',
  p_year_a: 2026, p_month_a: 1,
  p_year_b: 2026, p_month_b: 2
})
```

### Example: Querying Views
```javascript
// Facility overview
const { data } = await supabase.from('v_facility_overview').select('*')

// Monthly trend for specific facility
const { data } = await supabase
  .from('v_monthly_trend')
  .select('*')
  .eq('facility', 'OPUS')
  .order('year_month', { ascending: false })
```

---

## Design Guidelines

- **Color palette:** Use consistent colors per facility across all charts
- **State grouping:** California (blue tones), Tennessee (green tones), Texas (orange tones), Kentucky (purple tones)
- **Issue type colors:** Rounds = Blue, Safety = Red/Orange, IT = Gray
- **Shift colors:** NOC PST = Dark Blue, AM PST = Yellow, Swing = Green
- **Typography:** Clean, professional — suitable for healthcare management
- **No fluff:** Data-dense, every pixel should inform a decision

---

## Security Notes

- Frontend uses Supabase `anon` key (not service_role)
- RLS policies should be enabled before going to production
- Service_role key stays in n8n only (backend sync)
- Consider Supabase Auth for user login if dashboard is shared externally

---

## Files to Give Claude Code

When starting Phase 2 with Claude Code, provide:
1. This plan document
2. The Supabase schema SQL (`supabase-schema-v4.sql`)
3. The comparison RPC SQL (`supabase-comparison-rpc.sql`)
4. Your Supabase project URL and anon key
5. Sample data screenshot from Supabase (so Claude Code can see the data shape)
