# MHC Rounds Dashboard — Database Reference

## Supabase Connection

```
Project URL: https://rbcyxdfknuvyigwdxatt.supabase.co
Anon Key: [PASTE YOUR ANON KEY HERE]
```

```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://rbcyxdfknuvyigwdxatt.supabase.co',
  'YOUR_ANON_KEY'
)
```

---

## Tables

### 1. issues (primary data — ~2,000+ rows)

| Column | Type | Description |
|---|---|---|
| id | BIGSERIAL (PK) | Auto-increment ID |
| monday_item_id | TEXT (UNIQUE) | Monday.com item ID — upsert key |
| monday_board_id | TEXT | Monday.com board ID |
| monday_group_id | TEXT | Monday.com group ID |
| facility | TEXT NOT NULL | Facility name (OPUS, MHC, SVR, etc.) |
| facility_state | TEXT | State (California, Tennessee, Texas, Kentucky) |
| group_name | TEXT | Location/group within facility |
| item_name | TEXT | Issue title from Monday |
| round_date | DATE | When the round occurred |
| round_time | TEXT | Time of round (e.g. "01.00 am.") |
| shift | TEXT | Shift name (NOC PST, AM PST, Swing) |
| month | TEXT | Month label (OPUS only, null for others) |
| issue_status | TEXT | Current status |
| issue_type | TEXT | Type classification (OPUS only, null for others) |
| rounds_issue | TEXT | Rounds issue indicator |
| safety_issue | TEXT | Safety issue indicator |
| it_issue | TEXT | IT issue indicator |
| issue_note | TEXT | Free-text notes |
| file_urls | JSONB | Array of file URLs |
| staff_name | TEXT | Staff member involved |
| manager | TEXT | Manager name |
| hr_contact | TEXT | HR contact |
| live_monitoring_team | TEXT | Monitoring team member |
| it_team | TEXT | IT team member |
| it_number | TEXT | IT ticket/phone number |
| result_status | TEXT | Resolution status |
| result_note | TEXT | Resolution notes |
| facility_phone_call | TEXT | Facility phone (call) |
| facility_phone_txt | TEXT | Facility phone (text) |
| ticket_id | TEXT | Monday pulse/ticket ID |
| monday_last_updated | TEXT | Last updated in Monday |
| synced_at | TIMESTAMPTZ | When this row was synced |
| created_at | TIMESTAMPTZ | First inserted |
| updated_at | TIMESTAMPTZ | Last updated (auto-trigger) |

**Example queries:**
```javascript
// All issues for a facility
const { data } = await supabase
  .from('issues')
  .select('*')
  .eq('facility', 'OPUS')
  .order('round_date', { ascending: false })

// Paginated issues (page 1, 25 per page)
const { data, count } = await supabase
  .from('issues')
  .select('*', { count: 'exact' })
  .eq('facility', 'OPUS')
  .order('round_date', { ascending: false })
  .range(0, 24)

// Issues filtered by date range
const { data } = await supabase
  .from('issues')
  .select('*')
  .gte('round_date', '2026-01-01')
  .lte('round_date', '2026-01-31')

// Issues filtered by shift
const { data } = await supabase
  .from('issues')
  .select('*')
  .eq('facility', 'OPUS')
  .eq('shift', 'NOC PST')

// Search issues by item_name or issue_note
const { data } = await supabase
  .from('issues')
  .select('*')
  .or('item_name.ilike.%keyword%,issue_note.ilike.%keyword%')
```

---

### 2. facilities (13 rows)

| Column | Type | Description |
|---|---|---|
| id | BIGSERIAL (PK) | Auto-increment ID |
| name | TEXT (UNIQUE) | Facility name |
| state | TEXT | State location |
| monday_board_id | TEXT | Board ID in Monday.com |
| active | BOOLEAN | Whether facility is active |
| created_at | TIMESTAMPTZ | First inserted |

**Facilities list:**
```
OPUS       — California    — 5850650640
MHC        — California    — 5888352706
SVR        — California    — 6656211258
CAMH       — California    — 5888356201
Revival    — California    — 5888355689
Hillside   — California    — 5940275536
PCMH       — California    — 8364047545
LAMH       — California    — 18335565178
TNBH       — Tennessee     — 8364041580
NASH       — Tennessee     — 8363818592
Lonestar   — Texas         — 8596380766
Dallas     — Texas         — 18393099100
Kentucky   — Kentucky      — 18398358372
```

