'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PrivateRoute } from '@/components/PrivateRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
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

const resumoItens = (g: Garantia) => {
  const n = g.itens?.length || 0;
  if (n === 0) return g.produto_nome || '';
  if (n === 1) return `${g.itens![0].quantidade > 1 ? g.itens![0].quantidade + 'x ' : ''}${g.itens![0].nome}`;
  const pecas = g.itens!.reduce((t, i) => t + i.quantidade, 0);
  return `${n} produtos · ${pecas} peças`;
};

function LogisticaDashboardPageConteudo() {
  const [garantias, setGarantias] = useState<Garantia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const filterStatus = searchParams.get('status') || 'pendente';

  const [drawerGarantia, setDrawerGarantia] = useState<Garantia | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [motivo, setMotivo] = useState('');
  const [modoNegar, setModoNegar] = useState(false);
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
    setMotivo('');
    setModoNegar(false);
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
    if (!motivo.trim()) {
      toast.error('Informe o motivo da negativa');
      return;
    }
    setIsProcessing(true);
    try {
      await apiService.atualizarStatusGarantia(drawerGarantia.id, 'rejeitado', observacoes, motivo);
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
        {/* Header — reflete o item escolhido no menu */}
        <div className="animate-slide-up mb-8">
          <p className="text-xs text-[var(--text-muted)] font-medium mb-1">Painel de</p>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {filterStatus === 'processado'
              ? 'Garantias Aprovadas'
              : filterStatus === 'rejeitado'
              ? 'Garantias Negadas'
              : 'Fila de Processamento'}
            {!isLoading && garantias.length > 0 && (
              <span className="text-lg font-bold text-[var(--text-muted)] ml-3">
                {garantias.length}
              </span>
            )}
          </h1>
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
                <div className="bg-[var(--bg-elevated)] rounded-xl px-4 py-3 mb-4 border border-[var(--border-subtle)] flex gap-4 items-start justify-between min-h-[86px]">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">{resumoItens(garantia)}</p>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">
                      {garantia.descricao_falha}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-[var(--border-medium)] flex-shrink-0 bg-black/20 flex items-center justify-center">
                    {garantia.produto_foto_url ? (
                      <img 
                        src={garantia.produto_foto_url} 
                        alt={garantia.produto_nome} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-[11px] text-[var(--text-muted)] font-bold">
                        {garantia.produto_nome ? garantia.produto_nome.substring(0, 2).toUpperCase() : 'PR'}
                      </span>
                    )}
                  </div>
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
                ) : (
                  <>
                    {garantia.observacoes && (
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        Protocolo: <span className="font-semibold text-[var(--text-secondary)]">{garantia.observacoes}</span>
                      </p>
                    )}
                    {garantia.motivo_rejeicao && (
                      <p className="text-xs text-[var(--danger)] leading-relaxed mt-1">
                        Motivo: <span className="font-semibold">{garantia.motivo_rejeicao}</span>
                      </p>
                    )}
                  </>
                )}
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
                    <>
                      {(drawerGarantia.itens && drawerGarantia.itens.length > 0
                        ? drawerGarantia.itens
                        : [{ produto_id: 'unico', nome: drawerGarantia.produto_nome || '', familia: undefined, variacao: undefined, quantidade: 1 }]
                      ).map((item) => (
                        <InfoRow
                          key={item.produto_id}
                          icon={<Tag size={14} />}
                          label={`${item.quantidade > 1 ? item.quantidade + 'x ' : ''}${item.familia || item.nome}${item.variacao ? ' · ' + item.variacao : ''}`}
                          bold
                        />
                      ))}
                    </>
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

              {/* Protocolo — some quando o analista opta por negar */}
              {!modoNegar && (
                <Section title="Número do Protocolo (opcional)">
                  <input
                    type="text"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Ex: 2026-00123"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
                  />
                </Section>
              )}

              {/* Motivo — aparece só depois de clicar em Negar */}
              {modoNegar && (
                <div className="animate-slide-up">
                  <Section title="Motivo da Negativa" warning>
                    <textarea
                      autoFocus
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Ex: Produto fora do prazo de garantia"
                      rows={3}
                      className="w-full bg-[var(--bg-input)] border border-[var(--danger)]/40 rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--danger)] focus:ring-2 focus:ring-[var(--danger-muted)] resize-vertical min-h-[76px]"
                    />
                    <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                      O vendedor vê este texto na lista dele.
                    </p>
                  </Section>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-[var(--border-subtle)] flex-shrink-0 space-y-2">
              <p className="text-xs text-[var(--text-muted)] text-center">
                {modoNegar ? 'Descreva o motivo para o vendedor' : 'Esta ação não pode ser desfeita'}
              </p>
              <div className="flex gap-3">
                {modoNegar ? (
                  <>
                    <Button variant="secondary" size="lg" className="flex-1"
                      disabled={isProcessing}
                      onClick={() => { setModoNegar(false); setMotivo(''); }}>
                      Cancelar
                    </Button>
                    <Button variant="danger" size="lg" icon={<ThumbsDown size={16} />}
                      loading={isProcessing} className="flex-1"
                      disabled={!motivo.trim()}
                      onClick={handleNegar}>
                      Confirmar negativa
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="danger" size="lg" icon={<ThumbsDown size={16} />}
                      loading={isProcessing} className="flex-1"
                      onClick={() => setModoNegar(true)}>
                      Negar
                    </Button>
                    <Button variant="primary" size="lg" icon={<ThumbsUp size={16} />}
                      loading={isProcessing} className="flex-1" onClick={handleAprovar}
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                      Aprovar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </PrivateRoute>
  );
}


// useSearchParams exige uma fronteira de Suspense em página pré-renderizada.
export default function LogisticaDashboardPage() {
  return (
    <Suspense fallback={null}>
      <LogisticaDashboardPageConteudo />
    </Suspense>
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
