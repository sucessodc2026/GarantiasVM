'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PrivateRoute } from '@/components/PrivateRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs } from '@/components/ui/Tabs';
import { CardSkeleton, ListSkeleton } from '@/components/ui/Skeleton';
import { apiService } from '@/services/api';
import { Garantia, MetricasGerais, VendedorMetrica, ClienteRepetidor, ProdutoComDefeito, Alerta } from '@/types';
import {
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  Zap,
  Trophy,
  Users,
  Package,
  X,
  ThumbsDown,
  User,
  Calendar,
  Tag,
  FileText,
  Image,
  Video,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DirecaoDashboardPage() {
  const { usuario } = useAuth();
  const [metricas, setMetricas] = useState<MetricasGerais | null>(null);
  const [vendedores, setVendedores] = useState<VendedorMetrica[]>([]);
  const [clientesRepetidores, setClientesRepetidores] = useState<ClienteRepetidor[]>([]);
  const [produtosDefeitos, setProdutosDefeitos] = useState<ProdutoComDefeito[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lista de garantias para detalhamento
  const [garantias, setGarantias] = useState<Garantia[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('todas');
  const [isLoadingGarantias, setIsLoadingGarantias] = useState(false);

  // Drawer de detalhes
  const [drawerGarantia, setDrawerGarantia] = useState<Garantia | null>(null);

  useEffect(() => { loadDashboardData(); }, []);

  useEffect(() => { loadGarantias(); }, [filterStatus]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [metricsResp, vendedoresResp, clientesResp, produtosResp, alertasResp] =
        await Promise.all([
          apiService.metricasGerais(),
          apiService.garantiasPorVendedor(),
          apiService.clientesRepetidores(),
          apiService.produtosComDefeitos(),
          apiService.alertasNaoResolvidos(),
        ]);
      setMetricas(metricsResp);
      setVendedores(vendedoresResp || []);
      setClientesRepetidores(clientesResp || []);
      setProdutosDefeitos(produtosResp || []);
      setAlertas(alertasResp || []);
    } catch {
      toast.error('Erro ao carregar dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGarantias = async () => {
    try {
      setIsLoadingGarantias(true);
      const status = filterStatus === 'todas' ? undefined : filterStatus;
      const response = await apiService.todasGarantias(status, 50);
      setGarantias(response.garantias || []);
    } catch {
      toast.error('Erro ao carregar garantias');
    } finally {
      setIsLoadingGarantias(false);
    }
  };

  const handleResolverAlerta = async (alertaId: string) => {
    try {
      await apiService.resolverAlerta(alertaId);
      toast.success('Alerta resolvido');
      setAlertas(alertas.filter((a) => a.id !== alertaId));
    } catch {
      toast.error('Erro ao resolver alerta');
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'processado') return <Badge variant="success"><CheckCircle size={11} /> Aprovada</Badge>;
    if (status === 'rejeitado') return <Badge variant="danger"><ThumbsDown size={11} /> Negada</Badge>;
    return <Badge variant="warning"><Clock size={11} /> Pendente</Badge>;
  };

  return (
    <PrivateRoute allowedRoles={['direcao']}>
      <DashboardLayout>
        {/* Header */}
        <div className="animate-slide-up mb-8">
          <p className="text-xs text-[var(--text-muted)] font-medium mb-1">Visão executiva</p>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Dashboard Executivo
          </h1>
        </div>

        {/* KPIs */}
        {metricas ? (
          <div className="grid grid-cols-4 gap-3 mb-8 animate-slide-up">
            <KpiCard label="Total de Garantias" value={metricas.total_garantias} icon={<TrendingUp size={18} />} />
            <KpiCard label="Processadas" value={metricas.processadas} subtitle="Garantias aprovadas" icon={<CheckCircle size={18} />} />
            <KpiCard label="Pendentes" value={metricas.pendentes} subtitle="Aguardando análise" icon={<Clock size={18} />} />
            <KpiCard label="Taxa de Aprovação" value={`${metricas.taxa_aprovacao}%`} icon={<Zap size={18} />} />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 mb-8">
            {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
          </div>
        )}

        {/* Alertas */}
        {alertas.length > 0 && (
          <Card className="mb-6 border-[var(--danger)]/25 animate-slide-up">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[var(--danger-muted)] flex items-center justify-center">
                <AlertTriangle size={18} className="text-[var(--danger)]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Alertas Ativos</h2>
                <p className="text-xs text-[var(--text-muted)]">{alertas.length} {alertas.length === 1 ? 'alerta requer' : 'alertas requerem'} atenção</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {alertas.map((alerta) => (
                <div key={alerta.id} className="flex items-start justify-between gap-4 px-4 py-3.5 rounded-xl bg-[var(--danger-muted)] border border-[var(--danger)]/20">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertCircle size={13} className="text-[var(--danger)]" />
                      <span className="text-xs font-bold text-[var(--danger)] capitalize">{alerta.tipo.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">{alerta.descricao}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {alerta.alerta_para} · Valor: {alerta.valor_metrica} · Limite: {alerta.limite_alerta}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" icon={<X size={13} />} onClick={() => handleResolverAlerta(alerta.id)} className="flex-shrink-0">
                    Resolver
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {alertas.length === 0 && (
          <div className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-[var(--success-muted)] border border-[var(--success)]/20 mb-6 animate-slide-up">
            <CheckCircle size={16} className="text-[var(--success)]" />
            <span className="text-sm font-medium text-[var(--success)]">Nenhum alerta ativo no momento</span>
          </div>
        )}

        {/* ===== LISTAGEM DETALHADA DE GARANTIAS ===== */}
        <div className="animate-slide-up mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Todas as Garantias</h2>
          </div>
          <Tabs
            tabs={[
              { value: 'todas', label: 'Todas', count: metricas ? Number(metricas.total_garantias) : undefined },
              { value: 'pendente', label: 'Pendentes', icon: <Clock size={14} />, count: metricas ? Number(metricas.pendentes) : undefined },
              { value: 'processado', label: 'Aprovadas', icon: <CheckCircle size={14} />, count: metricas ? Number(metricas.processadas) : undefined },
            ]}
            active={filterStatus}
            onChange={setFilterStatus}
          />
        </div>

        {isLoadingGarantias ? (
          <ListSkeleton rows={4} />
        ) : garantias.length === 0 ? (
          <Card className="mb-6">
            <p className="text-sm text-[var(--text-muted)] text-center py-8">
              Nenhuma garantia encontrada
            </p>
          </Card>
        ) : (
          <div className="space-y-2 mb-8 animate-slide-up">
            {garantias.slice(0, 10).map((g) => (
              <div
                key={g.id}
                className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl px-6 py-4 flex items-center gap-6 hover:border-[var(--border-medium)] transition-colors cursor-pointer"
                onClick={() => setDrawerGarantia(g)}
              >
                {/* Avatar do cliente */}
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-muted)] border border-[var(--accent)]/25 flex items-center justify-center text-sm font-bold text-[var(--accent)] flex-shrink-0">
                  {(g.cliente_nome || '?').charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 grid grid-cols-4 gap-4 items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {g.cliente_nome || 'Sem nome'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Vendedor: {g.vendedor_nome}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--text-secondary)] truncate">{g.produto_nome}</p>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                    <Calendar size={12} />
                    {new Date(g.criado_em).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex justify-end">
                    {statusBadge(g.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabelas executivas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-slide-up">
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <Trophy size={18} className="text-[var(--warning)]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">Top Vendedores</h2>
            </div>
            <div className="space-y-0">
              {vendedores.slice(0, 5).map((v, i) => (
                <div key={v.id} className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                      i === 0 ? 'bg-[var(--warning-muted)] text-[var(--warning)] border border-[var(--warning)]/30' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                    }`}>
                      {i + 1}
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{v.nome}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--text-primary)]">{v.total}</p>
                    <p className="text-[11px] text-[var(--success)]">{v.taxa_aprovacao}% aprovação</p>
                  </div>
                </div>
              ))}
              {vendedores.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-6">Sem dados</p>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-5">
              <Users size={18} className="text-[var(--warning)]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">Clientes em Risco</h2>
            </div>
            <div className="space-y-2.5">
              {clientesRepetidores.slice(0, 5).map((c) => (
                <div key={c.id} className="px-4 py-3 rounded-xl bg-[var(--warning-muted)] border border-[var(--warning)]/20">
                  <p className="text-sm font-bold text-[var(--text-primary)] mb-0.5">{c.nome}</p>
                  <p className="text-xs text-[var(--text-muted)] mb-2">{c.telefone}</p>
                  <div className="flex gap-2">
                    <span className="text-[11px] font-semibold text-[var(--warning)] bg-[var(--warning-muted)] px-2 py-0.5 rounded">{c.total_solicitacoes} solicitações</span>
                    <span className="text-[11px] font-semibold text-[var(--warning)] bg-[var(--warning-muted)] px-2 py-0.5 rounded">{c.produtos_diferentes} produtos</span>
                  </div>
                </div>
              ))}
              {clientesRepetidores.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-6">Nenhum cliente em risco</p>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-5">
              <Package size={18} className="text-[var(--danger)]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">Produtos Problemáticos</h2>
            </div>
            <div className="space-y-0">
              {produtosDefeitos.slice(0, 5).map((p, i) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{p.nome}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{p.categoria}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-3">
                    <span className="text-[11px] font-semibold text-[var(--danger)] bg-[var(--danger-muted)] px-2 py-0.5 rounded">{p.total_defeitos} defeitos</span>
                    <span className="text-[11px] font-semibold text-[var(--info)] bg-[var(--info-muted)] px-2 py-0.5 rounded">{p.clientes_afetados} clientes</span>
                  </div>
                </div>
              ))}
              {produtosDefeitos.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-6">Sem dados de produtos</p>
              )}
            </div>
          </Card>
        </div>
      </DashboardLayout>

      {/* ===== DRAWER DE DETALHES ===== */}
      {drawerGarantia && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] animate-fade-in" onClick={() => setDrawerGarantia(null)} />
          <div className="fixed top-0 right-0 bottom-0 w-[520px] max-w-[95vw] bg-[var(--bg-card)] border-l border-[var(--border-medium)] z-[201] flex flex-col overflow-hidden animate-slide-in-right shadow-2xl">
            <div className="flex items-start justify-between px-7 pt-7 pb-4 border-b border-[var(--border-subtle)] flex-shrink-0">
              <div>
                <div className="flex items-center gap-2.5 mb-0.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] border border-[var(--accent)]/30 flex items-center justify-center">
                    <FileText size={15} className="text-[var(--accent)]" />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Detalhes da Garantia</h2>
                </div>
                <p className="text-xs text-[var(--text-muted)] ml-10">{drawerGarantia.cliente_nome}</p>
              </div>
              <button onClick={() => setDrawerGarantia(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-medium)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all flex-shrink-0 cursor-pointer">
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-5 space-y-6">
              <Section title="Cliente">
                <InfoRow icon={<User size={14} />} label={drawerGarantia.cliente_nome || ''} bold />
                <InfoRow icon={<User size={14} />} label={`Vendedor: ${drawerGarantia.vendedor_nome || ''}`} />
                <InfoRow icon={<Calendar size={14} />}
                  label={new Date(drawerGarantia.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  muted />
              </Section>

              <Section title="Produto">
                <div className="flex items-start gap-4">
                  {drawerGarantia.produto_foto_url && (
                    <img
                      src={drawerGarantia.produto_foto_url}
                      alt={drawerGarantia.produto_nome || 'SKU'}
                      className="w-16 h-16 rounded-xl object-cover border border-[var(--border-subtle)] flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <InfoRow icon={<Tag size={14} />} label={drawerGarantia.produto_nome || ''} bold />
                    {drawerGarantia.produto_categoria && (
                      <InfoRow icon={<Tag size={14} />} label={drawerGarantia.produto_categoria || ''} muted />
                    )}
                  </div>
                </div>
              </Section>

              <Section title="Descrição da Falha" warning>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{drawerGarantia.descricao_falha}</p>
              </Section>

              {(drawerGarantia.foto_url || drawerGarantia.video_url) && (
                <Section title="Evidências">
                  <div className="space-y-3">
                    {drawerGarantia.foto_url && (
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5"><Image size={12} /> Foto</p>
                        <a href={drawerGarantia.foto_url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-[var(--border-medium)] hover:opacity-90 transition-opacity">
                          <img src={drawerGarantia.foto_url} alt="Foto do defeito" className="w-full max-h-[200px] object-cover block" />
                        </a>
                      </div>
                    )}
                    {drawerGarantia.video_url && (
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5"><Video size={12} /> Vídeo</p>
                        <div className="rounded-xl overflow-hidden border border-[var(--border-medium)] bg-black">
                          <video src={drawerGarantia.video_url} controls preload="metadata" className="w-full max-h-[200px] block" />
                        </div>
                      </div>
                    )}
                  </div>
                </Section>
              )}

              <Section title="Status">
                <div className="flex items-center gap-2">
                  {statusBadge(drawerGarantia.status)}
                  {drawerGarantia.observacoes && (
                    <span className="text-xs text-[var(--text-muted)] italic ml-2">
                      &ldquo;{drawerGarantia.observacoes}&rdquo;
                    </span>
                  )}
                </div>
              </Section>
            </div>
          </div>
        </>
      )}
    </PrivateRoute>
  );
}

function Section({ title, warning, children }: { title: string; warning?: boolean; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2.5">{title}</p>
      <div className={`rounded-xl px-4 py-3.5 border ${warning ? 'bg-[var(--warning-muted)] border-[var(--warning)]/20' : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]'}`}>
        {children}
      </div>
    </section>
  );
}

function InfoRow({ icon, label, bold, muted }: { icon: React.ReactNode; label: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 py-0.5">
      <span className="text-[var(--text-muted)] flex-shrink-0">{icon}</span>
      <span className={`text-sm ${bold ? 'font-bold text-[var(--text-primary)]' : muted ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>
        {label}
      </span>
    </div>
  );
}
