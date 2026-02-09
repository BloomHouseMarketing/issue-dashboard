# MHC Rounds Dashboard — Design System

---

## 1. Color Palette

### State Colors (used in facility charts)
```
California  → #3B82F6 (blue-500)     — 8 facilities
Tennessee   → #10B981 (emerald-500)   — 2 facilities (TNBH, NASH)
Texas       → #F59E0B (amber-500)     — 2 facilities (Lonestar, Dallas)
Kentucky    → #8B5CF6 (violet-500)    — 1 facility
```

### Facility Colors (when showing all 13 individually)
```
OPUS       → #2563EB (blue-600)
MHC        → #3B82F6 (blue-500)
SVR        → #60A5FA (blue-400)
CAMH       → #93C5FD (blue-300)
Revival    → #1D4ED8 (blue-700)
Hillside   → #1E40AF (blue-800)
PCMH       → #7DD3FC (sky-300)
LAMH       → #0EA5E9 (sky-500)
TNBH       → #10B981 (emerald-500)
NASH       → #34D399 (emerald-400)
Lonestar   → #F59E0B (amber-500)
Dallas     → #FBBF24 (amber-400)
Kentucky   → #8B5CF6 (violet-500)
```

### Issue Type Colors
```
Rounds     → #3B82F6 (blue-500)
Safety     → #EF4444 (red-500)
IT         → #6B7280 (gray-500)
```

### Shift Colors
```
NOC PST    → #1E3A5F (dark blue)
AM PST     → #FBBF24 (amber-400)
Swing      → #10B981 (emerald-500)
```

### Status Colors
```
Completed  → #10B981 (green)
Failed     → #EF4444 (red)
Running    → #F59E0B (amber)
Improvement (↓ issues) → #10B981 (green)
Worsening (↑ issues)   → #EF4444 (red)
No Change              → #6B7280 (gray)
```

### UI Colors
```
Background       → #0F172A (slate-900) — dark mode primary
Surface          → #1E293B (slate-800) — cards, panels
Surface Hover    → #334155 (slate-700)
Border           → #334155 (slate-700)
Text Primary     → #F8FAFC (slate-50)
Text Secondary   → #94A3B8 (slate-400)
Text Muted       → #64748B (slate-500)
Accent           → #3B82F6 (blue-500)
Accent Hover     → #2563EB (blue-600)
```

### Light Mode Alternative (if needed)
```
Background       → #F8FAFC (slate-50)
Surface          → #FFFFFF (white)
Border           → #E2E8F0 (slate-200)
Text Primary     → #0F172A (slate-900)
Text Secondary   → #475569 (slate-600)
```

---

## 2. Typography

### Font Family
```
Primary: Inter (Google Fonts) — clean, modern, excellent at small sizes
Monospace: JetBrains Mono — for numbers, IDs, code
```

### Font Sizes
```
Page Title     → text-2xl (24px) font-bold
Section Title  → text-lg (18px) font-semibold
Card Title     → text-sm (14px) font-medium text-secondary
Card Value     → text-3xl (30px) font-bold
Table Header   → text-xs (12px) font-semibold uppercase tracking-wider
Table Body     → text-sm (14px) font-normal
Label          → text-xs (12px) font-medium
Badge          → text-xs (12px) font-semibold
```

---

## 3. Layout

### Page Structure
```
┌─────────────────────────────────────────────────────┐
│ HEADER — Logo, Title, Sync Status, User             │
├──────────┬──────────────────────────────────────────┤
│          │ FILTER BAR — Facility, State, Date, etc. │
│          ├──────────────────────────────────────────┤
│ SIDEBAR  │                                          │
│          │ MAIN CONTENT                             │
│ Nav      │                                          │
│ Links    │ (Cards, Charts, Tables)                  │
│          │                                          │
│          │                                          │
├──────────┴──────────────────────────────────────────┤
│ FOOTER — Last synced, version                       │
└─────────────────────────────────────────────────────┘
```

### Sidebar
- Width: 240px (desktop), collapsible to 64px (icons only)
- Hidden on mobile (hamburger menu)
- Nav items: Overview, Facility, Comparison, Team

### Content Area
- Max width: 1400px, centered
- Padding: 24px (p-6)
- Grid: 12-column for card layouts

### Card Grid
```
Summary Cards:    4 columns (lg), 2 columns (md), 1 column (sm)
Chart Cards:      2 columns (lg), 1 column (md)
Full-width Cards: 1 column always
```

---

## 4. Component Specifications

### Summary Stat Card
```
┌─────────────────────────┐
│ 📊 Total Issues    ↑12% │  ← title (text-sm, muted) + change badge
│                         │
│ 1,878                   │  ← value (text-3xl, bold)
│                         │
│ Across 13 facilities    │  ← subtitle (text-xs, muted)
└─────────────────────────┘

- Background: surface color
- Border: 1px border color
- Border-radius: rounded-xl (12px)
- Padding: p-6
- Shadow: shadow-sm
- Change badge: green for decrease (fewer issues = good), red for increase
```

