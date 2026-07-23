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
import { parseGoogleDriveLink } from '@/utils/drive';
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
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string>('');
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // Autocomplete States
  const [clienteBusca, setClienteBusca] = useState('');
  const [sugestoesClientes, setSugestoesClientes] = useState<{ id: string; nome: string; telefone?: string }[]>([]);
  const [showClientesDropdown, setShowClientesDropdown] = useState(false);

  const [produtoBusca, setProdutoBusca] = useState('');
  const [sugestoesProdutos, setSugestoesProdutos] = useState<{ id: string; nome: string; categoria?: string }[]>([]);
  const [showProdutosDropdown, setShowProdutosDropdown] = useState(false);

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
    if (!formData.cliente_id || !formData.produto_id || !formData.descricao_falha) {
      toast.error('Preencha todos os campos obrigatórios');
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
      if (videoUrlInput.trim()) {
        const directUrl = parseGoogleDriveLink(videoUrlInput.trim());
        if (directUrl) videoUrl = directUrl;
      }
      if (videoFile) {
        const up = await uploadService.uploadArquivo(videoFile);
        videoUrl = up.url || videoUrl;
      }
      await apiService.criarGarantia({ ...formData, foto_url: fotoUrl, video_url: videoUrl });
      toast.success('Garantia criada com sucesso!');
      setFormData({ cliente_id: '', produto_id: '', descricao_falha: '' });
      setFotoFile(null); setVideoFile(null);
      setFotoPreview(''); setVideoPreview(''); setVideoUrlInput('');
      setClienteBusca(''); setProdutoBusca('');
      setActiveTab('lista');
      loadGarantias();
    } catch {
      toast.error('Erro ao criar garantia');
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
                          {garantia.produto_nome}
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
                            <FileText size={12} /> Obs: {garantia.observacoes}
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
                    Produto
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
                    placeholder="Busque pelo nome ou categoria..."
                    required
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
                  />
                  {showProdutosDropdown && sugestoesProdutos.length > 0 && (
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
                      {sugestoesProdutos.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setFormData({ ...formData, produto_id: p.id });
                            setProdutoBusca(p.nome);
                            setShowProdutosDropdown(false);
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
                          <p style={{ fontWeight: 600, margin: 0 }}>{p.nome}</p>
                          {p.categoria && <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Cat: {p.categoria}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {formData.produto_id && (
                    <p style={{ fontSize: '11px', color: 'var(--success)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      ✓ Produto selecionado
                    </p>
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

                {/* Link do Google Drive para vídeo */}
                {!videoFile && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                      Ou cole um link do Google Drive
                    </label>
                    <div className="relative">
                      <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        type="text"
                        value={videoUrlInput}
                        onChange={(e) => setVideoUrlInput(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
                      />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Cole o link de compartilhamento de qualquer arquivo do Google Drive
                    </p>
                  </div>
                )}

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
