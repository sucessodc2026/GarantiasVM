'use client';

import { ReactNode } from 'react';

interface Tab {
  value: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (value: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1.5">
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]/30'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
