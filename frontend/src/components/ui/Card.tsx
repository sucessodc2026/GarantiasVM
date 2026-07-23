'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', padding = true, style }: CardProps) {
  return (
    <div
      className={`bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl ${
        padding ? 'p-6' : ''
      } ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