### Chart Card
```
┌─────────────────────────────────────┐
│ Monthly Trend              [Toggle] │  ← header row
│                                     │
│  ╭─────────────────────────────╮    │
│  │                             │    │
│  │     (Chart Area)            │    │
│  │                             │    │
│  │                             │    │
│  ╰─────────────────────────────╯    │
└─────────────────────────────────────┘

- Same styling as stat card
- Chart height: 300px (lg), 250px (md), 200px (sm)
- Chart margins: { top: 20, right: 30, left: 20, bottom: 20 }
```

### Data Table
```
┌──────┬──────────┬───────┬────────┬────────┐
│ Name │ Issues   │ Rounds│ Safety │ IT     │  ← sticky header, uppercase, muted
├──────┼──────────┼───────┼────────┼────────┤
│ OPUS │ 357      │ 88    │ 58     │ 24     │  ← alternating row bg (subtle)
│ MHC  │ 317      │ 72    │ 45     │ 18     │
│ SVR  │ 80       │ 22    │ 15     │ 8      │
└──────┴──────────┴───────┴────────┴────────┘

- Header: bg-surface, text-xs, uppercase, tracking-wider
- Rows: hover:bg-surface-hover, border-b border-border
- Sortable columns: click header to sort (arrow indicator)
- Pagination: 25 rows per page, bottom-right controls
```

### Filter Bar
```
┌─────────────────────────────────────────────────────┐
│ [Facility ▾] [State ▾] [Date Range] [Shift ▾] [🔄] │
└─────────────────────────────────────────────────────┘

- Sticky below header
- Background: surface color
- Dropdowns: multi-select capable
- Reset button (🔄) clears all filters
- Applied filters show as removable chips below
```

### Badge (Change Indicator)
```
Improvement:  ↓ 12%  — green bg, green text, rounded-full
Worsening:    ↑ 8%   — red bg, red text, rounded-full
No Change:    — 0%   — gray bg, gray text, rounded-full
```

### Sync Status Indicator
```
● Synced 5 min ago    — green dot
● Synced 45 min ago   — amber dot (stale)
● Sync failed         — red dot
```

---

## 5. Chart Guidelines

### General Rules
- Always include a legend (bottom or right)
- Always include axis labels
- Use consistent colors from this design system
- Tooltips on hover showing exact values
- Animate on load (300ms ease-out)
- No chart junk — remove unnecessary gridlines, borders

### Bar Charts
- Border-radius on top: rounded-t-sm (2px)
- Bar gap: 4px between bars
- Horizontal bars for facility comparison (easier to read 13 names)
- Vertical bars for time-based comparisons

### Line Charts
- Stroke width: 2px
- Dots on data points: 4px radius
- Area fill: 10% opacity of line color
- Curved lines (type="monotone")

### Pie/Donut Charts
- Inner radius: 60% (donut, not full pie)
- Show percentages on segments
- Max 6 segments (group smaller ones into "Other")

### Heatmaps
- Use sequential color scale (light → dark of a single hue)
- Include value in each cell
- Row/column headers visible

---

## 6. Responsive Breakpoints

```
sm:  640px   — Mobile
md:  768px   — Tablet
lg:  1024px  — Desktop
xl:  1280px  — Large desktop
2xl: 1536px  — Ultra-wide
```

### Behavior
- **Mobile (sm):** Single column, sidebar hidden, charts stack vertically, simplified tables
- **Tablet (md):** 2-column grid, collapsible sidebar, full tables
- **Desktop (lg+):** Full layout, expanded sidebar, multi-column grids

---

## 7. Loading & Error States

### Loading
- Skeleton screens (pulsing gray blocks) matching component shapes
- No spinners — use Tailwind's `animate-pulse` on placeholder blocks
- Charts show empty axis with skeleton overlay

### Error
- Inline error message within the component that failed
- "Retry" button
- Don't break the whole page for one failed query

### Empty State
- Centered icon + message: "No data for the selected filters"
- Suggest action: "Try adjusting your filters or selecting a different time period"

---

## 8. Interaction Patterns

- **Hover:** All interactive elements show pointer cursor + subtle bg change
- **Click on facility bar chart:** Navigate to Facility Deep Dive for that facility
- **Click on table row:** Expand inline detail or navigate to detail view
- **Filter changes:** Instant update (no "Apply" button needed)
- **Chart toggle:** Smooth transition between views (300ms)

---

## 9. Healthcare Context

This dashboard is used by healthcare facility managers to:
- Monitor overnight rounds compliance
- Track safety incidents across locations
- Identify patterns in IT infrastructure issues
- Compare facility performance month-over-month
- Evaluate monitoring team effectiveness

**Important:** The tone should be professional, clinical, and data-focused. No playful elements. This is a tool for healthcare operations management.
