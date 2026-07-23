'use client';

import { ReactNode, useEffect } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({ open, onClose, title, subtitle, children, footer }: DrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] animate-fade-in"
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 bottom-0 w-[520px] max-w-[95vw] bg-[var(--bg-card)] border-l border-[var(--border-medium)] z-[201] flex flex-col overflow-hidden animate-slide-in-right shadow-2xl"
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between px-7 pt-7 pb-4 border-b border-[var(--border-subtle)] flex-shrink-0">
            <div>
              {title && <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>}
              {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-medium)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all flex-shrink-0 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {children}
        </div>
        {footer && (
          <div className="px-7 py-4 border-t border-[var(--border-subtle)] flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
