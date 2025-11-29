'use client';

import { useTabsStore } from '@/store/tabs';
import { useSessionStore } from '@/store/session';
import { formatDateTime } from '@/lib/date';
import { useEffect, useState } from 'react';

export const FooterBar = () => {
  const { tabs, activeTabId } = useTabsStore();
  const { user } = useSessionStore();
  const [currentTime, setCurrentTime] = useState(formatDateTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatDateTime());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <footer className="sticky bottom-0 z-40 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/80">
      <div className="flex h-12 items-center justify-between px-6 text-sm">
        <div className="flex items-center gap-2 text-neutral-400">
          <span className="font-medium text-white">{activeTab?.title || 'Home'}</span>
        </div>

        <div className="text-center text-neutral-300">
          {currentTime}
        </div>

        <div className="text-right text-neutral-400">
          <span className="font-medium text-white">{user?.email || 'Guest'}</span>
        </div>
      </div>
    </footer>
  );
};
