'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  TrendingUp,
  Users,
  Settings,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';

const navConfig: Record<string, { label: string; href: string; icon: React.ReactNode }[]> = {
  direcao: [
    { label: 'Dashboard', href: '/dashboard/direcao', icon: <TrendingUp size={18} /> },
    { label: 'Usuários', href: '/dashboard/direcao/usuarios', icon: <Users size={18} /> },
    { label: 'Configurações', href: '/dashboard/direcao/configuracoes', icon: <Settings size={18} /> },
  ],
  logistica: [
    { label: 'Fila de Processo', href: '/dashboard/logistica', icon: <PackageCheck size={18} /> },
  ],
  vendedor: [
    { label: 'Minhas Garantias', href: '/dashboard/vendedor', icon: <ShieldCheck size={18} /> },
  ],
};

const roleColors: Record<string, string> = {
  vendedor: '#38BDF8',
  logistica: '#E7C438',
  direcao: '#D5194A',
};

const roleLabels: Record<string, string> = {
  vendedor: 'Vendedor',
  logistica: 'Logística',
  direcao: 'Direção',
};

export function Sidebar() {
  const { usuario } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!usuario) return null;

  const items = navConfig[usuario.tipo_usuario] || [];
  const roleColor = roleColors[usuario.tipo_usuario] || 'var(--accent)';

  return (
    <aside className="w-[220px] flex-shrink-0 bg-[var(--bg-card)] border-r border-[var(--border-subtle)] min-h-[calc(100vh-64px)] sticky top-16 self-start flex flex-col max-md:hidden">
      {/* Perfil compacto */}
      <div className="px-4 pt-5 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{
              background: `${roleColor}18`,
              border: `1px solid ${roleColor}30`,
              color: roleColor,
            }}
          >
            {usuario.nome.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {usuario.nome}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{roleLabels[usuario.tipo_usuario]}</p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer text-left ${
                isActive
                  ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <span className="flex-shrink-0 opacity-70">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Versão */}
      <div className="px-4 pb-4">
        <p className="text-[11px] text-[var(--text-muted)] text-center">Garantias VM</p>
      </div>
    </aside>
  );
}
