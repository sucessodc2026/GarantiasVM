'use client';

import { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
}

export function KpiCard({ label, value, subtitle, icon }: KpiCardProps) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 transition-colors hover:border-[var(--border-medium)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold text-[var(--text-primary)] leading-none tracking-tight mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
