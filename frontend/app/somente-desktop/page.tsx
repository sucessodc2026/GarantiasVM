import { Monitor } from 'lucide-react';

export const metadata = {
  title: 'Acesso pelo computador — Garantias VM',
};

export default function SomenteDesktopPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-7 text-center"
      style={{ background: 'linear-gradient(160deg, #070A13 0%, #0C0F17 55%, #04060A 100%)' }}
    >
      <img src="/logo.png" alt="Garantias VM" className="h-20 w-auto brightness-0 invert mb-12" />

      <div className="w-16 h-16 rounded-2xl bg-[var(--accent-muted)] border border-[var(--accent)]/25 flex items-center justify-center mb-6">
        <Monitor size={28} className="text-[var(--accent)]" />
      </div>

      <h1 className="text-2xl font-extrabold text-white tracking-tight mb-3">
        Disponível apenas no computador
      </h1>

      <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed max-w-sm mb-8">
        A plataforma de garantias foi feita para uso em desktop. Acesse de um computador
        da empresa para registrar e acompanhar as solicitações.
      </p>

      <div className="rounded-xl border border-[var(--border-medium)] bg-[var(--bg-card)] px-5 py-4 max-w-sm">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
          Endereço de acesso
        </p>
        <p className="text-sm font-semibold text-[var(--accent)] break-all">
          garantiasvm.duckdns.org
        </p>
      </div>

      <p className="text-xs text-[var(--text-muted)] mt-10">Garantias VM</p>
    </div>
  );
}
