'use client';

import { ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-[var(--success-muted)] text-[var(--success)] border border-[var(--success)]/25',
  warning: 'bg-[var(--warning-muted)] text-[var(--warning)] border border-[var(--warning)]/25',
  danger: 'bg-[var(--danger-muted)] text-[var(--danger)] border border-[var(--danger)]/25',
  info: 'bg-[var(--info-muted)] text-[var(--info)] border border-[var(--info)]/25',
  neutral: 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]',
};

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
