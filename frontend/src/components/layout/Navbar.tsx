'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const roleLabels: Record<string, string> = {
  vendedor: 'Vendedor',
  logistica: 'Logística',
  direcao: 'Direção',
};

const roleBadgeStyles: Record<string, string> = {
  vendedor: 'bg-[var(--info-muted)] text-[var(--info)] border border-[var(--info)]/25',
  logistica: 'bg-[var(--warning-muted)] text-[var(--warning)] border border-[var(--warning)]/25',
  direcao: 'bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]/25',
};

export function Navbar() {
  const { usuario, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 sticky top-0 z-50 bg-[var(--bg-base)]/85 backdrop-blur-xl border-b border-[var(--border-subtle)]">
      <div className="h-full max-w-full px-6 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <img src="/logo.png" alt="GarantiaHub" className="h-20 w-auto" />
        </div>

        <div className="flex-1" />

        {/* Menu do usuário */}
        {usuario && (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-1.5 cursor-pointer transition-colors hover:border-[var(--border-medium)]"
            >
              <div className="w-7 h-7 rounded-lg bg-[var(--accent-muted)] border border-[var(--accent)]/30 flex items-center justify-center">
                <User size={14} className="text-[var(--accent)]" />
              </div>
              <div className="text-left leading-tight max-md:hidden">
                <p className="text-xs font-semibold text-[var(--text-primary)]">{usuario.nome}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{roleLabels[usuario.tipo_usuario]}</p>
              </div>
              <ChevronDown
                size={14}
                className="text-[var(--text-muted)] transition-transform duration-200"
                style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-2 min-w-[200px] bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-xl p-2 shadow-2xl animate-fade-in z-50">
                <div className="px-3 py-2 pb-3 border-b border-[var(--border-subtle)] mb-1">
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">{usuario.nome}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${roleBadgeStyles[usuario.tipo_usuario]}`}>
                    {roleLabels[usuario.tipo_usuario]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-colors cursor-pointer"
                >
                  <LogOut size={15} />
                  Sair da conta
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
