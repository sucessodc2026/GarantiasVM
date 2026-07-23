'use client';

import { useEffect, useState } from 'react';
import { PrivateRoute } from '@/components/PrivateRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { apiService } from '@/services/api';
import { Garantia } from '@/types';
import {
  PackageCheck,
  Clock,
  Search,
  ThumbsUp,
  ThumbsDown,
  User,
  Calendar,
  Tag,
  AlertTriangle,
  FileText,
  Image,
  Video,
  X,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LogisticaDashboardPage() {
  const [garantias, setGarantias] = useState<Garantia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('pendente');

  const [drawerGarantia, setDrawerGarantia] = useState<Garantia | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { loadGarantias(); }, [filterStatus]);

  const loadGarantias = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.todasGarantias(filterStatus);
      setGarantias(response.garantias || []);
    } catch {
      toast.error('Erro ao carregar garantias');
    } finally {
      setIsLoading(false);
    }
  };

  const fecharDrawer = () => {
    setDrawerGarantia(null);
    setObservacoes('');
  };

  const handleAprovar = async () => {
    if (!drawerGarantia) return;
    setIsProcessing(true);
    try {
      await apiService.atualizarStatusGarantia(drawerGarantia.id, 'processado', observacoes);
      toast.success('Solicitação aprovada!');
      fecharDrawer();
      loadGarantias();
    } catch {
      toast.error('Erro ao aprovar');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNegar = async () => {
    if (!drawerGarantia) return;
    setIsProcessing(true);
    try {
      await apiService.atualizarStatusGarantia(drawerGarantia.id, 'rejeitado', observacoes || 'Solicitação negada.');
      toast.success('Solicitação negada.');
      fecharDrawer();
      loadGarantias();
    } catch {
      toast.error('Erro ao negar');
    } finally {
      setIsProcessing(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'processado') return <Badge variant="success"><CheckCircle size={11} /> Aprovada</Badge>;
    if (status === 'rejeitado') return <Badge variant="danger"><ThumbsDown size={11} /> Negada</Badge>;
    return <Badge variant="warning"><Clock size={11} /> Pendente</Badge>;
  };

  const tabs = [
    { value: 'pendente', label: 'Pendentes', icon: <Clock size={14} className="text-amber-500" />, count: garantias.length },
    { value: 'processado', label: 'Aprovadas', icon: <CheckCircle size={14} className="text-sky-500" />, count: garantias.length },
    { value: 'rejeitado', label: 'Negadas', icon: <ThumbsDown size={14} className="text-red-500" />, count: garantias.length },
  ].filter(t => t.value === filterStatus || true);

  const getEmptyStateContent = () => {
    if (filterStatus === 'pendente') {
      return {
        title: 'Nenhuma solicitação pendente',
        description: 'Ótimo! A fila está vazia.',
      };
    }
    if (filterStatus === 'processado') {
      return {
        title: 'Nenhuma solicitação aprovada',
        description: 'Ainda não há solicitações aprovadas.',
      };
    }
    return {
      title: 'Nenhuma solicitação negada',
      description: 'Não há registros de solicitações negadas.',
    };
  };
  const emptyContent = getEmptyStateContent();

  return (
    <PrivateRoute allowedRoles={['logistica']}>
      <DashboardLayout>
        {/* Header */}
        <div className="animate-slide-up mb-8">
          <p className="text-xs text-[var(--text-muted)] font-medium mb-1">Painel de</p>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Fila de Processamento
          </h1>
        </div>

        {/* Filtros */}
        <div className="mb-6 animate-slide-up">
          <Tabs
            tabs={[
              { value: 'pendente', label: 'Pendentes', icon: <Clock size={14} className="text-amber-500" />, count: filterStatus === 'pendente' ? garantias.length : undefined },
              { value: 'processado', label: 'Aprovadas', icon: <CheckCircle size={14} className="text-sky-500" />, count: filterStatus === 'processado' ? garantias.length : undefined },
              { value: 'rejeitado', label: 'Negadas', icon: <ThumbsDown size={14} className="text-red-500" />, count: filterStatus === 'rejeitado' ? garantias.length : undefined },
            ]}
            active={filterStatus}
            onChange={setFilterStatus}
          />
        </div>

        {/* Lista em grid 2 colunas */}
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : garantias.length === 0 ? (
          <EmptyState
            icon={<PackageCheck size={48} />}
            title={emptyContent.title}
            description={emptyContent.description}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 animate-slide-up">
            {garantias.map((garantia, i) => (
              <Card key={garantia.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.04}s` }}>
                {/* Cabeçalho */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">{garantia.cliente_nome}</h3>
                      {statusBadge(garantia.status)}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      Vendedor: <span className="text-[var(--text-secondary)]">{garantia.vendedor_nome}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] flex-shrink-0">
                    {new Date(garantia.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>

                {/* Produto / Falha */}
                <div className="bg-[var(--bg-elevated)] rounded-xl px-4 py-3 mb-4 border border-[var(--border-subtle)]">
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">{garantia.produto_nome}</p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">
                    {garantia.descricao_falha}
                  </p>
                </div>

                {/* Ação */}
                {garantia.status === 'pendente' ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Search size={14} />}
                    className="w-full"
                    onClick={() => setDrawerGarantia(garantia)}
                  >
                    Analisar Solicitação
                  </Button>
                ) : garantia.observacoes ? (
                  <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">
                    &ldquo;{garantia.observacoes}&rdquo;
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </DashboardLayout>

      {/* ===== DRAWER DE ANÁLISE ===== */}
      {drawerGarantia && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] animate-fade-in" onClick={fecharDrawer} />
          <div className="fixed top-0 right-0 bottom-0 w-[520px] max-w-[95vw] bg-[var(--bg-card)] border-l border-[var(--border-medium)] z-[201] flex flex-col overflow-hidden animate-slide-in-right shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between px-7 pt-7 pb-4 border-b border-[var(--border-subtle)] flex-shrink-0">
              <div>
                <div className="flex items-center gap-2.5 mb-0.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] border border-[var(--accent)]/30 flex items-center justify-center">
                    <FileText size={15} className="text-[var(--accent)]" />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Análise de Solicitação</h2>
                </div>
                <p className="text-xs text-[var(--text-muted)] ml-10">Revise os detalhes antes de decidir</p>
              </div>
              <button onClick={fecharDrawer}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-medium)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all flex-shrink-0 cursor-pointer">
                <X size={15} />
              </button>
            </div>

            {/* Corpo */}
            <div className="flex-1 overflow-y-auto px-7 py-5 space-y-6">
              {/* Cliente */}
              <Section title="Cliente">
                <InfoRow icon={<User size={14} />} label={drawerGarantia.cliente_nome || ''} bold />
                <InfoRow icon={<User size={14} />} label={`Vendedor: ${drawerGarantia.vendedor_nome || ''}`} />
                <InfoRow icon={<Calendar size={14} />}
                  label={new Date(drawerGarantia.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  muted />
              </Section>

              {/* Produto */}
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

              {/* Falha */}
              <Section title="Descrição da Falha" warning>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{drawerGarantia.descricao_falha}</p>
              </Section>

              {/* Evidências */}
              {(drawerGarantia.foto_url || drawerGarantia.video_url) && (
                <Section title="Evidências">
                  <div className="space-y-3">
                    {drawerGarantia.foto_url && (
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
                          <Image size={12} /> Foto
                        </p>
                        <a href={drawerGarantia.foto_url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-[var(--border-medium)] hover:opacity-90 transition-opacity">
                          <img src={drawerGarantia.foto_url} alt="Foto do defeito"
                            className="w-full max-h-[200px] object-cover block" />
                        </a>
                      </div>
                    )}
                    {drawerGarantia.video_url && (
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
                          <Video size={12} /> Vídeo
                        </p>
                        <div className="rounded-xl overflow-hidden border border-[var(--border-medium)] bg-black">
                          <video src={drawerGarantia.video_url} controls preload="metadata"
                            className="w-full max-h-[200px] block" />
                        </div>
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* Observações */}
              <Section title="Observações do Analista (opcional)">
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Descreva o motivo da aprovação ou negação..."
                  rows={3}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] resize-vertical min-h-[80px]"
                />
              </Section>
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-[var(--border-subtle)] flex-shrink-0 space-y-2">
              <p className="text-xs text-[var(--text-muted)] text-center">Esta ação não pode ser desfeita</p>
              <div className="flex gap-3">
                <Button variant="danger" size="lg" icon={<ThumbsDown size={16} />}
                  loading={isProcessing} className="flex-1" onClick={handleNegar}>
                  Negar
                </Button>
                <Button variant="primary" size="lg" icon={<ThumbsUp size={16} />}
                  loading={isProcessing} className="flex-1" onClick={handleAprovar}
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                  Aprovar
                </Button>
              </div>
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
