'use client';

import { ReactNode } from 'react';

type Tone = 'accent' | 'success' | 'warning' | 'info' | 'danger' | 'crimson';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  tone?: Tone;
}

const toneVar: Record<Tone, string> = {
  accent: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  info: 'var(--info)',
  danger: 'var(--danger)',
  crimson: 'var(--brand-crimson-fg)',
};

export function KpiCard({ label, value, subtitle, icon, tone = 'accent' }: KpiCardProps) {
  const color = toneVar[tone];

  return (
    <div
      className="relative overflow-hidden bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 flex flex-col justify-between min-h-[130px] transition-all duration-200 hover:border-[var(--border-strong)] hover:-translate-y-0.5"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* brilho de tom no canto */}
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none opacity-[0.13]"
        style={{ background: `radial-gradient(circle, ${color} 0%, transparent 68%)` }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.08em] leading-tight pt-0.5">
          {label}
        </p>
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${'color-mix(in srgb, ' + color + ' 14%, transparent)'}`, color }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="relative mt-3">
        <p className="text-[32px] font-extrabold text-[var(--text-primary)] leading-none tracking-tight tabular-nums">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-[var(--text-muted)] mt-1.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
