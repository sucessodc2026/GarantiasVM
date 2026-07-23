'use client';

import { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          className={`w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger-muted)]' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs text-[var(--danger)]">{error}</span>
      )}
    </div>
  );
}
