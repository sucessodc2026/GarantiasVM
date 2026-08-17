'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PrivateRoute } from '@/components/PrivateRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { apiService } from '@/services/api';
import { uploadService } from '@/services/uploadService';
import { Garantia } from '@/types';
import {
  Plus,
  ShieldAlert,
  Image,
  Video,
  ArrowLeft,
  Calendar,
  FileText,
  Link,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

const resumoItens = (g: Garantia) => {
  const n = g.itens?.length || 0;
  if (n === 0) return g.produto_nome || '';
  if (n === 1) return `${g.itens![0].quantidade > 1 ? g.itens![0].quantidade + 'x ' : ''}${g.itens![0].nome}`;
  const pecas = g.itens!.reduce((t, i) => t + i.quantidade, 0);
  return `${n} produtos · ${pecas} peças`;
};

export default function VendedorDashboardPage() {
  const { usuario } = useAuth();
  const [garantias, setGarantias] = useState<Garantia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lista' | 'criar'>('lista');
  const [formData, setFormData] = useState({
    cliente_id: '',
    produto_id: '',
    descricao_falha: '',
  });
  // Uma garantia pode ter vários produtos.
  type ItemGarantia = { produto_id: string; nome: string; familia?: string; variacao?: string; foto_url?: string; quantidade: number };
  const [itens, setItens] = useState<ItemGarantia[]>([]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string>('');
  const [videoPreview, setVideoPreview] = useState<string>('');

  // Autocomplete States
  const [clienteBusca, setClienteBusca] = useState('');
  const [sugestoesClientes, setSugestoesClientes] = useState<{ id: string; nome: string; telefone?: string }[]>([]);
  const [showClientesDropdown, setShowClientesDropdown] = useState(false);

  const [produtoBusca, setProdutoBusca] = useState('');
  const [sugestoesProdutos, setSugestoesProdutos] = useState<{ id: string; nome: string; categoria?: string; foto_url?: string; familia?: string; variacao?: string; descricao?: string }[]>([]);
  const [showProdutosDropdown, setShowProdutosDropdown] = useState(false);
  const [familiaAberta, setFamiliaAberta] = useState<string | null>(null);

  useEffect(() => { loadGarantias(); }, []);

  const buscarClientes = async (busca: string) => {
    setClienteBusca(busca);
    if (busca.trim().length < 1) {
      setSugestoesClientes([]);
      setShowClientesDropdown(false);
      return;
    }
    try {
      const data = await apiService.listarClientes(busca);
      setSugestoesClientes(data || []);
      setShowClientesDropdown(true);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    }
  };

  const buscarProdutos = async (busca: string) => {
    setProdutoBusca(busca);
    setFamiliaAberta(null);
    if (busca.trim().length < 1) {
      setSugestoesProdutos([]);
      setShowProdutosDropdown(false);
      return;
    }
    try {
      const data = await apiService.listarProdutos(busca);
      setSugestoesProdutos(data || []);
      setShowProdutosDropdown(true);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    }
  };

  // Um modelo (ex: CORE MINI 4.200 LUMENS) pode ter várias variações de
  // encaixe — agrupa a lista plana da API para mostrar 1 linha por modelo
  // e só pedir o encaixe quando existir mais de um.
  const familiasAgrupadas = (() => {
    const mapa = new Map<string, { chave: string; nome: string; foto_url?: string; skus: typeof sugestoesProdutos }>();
    for (const p of sugestoesProdutos) {
      const chave = p.familia || p.descricao || p.nome;
      const grupo = mapa.get(chave);
      if (grupo) {
        grupo.skus.push(p);
        if (!grupo.foto_url && p.foto_url) grupo.foto_url = p.foto_url;
      } else {
        mapa.set(chave, { chave, nome: chave, foto_url: p.foto_url, skus: [p] });
      }
    }
    return Array.from(mapa.values());
  })();



  const adicionarItem = (p: { id: string; nome: string; familia?: string; variacao?: string; foto_url?: string; descricao?: string }) => {
    setItens((atual) => {
      const ja = atual.find((i) => i.produto_id === p.id);
      if (ja) {
        toast.success('Quantidade aumentada');
        return atual.map((i) => (i.produto_id === p.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [...atual, { produto_id: p.id, nome: p.nome, familia: p.familia || p.descricao, variacao: p.variacao, foto_url: p.foto_url, quantidade: 1 }];
    });
    setProdutoBusca('');
    setSugestoesProdutos([]);
    setShowProdutosDropdown(false);
    setFamiliaAberta(null);
  };

  const mudarQuantidade = (produto_id: string, delta: number) =>
    setItens((atual) =>
      atual.map((i) => (i.produto_id === produto_id ? { ...i, quantidade: Math.max(1, i.quantidade + delta) } : i))
    );

  const removerItem = (produto_id: string) =>
    setItens((atual) => atual.filter((i) => i.produto_id !== produto_id));

  const loadGarantias = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.minhasGarantias();
      setGarantias(response.garantias || []);
    } catch {
      toast.error('Erro ao carregar garantias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFile = (file: File, type: 'foto' | 'video') => {
    const maxSize = type === 'foto' ? 100 : 500;
    if (file.size / (1024 * 1024) > maxSize) {
      toast.error(`Arquivo muito grande. Máximo: ${maxSize}MB`);
      return;
    }
    if (type === 'foto') {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setFotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente_id || !formData.descricao_falha) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (itens.length === 0) {
      toast.error('Adicione ao menos um produto');
      return;
    }
    setIsUploading(true);
    try {
      let fotoUrl = '';
      let videoUrl = '';
      if (fotoFile) {
        const up = await uploadService.uploadArquivo(fotoFile);
        fotoUrl = up.url;
      }
      if (videoFile) {
        const up = await uploadService.uploadArquivo(videoFile);
        videoUrl = up.url || videoUrl;
      }
      await apiService.criarGarantia({
        cliente_id: formData.cliente_id,
        descricao_falha: formData.descricao_falha,
        itens: itens.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade })),
        foto_url: fotoUrl,
        video_url: videoUrl,
      });
      toast.success('Garantia criada com sucesso!');
      setFormData({ cliente_id: '', produto_id: '', descricao_falha: '' });
      setItens([]);
      setFotoFile(null); setVideoFile(null);
      setFotoPreview(''); setVideoPreview('');
      setClienteBusca(''); setProdutoBusca('');
      setActiveTab('lista');
      loadGarantias();
    } catch (err: any) {
      // Mostrar a causa real: antes, um upload rejeitado pelo servidor
      // aparecia como "Erro ao criar garantia" e escondia o motivo.
      const status = err?.response?.status;
      const msg =
        status === 413
          ? 'Arquivo grande demais para o servidor'
          : err?.response?.data?.erro || err?.message || 'Erro ao criar garantia';
      toast.error(msg);
      console.error('Falha ao criar garantia:', err?.response?.data || err);
    } finally {
      setIsUploading(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'processado') return <Badge variant="success">Aprovada</Badge>;
    if (status === 'rejeitado') return <Badge variant="danger">Negada</Badge>;
    return <Badge variant="warning">Pendente</Badge>;
  };

  const stats = {
    total: garantias.length,
    pendentes: garantias.filter((g) => g.status === 'pendente').length,
    processados: garantias.filter((g) => g.status === 'processado').length,
  };

  return (
    <PrivateRoute allowedRoles={['vendedor']}>
      <DashboardLayout>
        {/* Header */}
        <div className="animate-slide-up mb-8">
          <p className="text-xs text-[var(--text-muted)] font-medium mb-1">
            Bem-vindo de volta,
          </p>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {usuario?.nome}
          </h1>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-3 mb-8 animate-slide-up">
          {[
            { label: 'Total', value: stats.total, color: 'var(--accent)' },
            { label: 'Pendentes', value: stats.pendentes, color: 'var(--warning)' },
            { label: 'Aprovados', value: stats.processados, color: 'var(--success)' },
          ].map((s) => (
            <Card key={s.label}>
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}30`, color: s.color }}
                >
                  {s.value}
                </div>
                <span className="text-sm text-[var(--text-muted)] font-medium">{s.label}</span>
              </div>
            </Card>
          ))}
        </div>

        {activeTab === 'lista' ? (
          <>
            <div className="flex items-center justify-between mb-5 animate-slide-up">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Minhas Garantias</h2>
              <Button icon={<Plus size={16} />} onClick={() => setActiveTab('criar')}>
                Nova Garantia
              </Button>
            </div>

            {isLoading ? (
              <ListSkeleton rows={3} />
            ) : garantias.length === 0 ? (
              <EmptyState
                icon={<ShieldAlert size={48} />}
                title="Nenhuma garantia ainda"
                description="Crie sua primeira solicitação clicando no botão acima"
                action={{ label: 'Nova Garantia', icon: <Plus size={16} />, onClick: () => setActiveTab('criar') }}
              />
            ) : (
              <div className="space-y-3 animate-slide-up">
                {garantias.map((garantia, i) => (
                  <Card key={garantia.id} className={`animate-slide-up`} style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="flex items-start gap-4">
                      {garantia.produto_foto_url && (
                        <img
                          src={garantia.produto_foto_url}
                          alt={garantia.produto_nome || 'SKU'}
                          className="w-14 h-14 rounded-xl object-cover border border-[var(--border-subtle)] flex-shrink-0 mt-1"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-[var(--text-primary)]">
                            {garantia.cliente_nome}
                          </h3>
                          {statusBadge(garantia.status)}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-2">
                          {resumoItens(garantia)}
                          {garantia.produto_categoria && (
                            <span className="text-[var(--text-muted)] ml-1.5">• {garantia.produto_categoria}</span>
                          )}
                        </p>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                          {garantia.descricao_falha}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between flex-wrap gap-3">
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(garantia.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <div className="flex gap-4">
                        {garantia.foto_url && (
                          <a href={garantia.foto_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-[var(--accent)] font-medium hover:underline">
                            <Image size={12} /> Foto
                          </a>
                        )}
                        {garantia.video_url && (
                          <a href={garantia.video_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-[var(--accent)] font-medium hover:underline">
                            <Video size={12} /> Vídeo
                          </a>
                        )}
                        {garantia.observacoes && (
                          <span className="text-xs text-[var(--info)] font-medium flex items-center gap-1">
                            <FileText size={12} /> Protocolo: {garantia.observacoes}
                          </span>
                        )}
                        {garantia.motivo_rejeicao && (
                          <span className="text-xs text-[var(--danger)] font-medium flex items-center gap-1">
                            <FileText size={12} /> Motivo: {garantia.motivo_rejeicao}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="animate-slide-up max-w-lg">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}
              onClick={() => setActiveTab('lista')} className="mb-5">
              Voltar
            </Button>

            <Card>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Nova Solicitação de Garantia</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Autocomplete Cliente */}
                <div style={{ position: 'relative' }}>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Cliente
                  </label>
                  <input
                    type="text"
                    value={clienteBusca}
                    onChange={(e) => {
                      buscarClientes(e.target.value);
                      setFormData({ ...formData, cliente_id: '' });
                    }}
                    onFocus={() => {
                      if (clienteBusca.length > 0) setShowClientesDropdown(true);
                    }}
                    placeholder="Busque pelo nome ou telefone..."
                    required
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
                  />
                  {showClientesDropdown && sugestoesClientes.length > 0 && (
                    <div 
                      style={{ 
                        position: 'absolute', 
                        top: '100%', 
                        left: 0, 
                        right: 0, 
                        zIndex: 50, 
                        marginTop: '4px', 
                        maxHeight: '200px', 
                        overflowY: 'auto', 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border-medium)', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                      }}
                    >
                      {sugestoesClientes.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setFormData({ ...formData, cliente_id: c.id });
                            setClienteBusca(c.nome);
                            setShowClientesDropdown(false);
                          }}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: 'var(--text-primary)',
                            borderBottom: '1px solid var(--border-subtle)',
                            transition: 'background 0.1s'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <p style={{ fontWeight: 600, margin: 0 }}>{c.nome}</p>
                          {c.telefone && <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{c.telefone}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {formData.cliente_id && (
                    <p style={{ fontSize: '11px', color: 'var(--success)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      ✓ Cliente selecionado
                    </p>
                  )}
                </div>

                {/* Autocomplete Produto */}
                <div style={{ position: 'relative' }}>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Produtos
                  </label>
                  <input
                    type="text"
                    value={produtoBusca}
                    onChange={(e) => {
                      buscarProdutos(e.target.value);
                      setFormData({ ...formData, produto_id: '' });
                    }}
                    onFocus={() => {
                      if (produtoBusca.length > 0) setShowProdutosDropdown(true);
                    }}
                    placeholder="Busque e clique para adicionar..."
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
                  />
                  {showProdutosDropdown && familiasAgrupadas.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        marginTop: '4px',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                      }}
                    >
                      {(() => {
                        const grupo = familiasAgrupadas.find((g) => g.chave === familiaAberta);

                        // Passo 2: modelo tem mais de um encaixe — escolher qual.
                        if (grupo) {
                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => setFamiliaAberta(null)}
                                style={{
                                  width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px',
                                  fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
                                  borderBottom: '1px solid var(--border-subtle)', background: 'transparent',
                                  border: 'none', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: 'var(--border-subtle)',
                                  cursor: 'pointer', textAlign: 'left',
                                }}
                              >
                                <ArrowLeft size={13} /> {grupo.nome}
                              </button>
                              <div style={{ padding: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {grupo.skus.map((sku) => (
                                  <button
                                    type="button"
                                    key={sku.id}
                                    onClick={() => adicionarItem(sku)}
                                    style={{
                                      padding: '7px 14px',
                                      borderRadius: '10px',
                                      fontSize: '13px',
                                      fontWeight: 700,
                                      color: 'var(--accent)',
                                      background: 'var(--accent-muted)',
                                      border: '1px solid var(--accent)',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {sku.variacao || sku.nome}
                                  </button>
                                ))}
                              </div>
                            </>
                          );
                        }

                        // Passo 1: um modelo por linha, não um encaixe por linha.
                        return familiasAgrupadas.map((f) => (
                          <div
                            key={f.chave}
                            onClick={() => (f.skus.length === 1 ? adicionarItem(f.skus[0]) : setFamiliaAberta(f.chave))}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              color: 'var(--text-primary)',
                              borderBottom: '1px solid var(--border-subtle)',
                              transition: 'background 0.1s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div style={{ width: '32px', height: '32px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-subtle)' }}>
                              {f.foto_url ? (
                                <img src={f.foto_url} alt={f.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                                  {f.nome.substring(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {f.nome}
                              </p>
                              {f.skus.length === 1 && (
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{f.skus[0].nome}</p>
                              )}
                            </div>

                            {f.skus.length > 1 && (
                              <span style={{
                                flexShrink: 0,
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-medium)',
                              }}>
                                {f.skus.length} variações
                              </span>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                  {/* Produtos adicionados */}
                  {itens.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {itens.map((item) => (
                        <div
                          key={item.produto_id}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                        >
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-[var(--bg-input)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0">
                            {item.foto_url ? (
                              <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-[var(--text-muted)]">
                                {item.nome.substring(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                              {item.familia || item.nome}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)]">
                              {item.nome}{item.variacao ? ` · ${item.variacao}` : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => mudarQuantidade(item.produto_id, -1)}
                              disabled={item.quantidade <= 1}
                              className="w-7 h-7 rounded-lg border border-[var(--border-medium)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              −
                            </button>
                            <span className="w-7 text-center text-sm font-bold text-[var(--text-primary)] tabular-nums">
                              {item.quantidade}
                            </span>
                            <button
                              type="button"
                              onClick={() => mudarQuantidade(item.produto_id, 1)}
                              className="w-7 h-7 rounded-lg border border-[var(--border-medium)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removerItem(item.produto_id)}
                              className="w-7 h-7 rounded-lg text-[var(--danger)] hover:bg-[var(--danger-muted)] cursor-pointer ml-1"
                              title="Remover"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                      <p className="text-[11px] text-[var(--text-muted)] text-right">
                        {itens.length} {itens.length === 1 ? 'produto' : 'produtos'} ·{' '}
                        {itens.reduce((t, i) => t + i.quantidade, 0)}{' '}
                        {itens.reduce((t, i) => t + i.quantidade, 0) === 1 ? 'peça' : 'peças'}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Descrição da Falha
                  </label>
                  <textarea
                    value={formData.descricao_falha}
                    onChange={(e) => setFormData({ ...formData, descricao_falha: e.target.value })}
                    placeholder="Descreva detalhadamente o problema encontrado..."
                    rows={4}
                    required
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] resize-vertical min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FileField
                    label="Foto do Produto"
                    accept="image/*"
                    file={fotoFile}
                    preview={fotoPreview}
                    onSelect={(f) => handleFile(f, 'foto')}
                    onRemove={() => { setFotoFile(null); setFotoPreview(''); }}
                  />
                  <FileField
                    label="Vídeo do Produto"
                    accept="video/*"
                    file={videoFile}
                    preview={videoPreview}
                    onSelect={(f) => handleFile(f, 'video')}
                    onRemove={() => { setVideoFile(null); setVideoPreview(''); }}
                  />
                </div>

                <Button type="submit" loading={isUploading} className="w-full">
                  {isUploading ? 'Enviando arquivos...' : 'Criar Solicitação'}
                </Button>
              </form>
            </Card>
          </div>
        )}
      </DashboardLayout>
    </PrivateRoute>
  );
}

function FileField({
  label, accept, file, preview, onSelect, onRemove,
}: {
  label: string;
  accept: string;
  file: File | null;
  preview: string;
  onSelect: (f: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useState<HTMLInputElement | null>(null);

  if (file && preview) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{label}</label>
        <div className="relative rounded-xl overflow-hidden border border-[var(--border-medium)] bg-black/40">
          {accept.startsWith('image') ? (
            <img src={preview} alt="Preview" className="w-full h-28 object-cover" />
          ) : (
            <video src={preview} className="w-full h-28 object-cover" />
          )}
          <button type="button" onClick={onRemove}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">{label}</label>
      <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-[var(--border-medium)] bg-[var(--bg-input)] cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]/50 transition-all">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)] mb-1"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5-5 5 5M12 15V5"/></svg>
        <span className="text-[11px] text-[var(--text-muted)]">Clique para selecionar</span>
        <input type="file" accept={accept} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f); }} />
      </label>
    </div>
  );
}
