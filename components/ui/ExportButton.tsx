'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useFilters } from '@/components/providers/FilterProvider';
import { SHORT_MONTH_NAMES } from '@/lib/constants';

interface ExportButtonProps {
  chartRef: React.RefObject<HTMLDivElement | null>;
  title: string;
}

export default function ExportButton({ chartRef, title }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { filters } = useFilters();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const getFilterSummary = useCallback((): string[] => {
    const parts: string[] = [];
    if (filters.facility) parts.push(`Facility: ${filters.facility}`);
    if (filters.shift) parts.push(`Shift: ${filters.shift}`);
    if (filters.year) parts.push(`Year: ${filters.year}`);
    if (filters.monthFrom !== null || filters.monthTo !== null) {
      const from = filters.monthFrom !== null ? SHORT_MONTH_NAMES[filters.monthFrom - 1] : 'Jan';
      const to = filters.monthTo !== null ? SHORT_MONTH_NAMES[filters.monthTo - 1] : 'Dec';
      parts.push(`Months: ${from} – ${to}`);
    }
    if (filters.issueTypes.length > 0) parts.push(`Types: ${filters.issueTypes.join(', ')}`);
    if (filters.issueSubTypes.length > 0) parts.push(`Sub-types: ${filters.issueSubTypes.join(', ')}`);
    return parts;
  }, [filters]);

  const captureChart = async (): Promise<HTMLCanvasElement | null> => {
    if (!chartRef.current) return null;
    const html2canvas = (await import('html2canvas')).default;
    return html2canvas(chartRef.current, {
      backgroundColor: '#0F172A',
      scale: 2,
      useCORS: true,
      logging: false,
    });
  };

  const exportPNG = async () => {
    setExporting(true);
    setOpen(false);
    try {
      const canvas = await captureChart();
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const exportPDF = async () => {
    setExporting(true);
    setOpen(false);
    try {
      const canvas = await captureChart();
      if (!canvas) return;

      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 15;

      // Title
      pdf.setFontSize(18);
      pdf.setTextColor(30, 41, 59);
      pdf.text(title, margin, margin + 5);

      // Filters
      const filterParts = getFilterSummary();
      let yPos = margin + 12;
      if (filterParts.length > 0) {
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Filters: ${filterParts.join('  |  ')}`, margin, yPos);
        yPos += 6;
      }

      // Timestamp
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Exported: ${new Date().toLocaleString()}`, margin, yPos);
      yPos += 8;

      // Chart image
      const imgData = canvas.toDataURL('image/png');
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height / canvas.width) * imgW;
      const maxH = pageH - yPos - margin;
      const finalH = Math.min(imgH, maxH);
      const finalW = (finalH / imgH) * imgW;

      pdf.addImage(imgData, 'PNG', margin, yPos, finalW, finalH);

      pdf.save(`${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="group/export p-1.5 rounded-lg transition-all duration-200 hover:bg-white/10"
        title="Export chart"
      >
        {exporting ? (
          <svg className="w-4 h-4 text-[#3B82F6] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 text-[#475569] transition-colors duration-200 group-hover/export:text-[#94A3B8]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.572 4.97A4.5 4.5 0 0118 19.5H6.75z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-lg border border-[#334155] bg-[#1E293B] shadow-xl overflow-hidden">
          <button
            onClick={exportPNG}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#CBD5E1] hover:bg-[#334155] hover:text-[#F8FAFC] transition-colors"
          >
            <svg className="w-4 h-4 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            Export PNG
          </button>
          <button
            onClick={exportPDF}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#CBD5E1] hover:bg-[#334155] hover:text-[#F8FAFC] transition-colors"
          >
            <svg className="w-4 h-4 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
