'use client';

import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  emptyMessage,
}: TableProps<T>) {
  if (data.length === 0) {
    return emptyMessage ? (
      <p className="text-sm text-[var(--text-muted)] text-center py-12">{emptyMessage}</p>
    ) : null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
      <div
        className="grid gap-3 px-5 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)]"
        style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
      >
        {columns.map((col) => (
          <span
            key={col.key}
            className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider"
          >
            {col.header}
          </span>
        ))}
      </div>
      <div>
        {data.map((item, i) => (
          <div
            key={keyExtractor(item)}
            className="grid gap-3 px-5 py-3 items-center transition-colors hover:bg-[var(--bg-hover)]"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
              borderBottom: i < data.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            {columns.map((col) => (
              <div key={col.key} className={col.className || ''}>
                {col.render ? col.render(item) : <span className="text-sm text-[var(--text-secondary)]">{item[col.key]}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
