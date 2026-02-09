-- ═══════════════════════════════════════════════════════════════════════
-- MHC ROUNDS — SUPABASE SCHEMA v4 (Final)
-- BloomHouse Marketing
-- ═══════════════════════════════════════════════════════════════════════
--
-- Based on actual OPUS board export analysis.
-- 24 Monday.com columns (Subitems excluded) + system fields.
-- Designed for 12 boards × N groups → single unified table.
--
-- RUN THIS: Supabase → SQL Editor → New query → Paste → Run
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────
-- TABLE 1: issues (main table — all facilities, all groups)
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS issues (

    -- ── Primary Key ──
    id                      BIGSERIAL PRIMARY KEY,

    -- ── Monday.com Identifiers ──
    monday_item_id          TEXT UNIQUE NOT NULL,
    monday_board_id         TEXT NOT NULL,
    monday_group_id         TEXT,

    -- ── System Fields (set by workflow, not from Monday columns) ──
    facility                TEXT NOT NULL,           -- From Board Registry: "OPUS", "MHC", "SVR", etc.
    facility_state          TEXT,                    -- From Board Registry: "California", "Texas", etc.
    group_name              TEXT NOT NULL,           -- Monday group title: "No Findings", "Victoria - Summer & Trais", etc.

    -- ── Monday Column: Name ──
    item_name               TEXT,                    -- Monday item name (e.g., "CA MSR REPORT", "no finding")

    -- ── Monday Column: Round Date ──
    round_date              DATE,

    -- ── Monday Column: Time ──
    round_time              TEXT,                    -- "01.00 am.", "2:30 PM", etc.

    -- ── Monday Column: Shift ──
    shift                   TEXT,                    -- "NOC PST", "AM PST", "Swing"

    -- ── Monday Column: Month ──
    month                   TEXT,                    -- "JAN", "FEB", "MAR", etc.

    -- ── Monday Column: Issue Status ──
    issue_status            TEXT,

    -- ── Monday Column: Issue Type ──
    issue_type              TEXT,                    -- Directly from Monday (not auto-derived)

    -- ── Monday Column: Rounds Issue ──
    rounds_issue            TEXT,                    -- "Staff Inactive", "Door Not Secured", etc.

    -- ── Monday Column: Safety Issue ──
    safety_issue            TEXT,                    -- "Limited Vision", "Meds Dropped", "Staff Behavior Concern", etc.

    -- ── Monday Column: IT Issue ──
    it_issue                TEXT,                    -- "Cam Login/PW Error", etc.

    -- ── Monday Column: Issue Note ──
    issue_note              TEXT,                    -- Long text description

    -- ── Monday Column: Files ──
    file_urls               TEXT[],                  -- Array of evidence URLs

    -- ── Monday Column: Staff ──
    staff_name              TEXT,

    -- ── Monday Column: Manager ──
    manager                 TEXT,

    -- ── Monday Column: HR ──
    hr_contact              TEXT,

    -- ── Monday Column: Live Monitoring Team ──
    live_monitoring_team    TEXT,

    -- ── Monday Column: IT Team ──
    it_team                 TEXT,

    -- ── Monday Column: IT Number ──
    it_number               TEXT,

    -- ── Monday Column: Result Status ──
    result_status           TEXT,

    -- ── Monday Column: Result Note ──
    result_note             TEXT,

    -- ── Monday Column: Facility Phone - Call ──
    facility_phone_call     TEXT,

    -- ── Monday Column: Facility Phone - Txt ──
    facility_phone_txt      TEXT,

    -- ── Monday Column: Ticket ID ──
    ticket_id               TEXT,

    -- ── Monday Column: Last updated ──
    monday_last_updated     TEXT,                    -- Raw string: "Person Date Time"

    -- ── Sync Timestamps ──
    synced_at               TIMESTAMPTZ DEFAULT NOW(),
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────

-- Filter indexes (what the dashboard queries most)
CREATE INDEX idx_issues_facility         ON issues (facility);
CREATE INDEX idx_issues_group_name       ON issues (group_name);
CREATE INDEX idx_issues_round_date       ON issues (round_date);
CREATE INDEX idx_issues_shift            ON issues (shift);
CREATE INDEX idx_issues_month            ON issues (month);
CREATE INDEX idx_issues_issue_type       ON issues (issue_type);
CREATE INDEX idx_issues_issue_status     ON issues (issue_status);
CREATE INDEX idx_issues_ticket_id        ON issues (ticket_id);

-- Composite indexes (common dashboard filter combos)
CREATE INDEX idx_issues_facility_date    ON issues (facility, round_date);
CREATE INDEX idx_issues_facility_group   ON issues (facility, group_name);
CREATE INDEX idx_issues_facility_type    ON issues (facility, issue_type);
CREATE INDEX idx_issues_facility_shift   ON issues (facility, shift, round_date);

-- Sync indexes
CREATE INDEX idx_issues_monday_board     ON issues (monday_board_id);
CREATE INDEX idx_issues_synced_at        ON issues (synced_at);


-- ─────────────────────────────────────────────────────────────────────
-- AUTO-UPDATE TRIGGER (updated_at)
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();


-- ─────────────────────────────────────────────────────────────────────
-- TABLE 2: facilities (auto-populated by sync workflow)
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS facilities (
    id                  BIGSERIAL PRIMARY KEY,
    name                TEXT UNIQUE NOT NULL,       -- "OPUS", "MHC", "SVR", etc.
    state               TEXT,                       -- "California", "Texas", etc.
    monday_board_id     TEXT,                       -- Board ID for this facility
    active              BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────
-- TABLE 3: sync_log (tracks every sync run)
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sync_log (
    id                  BIGSERIAL PRIMARY KEY,
    sync_type           TEXT NOT NULL,              -- "full_sync", "single_board", "manual"
    facility            TEXT,                       -- Which facility synced, or "ALL"
    board_id            TEXT,
    group_count         INTEGER DEFAULT 0,          -- How many groups were synced
    items_synced        INTEGER DEFAULT 0,
    status              TEXT DEFAULT 'running',     -- "running", "completed", "failed"
    error_message       TEXT,
    started_at          TIMESTAMPTZ DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);


-- ─────────────────────────────────────────────────────────────────────
-- VIEW: Facility Comparison (top-level KPIs per facility)
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_facility_overview AS
SELECT
    facility,
    COUNT(*)                                                    AS total_issues,
    COUNT(DISTINCT group_name)                                  AS group_count,
    COUNT(*) FILTER (WHERE issue_type IS NOT NULL)              AS typed_issues,
    COUNT(*) FILTER (WHERE rounds_issue IS NOT NULL)            AS rounds_count,
    COUNT(*) FILTER (WHERE safety_issue IS NOT NULL)            AS safety_count,
    COUNT(*) FILTER (WHERE it_issue IS NOT NULL)                AS it_count,
    COUNT(DISTINCT staff_name)
        FILTER (WHERE staff_name IS NOT NULL)                   AS unique_staff,
    COUNT(DISTINCT shift) FILTER (WHERE shift IS NOT NULL)      AS shift_count,
    MIN(round_date)                                             AS earliest_date,
    MAX(round_date)                                             AS latest_date
FROM issues
GROUP BY facility
ORDER BY total_issues DESC;


-- ─────────────────────────────────────────────────────────────────────
-- VIEW: Monthly Trend by Facility
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_monthly_trend AS
SELECT
    facility,
    group_name,
    TO_CHAR(round_date, 'YYYY-MM')                             AS year_month,
    EXTRACT(YEAR FROM round_date)::INTEGER                      AS year,
    EXTRACT(MONTH FROM round_date)::INTEGER                     AS month_num,
    COUNT(*)                                                    AS total_issues,
    COUNT(*) FILTER (WHERE rounds_issue IS NOT NULL)            AS rounds_count,
    COUNT(*) FILTER (WHERE safety_issue IS NOT NULL)            AS safety_count,
    COUNT(*) FILTER (WHERE it_issue IS NOT NULL)                AS it_count
FROM issues
WHERE round_date IS NOT NULL
GROUP BY facility, group_name,
         TO_CHAR(round_date, 'YYYY-MM'),
         EXTRACT(YEAR FROM round_date),
         EXTRACT(MONTH FROM round_date)
ORDER BY year DESC, month_num DESC;


-- ─────────────────────────────────────────────────────────────────────
-- VIEW: Group Breakdown per Facility
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_group_breakdown AS
SELECT
    facility,
    group_name,
    COUNT(*)                                                    AS issue_count,
    COUNT(*) FILTER (WHERE rounds_issue IS NOT NULL)            AS rounds_count,
    COUNT(*) FILTER (WHERE safety_issue IS NOT NULL)            AS safety_count,
    COUNT(*) FILTER (WHERE it_issue IS NOT NULL)                AS it_count,
    MIN(round_date)                                             AS earliest,
    MAX(round_date)                                             AS latest
FROM issues
GROUP BY facility, group_name
ORDER BY facility, issue_count DESC;


-- ─────────────────────────────────────────────────────────────────────
-- VIEW: Shift Distribution
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_shift_distribution AS
SELECT
    facility,
    shift,
    COUNT(*)                                                    AS issue_count,
    ROUND(
        COUNT(*)::NUMERIC /
        NULLIF(SUM(COUNT(*)) OVER (PARTITION BY facility), 0) * 100,
    1)                                                          AS percentage
FROM issues
WHERE shift IS NOT NULL
GROUP BY facility, shift
ORDER BY facility, issue_count DESC;


-- ─────────────────────────────────────────────────────────────────────
-- VIEW: Staff Summary
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_staff_summary AS
SELECT
    staff_name,
    facility,
    COUNT(*)                                                    AS total_issues,
    COUNT(DISTINCT group_name)                                  AS groups_involved,
    COUNT(*) FILTER (WHERE rounds_issue IS NOT NULL)            AS rounds_count,
    COUNT(*) FILTER (WHERE safety_issue IS NOT NULL)            AS safety_count,
    MIN(round_date)                                             AS first_issue,
    MAX(round_date)                                             AS last_issue
FROM issues
WHERE staff_name IS NOT NULL
GROUP BY staff_name, facility
ORDER BY total_issues DESC;


-- ─────────────────────────────────────────────────────────────────────
-- VIEW: Monitoring Team Performance
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_monitoring_team AS
SELECT
    live_monitoring_team,
    COUNT(*)                                                    AS issues_reported,
    COUNT(DISTINCT facility)                                    AS facilities_covered,
    COUNT(DISTINCT round_date)                                  AS active_days,
    MIN(round_date)                                             AS first_report,
    MAX(round_date)                                             AS last_report
FROM issues
WHERE live_monitoring_team IS NOT NULL
GROUP BY live_monitoring_team
ORDER BY issues_reported DESC;


-- ─────────────────────────────────────────────────────────────────────
-- RPC: get_dashboard_stats() — Summary cards for the dashboard
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_facility TEXT DEFAULT NULL,
    p_group_name TEXT DEFAULT NULL,
    p_year INTEGER DEFAULT NULL,
    p_month INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_issues',     COUNT(*),
        'facilities_count', COUNT(DISTINCT facility),
        'groups_count',     COUNT(DISTINCT group_name),
        'by_issue_type', json_build_object(
            'rounds',   COUNT(*) FILTER (WHERE rounds_issue IS NOT NULL),
            'safety',   COUNT(*) FILTER (WHERE safety_issue IS NOT NULL),
            'it',       COUNT(*) FILTER (WHERE it_issue IS NOT NULL)
        ),
        'by_shift', json_build_object(
            'NOC_PST',  COUNT(*) FILTER (WHERE shift = 'NOC PST'),
            'AM_PST',   COUNT(*) FILTER (WHERE shift = 'AM PST'),
            'Swing',    COUNT(*) FILTER (WHERE shift = 'Swing')
        ),
        'staff_involved',   COUNT(DISTINCT staff_name) FILTER (WHERE staff_name IS NOT NULL),
        'date_range', json_build_object(
            'earliest', MIN(round_date),
            'latest',   MAX(round_date)
        )
    )
    INTO result
    FROM issues
    WHERE (p_facility IS NULL OR facility = p_facility)
      AND (p_group_name IS NULL OR group_name = p_group_name)
      AND (p_year IS NULL OR EXTRACT(YEAR FROM round_date) = p_year)
      AND (p_month IS NULL OR EXTRACT(MONTH FROM round_date) = p_month);

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─────────────────────────────────────────────────────────────────────
-- RPC: get_chart_data() — Dynamic chart data with grouping
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_chart_data(
    p_facility TEXT DEFAULT NULL,
    p_group_name TEXT DEFAULT NULL,
    p_issue_type TEXT DEFAULT NULL,
    p_shift TEXT DEFAULT NULL,
    p_year INTEGER DEFAULT NULL,
    p_month INTEGER DEFAULT NULL,
    p_group_by TEXT DEFAULT 'facility'
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    EXECUTE format(
        'SELECT json_agg(row_to_json(t)) FROM (
            SELECT %I AS label, COUNT(*) AS count
            FROM issues
            WHERE ($1 IS NULL OR facility = $1)
              AND ($2 IS NULL OR group_name = $2)
              AND ($3 IS NULL OR issue_type = $3)
              AND ($4 IS NULL OR shift = $4)
              AND ($5 IS NULL OR EXTRACT(YEAR FROM round_date) = $5)
              AND ($6 IS NULL OR EXTRACT(MONTH FROM round_date) = $6)
            GROUP BY %I
            ORDER BY count DESC
        ) t', p_group_by, p_group_by
    )
    INTO result
    USING p_facility, p_group_name, p_issue_type, p_shift, p_year, p_month;

    RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─────────────────────────────────────────────────────────────────────
-- RPC: get_filter_options() — Dynamic dropdown options from real data
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_filter_options()
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'facilities',       (SELECT json_agg(DISTINCT facility ORDER BY facility)
                             FROM issues WHERE facility IS NOT NULL),
        'groups',           (SELECT json_agg(DISTINCT group_name ORDER BY group_name)
                             FROM issues WHERE group_name IS NOT NULL),
        'issue_types',      (SELECT json_agg(DISTINCT issue_type ORDER BY issue_type)
                             FROM issues WHERE issue_type IS NOT NULL),
        'shifts',           (SELECT json_agg(DISTINCT shift ORDER BY shift)
                             FROM issues WHERE shift IS NOT NULL),
        'months',           (SELECT json_agg(DISTINCT month ORDER BY month)
                             FROM issues WHERE month IS NOT NULL),
        'years',            (SELECT json_agg(DISTINCT EXTRACT(YEAR FROM round_date)::INTEGER
                                             ORDER BY EXTRACT(YEAR FROM round_date)::INTEGER DESC)
                             FROM issues WHERE round_date IS NOT NULL),
        'staff',            (SELECT json_agg(DISTINCT staff_name ORDER BY staff_name)
                             FROM issues WHERE staff_name IS NOT NULL),
        'monitoring_team',  (SELECT json_agg(DISTINCT live_monitoring_team ORDER BY live_monitoring_team)
                             FROM issues WHERE live_monitoring_team IS NOT NULL),
        'rounds_issues',    (SELECT json_agg(DISTINCT rounds_issue ORDER BY rounds_issue)
                             FROM issues WHERE rounds_issue IS NOT NULL),
        'safety_issues',    (SELECT json_agg(DISTINCT safety_issue ORDER BY safety_issue)
                             FROM issues WHERE safety_issue IS NOT NULL),
        'it_issues',        (SELECT json_agg(DISTINCT it_issue ORDER BY it_issue)
                             FROM issues WHERE it_issue IS NOT NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════════════
-- DONE
--
-- Tables created:
--   1. issues        — Main table (24 Monday columns + 6 system fields)
--   2. facilities    — Lookup table (auto-populated by sync)
--   3. sync_log      — Sync history
--
-- Views created:
--   • v_facility_overview    — Side-by-side facility KPIs
--   • v_monthly_trend        — Monthly trend by facility + group
--   • v_group_breakdown      — Group breakdown per facility
--   • v_shift_distribution   — Shift percentages per facility
--   • v_staff_summary        — Staff involvement stats
--   • v_monitoring_team      — Monitoring team performance
--
-- RPC Functions:
--   • get_dashboard_stats()  — Summary cards with filters
--   • get_chart_data()       — Dynamic chart data with grouping
--   • get_filter_options()   — Dropdown options from actual data
-- ═══════════════════════════════════════════════════════════════════════
