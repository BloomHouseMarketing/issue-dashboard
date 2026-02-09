'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { timeAgo, getSyncStatusColor } from '@/lib/utils';

interface SyncInfo {
  status: string;
  items_synced: number;
  completed_at: string;
}

export default function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const [sync, setSync] = useState<SyncInfo | null>(null);

  useEffect(() => {
    async function fetchSync() {
      const { data } = await supabase
        .from('sync_log')
        .select('status, items_synced, completed_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) setSync(data);
    }
    fetchSync();
  }, []);

  const minutesAgo = sync?.completed_at
    ? Math.floor((Date.now() - new Date(sync.completed_at).getTime()) / 60000)
    : 999;

  return (
    <header className="h-16 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-lg hover:bg-[#334155] text-[#94A3B8]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-[#F8FAFC] hidden sm:block">
          Rounds Monitoring Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {sync && (
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <span className={`w-2 h-2 rounded-full ${getSyncStatusColor(minutesAgo)}`} />
            <span>Synced {timeAgo(sync.completed_at)}</span>
            <span className="text-[#64748B]">({sync.items_synced} items)</span>
          </div>
        )}
      </div>
    </header>
  );
}
