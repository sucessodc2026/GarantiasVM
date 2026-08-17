'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  TrendingUp,
  Users,
  Settings,
  PackageCheck,
  ShieldCheck,
  CheckCircle,
  ThumbsDown,
  Search,
} from 'lucide-react';

const navConfig: Record<string, { label: string; href: string; icon: React.ReactNode }[]> = {
  direcao: [
    { label: 'Dashboard', href: '/dashboard/direcao', icon: <TrendingUp size={18} /> },
    { label: 'Clientes', href: '/dashboard/direcao/clientes', icon: <Search size={18} /> },
    { label: 'Usuários', href: '/dashboard/direcao/usuarios', icon: <Users size={18} /> },
    { label: 'Configurações', href: '/dashboard/direcao/configuracoes', icon: <Settings size={18} /> },
  ],
  logistica: [
    { label: 'Fila de Processo', href: '/dashboard/logistica?status=pendente', icon: <PackageCheck size={18} /> },
    { label: 'Aprovadas', href: '/dashboard/logistica?status=processado', icon: <CheckCircle size={18} /> },
    { label: 'Negadas', href: '/dashboard/logistica?status=rejeitado', icon: <ThumbsDown size={18} /> },
  ],
  vendedor: [
    { label: 'Minhas Garantias', href: '/dashboard/vendedor', icon: <ShieldCheck size={18} /> },
  ],
};

const roleColors: Record<string, string> = {
  vendedor: '#49BEFF',
  logistica: '#FFCB05',
  direcao: '#F2547C',
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
  const searchParams = useSearchParams();

  if (!usuario) return null;

  const items = navConfig[usuario.tipo_usuario] || [];
  const roleColor = roleColors[usuario.tipo_usuario] || 'var(--accent)';

  return (
    <aside className="w-[220px] flex-shrink-0 bg-[var(--bg-card)] border-r border-[var(--border-subtle)] min-h-[calc(100vh-80px)] sticky top-20 self-start flex flex-col max-md:hidden">
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
          // Os itens da logística compartilham o caminho e mudam só o ?status=
          const [caminho, query] = item.href.split('?');
          const statusItem = query ? new URLSearchParams(query).get('status') : null;
          const statusAtual = searchParams.get('status') || 'pendente';
          const isActive = statusItem
            ? pathname === caminho && statusAtual === statusItem
            : pathname === caminho || pathname.startsWith(caminho + '/');
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer text-left ${
                isActive
                  ? 'bg-[var(--accent-muted)] text-[var(--accent)] font-semibold'
                  : 'text-[var(--text-secondary)] font-medium hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--accent)]" />
              )}
              <span className={`flex-shrink-0 ${isActive ? '' : 'opacity-60'}`}>{item.icon}</span>
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