**Example queries:**
```javascript
// All facilities
const { data } = await supabase
  .from('facilities')
  .select('*')
  .eq('active', true)
  .order('name')

// Facilities by state
const { data } = await supabase
  .from('facilities')
  .select('*')
  .eq('state', 'California')
```

---

### 3. sync_log

| Column | Type | Description |
|---|---|---|
| id | BIGSERIAL (PK) | Auto-increment ID |
| sync_type | TEXT | 'full_sync' |
| facility | TEXT | Comma-separated facility names |
| board_id | TEXT | Comma-separated board IDs |
| items_synced | INT | Total items synced |
| group_count | INT | Total groups processed |
| status | TEXT | 'completed' or 'failed' |
| error_message | TEXT | JSON error details (null if success) |
| completed_at | TIMESTAMPTZ | When sync finished |
| created_at | TIMESTAMPTZ | When row was created |

**Example queries:**
```javascript
// Latest sync
const { data } = await supabase
  .from('sync_log')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

// Last 10 syncs
const { data } = await supabase
  .from('sync_log')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10)
```

---

## Views (query like tables)

### v_facility_overview
Aggregated stats per facility.

| Column | Type |
|---|---|
| facility | text |
| facility_state | text |
| total_issues | bigint |
| rounds_count | bigint |
| safety_count | bigint |
| it_count | bigint |
| first_issue | date |
| last_issue | date |
| group_count | bigint |

```javascript
const { data } = await supabase
  .from('v_facility_overview')
  .select('*')
  .order('total_issues', { ascending: false })
```

---

### v_monthly_trend
Monthly issue counts per facility and group.

| Column | Type |
|---|---|
| facility | text |
| facility_state | text |
| group_name | text |
| year_month | text (e.g. "2026-01") |
| issue_count | bigint |
| rounds_count | bigint |
| safety_count | bigint |
| it_count | bigint |

```javascript
// All facilities monthly trend
const { data } = await supabase
  .from('v_monthly_trend')
  .select('*')
  .order('year_month', { ascending: true })

// Single facility
const { data } = await supabase
  .from('v_monthly_trend')
  .select('*')
  .eq('facility', 'OPUS')
  .order('year_month', { ascending: true })
```

---

### v_group_breakdown
Per-group stats within each facility.

| Column | Type |
|---|---|
| facility | text |
| group_name | text |
| issue_count | bigint |
| rounds_count | bigint |
| safety_count | bigint |
| it_count | bigint |

```javascript
const { data } = await supabase
  .from('v_group_breakdown')
  .select('*')
  .eq('facility', 'OPUS')
  .order('issue_count', { ascending: false })
```

---

### v_shift_distribution
Shift breakdown per facility.

| Column | Type |
|---|---|
| facility | text |
| shift | text |
| issue_count | bigint |

```javascript
const { data } = await supabase
  .from('v_shift_distribution')
  .select('*')
  .order('facility')
```

---

### v_staff_summary
Staff involvement stats.

| Column | Type |
|---|---|
| facility | text |
| staff_name | text |
| issue_count | bigint |
| first_issue | date |
| last_issue | date |

```javascript
const { data } = await supabase
  .from('v_staff_summary')
  .select('*')
  .eq('facility', 'OPUS')
  .order('issue_count', { ascending: false })
```

---

### v_monitoring_team
Monitoring team performance.

| Column | Type |
|---|---|
| live_monitoring_team | text |
| facility | text |
| issue_count | bigint |
| first_issue | date |
| last_issue | date |

```javascript
const { data } = await supabase
  .from('v_monitoring_team')
  .select('*')
  .order('issue_count', { ascending: false })
```

---

## RPC Functions (call via supabase.rpc)

### get_dashboard_stats

Returns summary statistics. All parameters are optional (pass null for all data).

**Parameters:**
| Name | Type | Description |
|---|---|---|
| p_facility | TEXT | Filter by facility (null = all) |
| p_group | TEXT | Filter by group (null = all) |
| p_year | INT | Filter by year (null = all) |
| p_month | INT | Filter by month 1-12 (null = all) |

**Returns:** Single row with:
- total_issues, rounds_count, safety_count, it_count
- facilities_count, groups_count
- earliest_date, latest_date

```javascript
// All data
const { data } = await supabase.rpc('get_dashboard_stats', {
  p_facility: null,
  p_group: null,
  p_year: null,
  p_month: null
})

// Specific facility and month
const { data } = await supabase.rpc('get_dashboard_stats', {
  p_facility: 'OPUS',
  p_group: null,
  p_year: 2026,
  p_month: 2
})
```

---

### get_chart_data

Returns grouped data for charts. Flexible grouping.

