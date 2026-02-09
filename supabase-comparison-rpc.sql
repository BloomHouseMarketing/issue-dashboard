-- ═══════════════════════════════════════════════════════════════════════
-- COMPARISON RPC — Run this AFTER the main schema (supabase-schema-v4.sql)
-- Supabase → SQL Editor → New query → Paste → Run
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────
-- RPC: get_month_comparison()
--
-- Compare any 2 months side by side.
-- Returns counts per issue type + percentage change.
--
-- Usage:
--   SELECT get_month_comparison(
--       p_facility := 'OPUS',          -- or NULL for all facilities
--       p_group_name := NULL,           -- or specific group
--       p_year_a := 2026, p_month_a := 1,   -- Month A (January)
--       p_year_b := 2026, p_month_b := 2    -- Month B (February)
--   );
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_month_comparison(
    p_facility   TEXT    DEFAULT NULL,
    p_group_name TEXT    DEFAULT NULL,
    p_year_a     INTEGER DEFAULT NULL,
    p_month_a    INTEGER DEFAULT NULL,
    p_year_b     INTEGER DEFAULT NULL,
    p_month_b    INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    month_a_data JSON;
    month_b_data JSON;
    result JSON;

    a_total     BIGINT;
    a_rounds    BIGINT;
    a_safety    BIGINT;
    a_it        BIGINT;

    b_total     BIGINT;
    b_rounds    BIGINT;
    b_safety    BIGINT;
    b_it        BIGINT;
BEGIN

    -- ── Month A counts ──
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE rounds_issue IS NOT NULL),
        COUNT(*) FILTER (WHERE safety_issue IS NOT NULL),
        COUNT(*) FILTER (WHERE it_issue IS NOT NULL)
    INTO a_total, a_rounds, a_safety, a_it
    FROM issues
    WHERE (p_facility IS NULL OR facility = p_facility)
      AND (p_group_name IS NULL OR group_name = p_group_name)
      AND EXTRACT(YEAR FROM round_date) = p_year_a
      AND EXTRACT(MONTH FROM round_date) = p_month_a;

    -- ── Month B counts ──
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE rounds_issue IS NOT NULL),
        COUNT(*) FILTER (WHERE safety_issue IS NOT NULL),
        COUNT(*) FILTER (WHERE it_issue IS NOT NULL)
    INTO b_total, b_rounds, b_safety, b_it
    FROM issues
    WHERE (p_facility IS NULL OR facility = p_facility)
      AND (p_group_name IS NULL OR group_name = p_group_name)
      AND EXTRACT(YEAR FROM round_date) = p_year_b
      AND EXTRACT(MONTH FROM round_date) = p_month_b;

    -- ── Build response ──
    result := json_build_object(
        'month_a', json_build_object(
            'year',     p_year_a,
            'month',    p_month_a,
            'label',    TO_CHAR(MAKE_DATE(p_year_a, p_month_a, 1), 'Mon YYYY'),
            'total',    COALESCE(a_total, 0),
            'rounds',   COALESCE(a_rounds, 0),
            'safety',   COALESCE(a_safety, 0),
            'it',       COALESCE(a_it, 0)
        ),
        'month_b', json_build_object(
            'year',     p_year_b,
            'month',    p_month_b,
            'label',    TO_CHAR(MAKE_DATE(p_year_b, p_month_b, 1), 'Mon YYYY'),
            'total',    COALESCE(b_total, 0),
            'rounds',   COALESCE(b_rounds, 0),
            'safety',   COALESCE(b_safety, 0),
            'it',       COALESCE(b_it, 0)
        ),
        'change', json_build_object(
            'total_pct',    CASE WHEN a_total > 0
                            THEN ROUND(((b_total - a_total)::NUMERIC / a_total) * 100, 1)
                            ELSE NULL END,
            'rounds_pct',   CASE WHEN a_rounds > 0
                            THEN ROUND(((b_rounds - a_rounds)::NUMERIC / a_rounds) * 100, 1)
                            ELSE NULL END,
            'safety_pct',   CASE WHEN a_safety > 0
                            THEN ROUND(((b_safety - a_safety)::NUMERIC / a_safety) * 100, 1)
                            ELSE NULL END,
            'it_pct',       CASE WHEN a_it > 0
                            THEN ROUND(((b_it - a_it)::NUMERIC / a_it) * 100, 1)
                            ELSE NULL END,
            'total_diff',   COALESCE(b_total, 0) - COALESCE(a_total, 0),
            'rounds_diff',  COALESCE(b_rounds, 0) - COALESCE(a_rounds, 0),
            'safety_diff',  COALESCE(b_safety, 0) - COALESCE(a_safety, 0),
            'it_diff',      COALESCE(b_it, 0) - COALESCE(a_it, 0)
        ),
        'filters_applied', json_build_object(
            'facility',     p_facility,
            'group_name',   p_group_name
        )
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════════════
-- TEST IT (run after data is synced):
--
--   -- Compare Jan vs Feb 2026, all facilities:
--   SELECT get_month_comparison(NULL, NULL, 2026, 1, 2026, 2);
--
--   -- Compare Jan vs Feb 2026, OPUS only:
--   SELECT get_month_comparison('OPUS', NULL, 2026, 1, 2026, 2);
--
--   -- Year-over-year: Jan 2025 vs Jan 2026:
--   SELECT get_month_comparison('OPUS', NULL, 2025, 1, 2026, 1);
--
--   -- Specific group comparison:
--   SELECT get_month_comparison('OPUS', 'Victoria - Summer & Trais', 2026, 1, 2026, 2);
--
-- ═══════════════════════════════════════════════════════════════════════
--
-- SAMPLE RESPONSE:
-- {
--   "month_a": {
--     "year": 2026, "month": 1, "label": "Jan 2026",
--     "total": 47, "rounds": 22, "safety": 18, "it": 7
--   },
--   "month_b": {
--     "year": 2026, "month": 2, "label": "Feb 2026",
--     "total": 31, "rounds": 14, "safety": 11, "it": 6
--   },
--   "change": {
--     "total_pct": -34.0, "total_diff": -16,
--     "rounds_pct": -36.4, "rounds_diff": -8,
--     "safety_pct": -38.9, "safety_diff": -7,
--     "it_pct": -14.3, "it_diff": -1
--   },
--   "filters_applied": { "facility": "OPUS", "group_name": null }
-- }
-- ═══════════════════════════════════════════════════════════════════════
