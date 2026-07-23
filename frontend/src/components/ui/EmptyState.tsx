'use client';

import { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl">
      <div className="text-[var(--text-muted)] mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-[var(--text-secondary)] mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--text-muted)] mb-6 max-w-xs text-center">{description}</p>
      )}
      {action && (
        <Button variant="primary" size="md" icon={action.icon} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