**Parameters:**
| Name | Type | Description |
|---|---|---|
| p_facility | TEXT | Filter by facility (null = all) |
| p_group | TEXT | Filter by group (null = all) |
| p_issue_type | TEXT | 'rounds', 'safety', or 'it' (null = all) |
| p_shift | TEXT | Filter by shift (null = all) |
| p_year | INT | Filter by year (null = all) |
| p_month | INT | Filter by month (null = all) |
| p_group_by | TEXT | 'facility', 'group', 'shift', 'month', or 'issue_type' |

**Returns:** Rows with:
- label (the grouped field value)
- total_count, rounds_count, safety_count, it_count

```javascript
// Issues grouped by facility
const { data } = await supabase.rpc('get_chart_data', {
  p_facility: null,
  p_group: null,
  p_issue_type: null,
  p_shift: null,
  p_year: null,
  p_month: null,
  p_group_by: 'facility'
})

// Issues grouped by month for one facility
const { data } = await supabase.rpc('get_chart_data', {
  p_facility: 'OPUS',
  p_group: null,
  p_issue_type: null,
  p_shift: null,
  p_year: 2026,
  p_month: null,
  p_group_by: 'month'
})

// Issues grouped by shift
const { data } = await supabase.rpc('get_chart_data', {
  p_facility: null,
  p_group: null,
  p_issue_type: null,
  p_shift: null,
  p_year: null,
  p_month: null,
  p_group_by: 'shift'
})
```

---

### get_filter_options

Returns distinct values for all filterable fields. No parameters needed.

**Returns:** Single row with:
- facilities: array of facility names
- states: array of state names
- groups: array of group names
- shifts: array of shift values
- issue_statuses: array of status values
- result_statuses: array of result status values
- months: array of year-month strings

```javascript
const { data } = await supabase.rpc('get_filter_options')
// data = {
//   facilities: ["CAMH", "Dallas", "Hillside", ...],
//   states: ["California", "Kentucky", "Tennessee", "Texas"],
//   groups: ["1179 A PHOENIX HOUSE", "Allison Rd", ...],
//   shifts: ["AM PST", "NOC PST", "Swing"],
//   ...
// }
```

---

### get_month_comparison

Compares two months side by side. Returns counts for Month A, Month B, and the difference.

**Parameters:**
| Name | Type | Description |
|---|---|---|
| p_facility | TEXT | Filter by facility (null = all) |
| p_group | TEXT | Filter by group (null = all) |
| p_year_a | INT | Year of Month A |
| p_month_a | INT | Month A (1-12) |
| p_year_b | INT | Year of Month B |
| p_month_b | INT | Month B (1-12) |

**Returns:** Single row with:
- month_a_total, month_a_rounds, month_a_safety, month_a_it
- month_b_total, month_b_rounds, month_b_safety, month_b_it
- diff_total, diff_rounds, diff_safety, diff_it

```javascript
// Compare January vs February 2026
const { data } = await supabase.rpc('get_month_comparison', {
  p_facility: null,
  p_group: null,
  p_year_a: 2026,
  p_month_a: 1,
  p_year_b: 2026,
  p_month_b: 2
})

// Compare for specific facility
const { data } = await supabase.rpc('get_month_comparison', {
  p_facility: 'OPUS',
  p_group: null,
  p_year_a: 2026,
  p_month_a: 1,
  p_year_b: 2026,
  p_month_b: 2
})
```

---

## Indexes (already created)

The following indexes exist for fast queries:
- `issues.facility`
- `issues.facility_state`
- `issues.round_date`
- `issues.shift`
- `issues.issue_status`
- `issues.rounds_issue`
- `issues.safety_issue`
- `issues.it_issue`
- `issues.group_name`
- `issues.staff_name`
- `issues.live_monitoring_team`
- `issues.result_status`
- `issues.monday_board_id`
- `issues.synced_at`

---

## Important Notes

1. **Anon key only** — The frontend uses the Supabase anon key (not service_role). RLS is currently disabled but should be enabled before production.

2. **Issue type detection** — The `issue_type` column is only populated for OPUS. For other facilities, use the boolean-like columns: `rounds_issue`, `safety_issue`, `it_issue` to determine issue type. The views already handle this.

3. **Data freshness** — Data syncs every 30 minutes from Monday.com. Check `sync_log` for the latest sync status.

4. **Null handling** — Many columns can be null (especially for empty groups or facilities with different column structures). Always handle nulls in the frontend.

5. **Date range** — Data currently spans from late 2024 to February 2026. Most data is concentrated in 2025-2026.
