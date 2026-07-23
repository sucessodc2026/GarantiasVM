'use client';

import { useEffect, useState } from 'react';
import { PrivateRoute } from '@/components/PrivateRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { apiService } from '@/services/api';
import { uploadService } from '@/services/uploadService';
import { Produto } from '@/types';
import {
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader,
  Package,
  Upload,
  Trash2,
  Image,
  ExternalLink,
  Link,
  Database,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { parseGoogleDriveLink } from '@/utils/drive';
import toast from 'react-hot-toast';

export default function ConfiguracoesPage() {
  const [blingKey, setBlingKey] = useState('');
  const [empresaNome, setEmpresaNome] = useState('');
  const [emailSuporte, setEmailSuporte] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [blingStatus, setBlingStatus] = useState<'untested' | 'testing' | 'ok' | 'error'>('untested');

  // Produtos
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(false);
  const [uploadingProdutoId, setUploadingProdutoId] = useState<string | null>(null);
  const [driveUrlInputs, setDriveUrlInputs] = useState<Record<string, string>>({});
  const [savingDriveId, setSavingDriveId] = useState<string | null>(null);
  const [csvClientes, setCsvClientes] = useState('');
  const [csvProdutos, setCsvProdutos] = useState('');
  const [importingClientes, setImportingClientes] = useState(false);
  const [importingProdutos, setImportingProdutos] = useState(false);

  useEffect(() => { loadConfigs(); loadProdutos(); }, []);

  const loadConfigs = async () => {
    try {
      setIsLoading(true);
      const [blingResp, empresaResp, emailResp] = await Promise.all([
        apiService.api.get('/configuracoes/bling_api_key'),
        apiService.api.get('/configuracoes/empresa_nome'),
        apiService.api.get('/configuracoes/email_suporte'),
      ]);
      if (blingResp.data?.configurado) setBlingKey(blingResp.data.valor);
      if (empresaResp.data?.configurado) setEmpresaNome(empresaResp.data.valor);
      if (emailResp.data?.configurado) setEmailSuporte(emailResp.data.valor);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const loadProdutos = async () => {
    try {
      setIsLoadingProdutos(true);
      const data = await apiService.listarProdutos();
      setProdutos(data || []);
    } catch {
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoadingProdutos(false);
    }
  };

  const handleSaveBling = async () => {
    if (!blingKey.trim()) { toast.error('Chave do Bling não pode estar vazia'); return; }
    setIsSaving(true);
    try {
      await apiService.api.post('/configuracoes', { tipo: 'bling_api_key', valor: blingKey });
      toast.success('Chave Bling salva!');
      setBlingStatus('untested');
    } catch (err: any) {
      toast.error(err?.response?.data?.erro || 'Erro ao salvar');
      setBlingStatus('error');
    } finally { setIsSaving(false); }
  };

  const handleTestBling = async () => {
    if (!blingKey.trim()) { toast.error('Configure a chave primeiro'); return; }
    setBlingStatus('testing');
    try {
      const response = await apiService.api.post('/configuracoes/bling/testar', {});
      toast.success(`Conexão OK! ${response.data.clientes_encontrados} clientes encontrados`);
      setBlingStatus('ok');
    } catch (err: any) {
      toast.error(err?.response?.data?.mensagem || 'Erro ao testar conexão');
      setBlingStatus('error');
    }
  };

  const handleSaveEmpresa = async () => {
    if (!empresaNome.trim()) { toast.error('Nome da empresa não pode estar vazio'); return; }
    setIsSaving(true);
    try {
      await apiService.api.post('/configuracoes', { tipo: 'empresa_nome', valor: empresaNome });
      toast.success('Nome da empresa salvo!');
    } catch { toast.error('Erro ao salvar'); }
    finally { setIsSaving(false); }
  };

  const handleSaveEmail = async () => {
    if (!emailSuporte.trim()) { toast.error('Email não pode estar vazio'); return; }
    setIsSaving(true);
    try {
      await apiService.api.post('/configuracoes', { tipo: 'email_suporte', valor: emailSuporte });
      toast.success('Email de suporte salvo!');
    } catch { toast.error('Erro ao salvar'); }
    finally { setIsSaving(false); }
  };

  const handleUploadFoto = async (produto: Produto) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      if (file.size / (1024 * 1024) > 100) {
        toast.error('Arquivo muito grande. Máximo: 100MB');
        return;
      }

      setUploadingProdutoId(produto.id);
      try {
        const result = await uploadService.uploadArquivo(file);
        await apiService.atualizarFotoProduto(produto.id, result.url);
        toast.success(`Foto de "${produto.nome}" salva!`);
        loadProdutos();
      } catch {
        toast.error('Erro ao enviar foto');
      } finally {
        setUploadingProdutoId(null);
      }
    };
    input.click();
  };

  const handleRemoverFoto = async (produto: Produto) => {
    try {
      await apiService.removerFotoProduto(produto.id);
      toast.success(`Foto de "${produto.nome}" removida`);
      loadProdutos();
    } catch {
      toast.error('Erro ao remover foto');
    }
  };

  const handleSaveDriveLink = async (produto: Produto) => {
    const raw = driveUrlInputs[produto.id]?.trim();
    if (!raw) { toast.error('Cole o link do Google Drive primeiro'); return; }
    const directUrl = parseGoogleDriveLink(raw);
    if (!directUrl) { toast.error('Link do Google Drive inválido'); return; }
    setSavingDriveId(produto.id);
    try {
      await apiService.atualizarFotoProduto(produto.id, directUrl);
      toast.success(`Foto de "${produto.nome}" salva do Drive!`);
      setDriveUrlInputs((prev) => ({ ...prev, [produto.id]: '' }));
      loadProdutos();
    } catch {
      toast.error('Erro ao salvar link');
    } finally {
      setSavingDriveId(null);
    }
  };

  const handleImportClientes = async () => {
    if (!csvClientes.trim()) return;
    setImportingClientes(true);
    try {
      const result = await apiService.importarClientesCSV(csvClientes);
      toast.success(result.mensagem);
      setCsvClientes('');
    } catch (err: any) {
      toast.error(err?.response?.data?.erro || 'Erro ao importar clientes');
      console.error('Import error:', err?.response?.data || err);
    } finally {
      setImportingClientes(false);
    }
  };

  const handleImportProdutos = async () => {
    if (!csvProdutos.trim()) return;
    setImportingProdutos(true);
    try {
      const result = await apiService.importarProdutosCSV(csvProdutos);
      toast.success(result.mensagem);
      setCsvProdutos('');
      loadProdutos();
    } catch (err: any) {
      toast.error(err?.response?.data?.erro || 'Erro ao importar produtos');
      console.error('Import error:', err?.response?.data || err);
    } finally {
      setImportingProdutos(false);
    }
  };

  if (isLoading) {
    return (
      <PrivateRoute allowedRoles={['direcao']}>
        <DashboardLayout>
          <div className="flex items-center justify-center py-24">
            <Spinner size={32} />
          </div>
        </DashboardLayout>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute allowedRoles={['direcao']}>
      <DashboardLayout>
        <div className="animate-slide-up mb-8">
          <p className="text-xs text-[var(--text-muted)] font-medium mb-1">Administração</p>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            <Settings size={28} className="text-[var(--text-muted)]" />
            Configurações
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1.5">Integre com seus serviços externos</p>
        </div>

        {/* Bling ERP */}
        <Card className="mb-5 animate-slide-up">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Bling ERP</h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Integre com seu ERP para buscar clientes e produtos automaticamente
              </p>
            </div>
            {blingStatus === 'ok' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--success-muted)] text-[var(--success)] border border-[var(--success)]/25">
                <CheckCircle size={13} /> Conectado
              </span>
            )}
            {blingStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--danger-muted)] text-[var(--danger)] border border-[var(--danger)]/25">
                <AlertCircle size={13} /> Erro
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Chave de API do Bling
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={blingKey}
                    onChange={(e) => { setBlingKey(e.target.value); setBlingStatus('untested'); }}
                    placeholder="Cole sua chave de API do Bling aqui..."
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl px-4 py-2.5 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Button onClick={handleSaveBling} loading={isSaving}>Salvar</Button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                Vá em Painel Bling → Usuários → [seu usuário] → Chave de API
              </p>
            </div>

            <Button variant="secondary" className="!w-full" onClick={handleTestBling}
              disabled={blingStatus === 'testing' || !blingKey}
              icon={blingStatus === 'testing' ? <Loader size={14} className="animate-spin" /> : undefined}>
              {blingStatus === 'testing' ? 'Testando conexão...' : 'Testar Conexão'}
            </Button>

            <div className="p-4 rounded-xl bg-[var(--accent-muted)] border border-[var(--accent)]/20">
              <p className="text-sm text-[var(--accent)]">
                <strong>Como obter a chave:</strong> Acesse seu painel do Bling, vá em
                Configurações → Usuários, clique no seu usuário e copie a Chave de API.
              </p>
            </div>
          </div>
        </Card>

        {/* Empresa */}
        <Card className="mb-5 animate-slide-up">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-5">Informações da Empresa</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Nome da Empresa
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={empresaNome}
                  onChange={(e) => setEmpresaNome(e.target.value)}
                  placeholder="Ex: Garantia Express"
                  className="flex-1 bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
                />
                <Button onClick={handleSaveEmpresa} loading={isSaving}>Salvar</Button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Email de Suporte
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailSuporte}
                  onChange={(e) => setEmailSuporte(e.target.value)}
                  placeholder="suporte@empresa.com"
                  className="flex-1 bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
                />
                <Button onClick={handleSaveEmail} loading={isSaving}>Salvar</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* ===== Importar Dados ===== */}
        <Card className="mb-5 animate-slide-up">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <Database size={22} className="text-[var(--accent)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Importar Dados</h2>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Exporte clientes e produtos do Bling como CSV e cole abaixo
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Clientes */}
            <div className="p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 mb-3">
                <FileSpreadsheet size={16} className="text-[var(--info)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Clientes</h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                Colunas do Bling: <code className="text-[var(--accent)]">nome, telefone, email, endereco</code>
              </p>
              <textarea
                value={csvClientes}
                onChange={(e) => setCsvClientes(e.target.value)}
                placeholder={`Nome,Telefone,Email,Endereço\nJoão da Silva,11999999999,joao@email.com,Rua A 123`}
                rows={4}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all focus:border-[var(--accent)] resize-vertical font-mono"
              />
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 w-full"
                icon={<Download size={13} />}
                onClick={handleImportClientes}
                disabled={importingClientes || !csvClientes.trim()}
                loading={importingClientes}
              >
                {importingClientes ? 'Importando...' : 'Importar Clientes'}
              </Button>
            </div>

            {/* Produtos */}
            <div className="p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 mb-3">
                <FileSpreadsheet size={16} className="text-[var(--accent)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Produtos</h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                Colunas do Bling: <code className="text-[var(--accent)]">Código, Descrição</code>
              </p>
              <textarea
                value={csvProdutos}
                onChange={(e) => setCsvProdutos(e.target.value)}
                placeholder={`Código,Descrição\nLED RGB 10W,LED colorido para automotivo`}
                rows={4}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all focus:border-[var(--accent)] resize-vertical font-mono"
              />
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 w-full"
                icon={<Download size={13} />}
                onClick={handleImportProdutos}
                disabled={importingProdutos || !csvProdutos.trim()}
                loading={importingProdutos}
              >
                {importingProdutos ? 'Importando...' : 'Importar Produtos'}
              </Button>
            </div>
          </div>
        </Card>

        {/* ===== Fotos dos Produtos ===== */}
        <Card className="mb-5 animate-slide-up">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <Package size={22} className="text-[var(--accent)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Fotos dos Produtos</h2>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Adicione fotos dos SKUs para que vendedores e logística identifiquem visualmente cada produto
              </p>
            </div>
          </div>

          {/* Acesso rápido ao Drive */}
          <div className="flex gap-3 mb-6">
            <a
              href="https://drive.google.com/drive/folders/1jF97SinsgYPPfwi7jt9QdVuD_R_8ps66"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] hover:border-[var(--border-medium)] transition-colors"
            >
              <ExternalLink size={15} className="text-[var(--accent)]" />
              Abrir pasta de Fotos
            </a>
            <a
              href="https://drive.google.com/drive/folders/19znsWmJOpiARYcsRWQ8InNCu_MiL7HEV"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] hover:border-[var(--border-medium)] transition-colors"
            >
              <ExternalLink size={15} className="text-[var(--brand-yellow)]" />
              Abrir pasta de Vídeos
            </a>
          </div>

          {isLoadingProdutos ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={24} />
            </div>
          ) : produtos.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">
              Nenhum produto cadastrado
            </p>
          ) : (
            <div className="space-y-2">
              {produtos.map((produto) => (
                <div
                  key={produto.id}
                  className="flex flex-col gap-3 px-5 py-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                >
                  {/* Linha superior — preview + info + badges + ações */}
                  <div className="flex items-center gap-4">
                    {/* Preview da foto */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--bg-input)] border border-[var(--border-subtle)] flex-shrink-0 flex items-center justify-center">
                      {produto.foto_url ? (
                        <img
                          src={produto.foto_url}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image size={20} className="text-[var(--text-muted)]" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">{produto.nome}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {produto.categoria}
                        {produto.total_defeitos > 0 && ` · ${produto.total_defeitos} defeitos registrados`}
                      </p>
                    </div>

                    {/* Status */}
                    {produto.foto_url ? (
                      <Badge variant="success" className="flex-shrink-0">
                        <CheckCircle size={10} /> Com foto
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="flex-shrink-0">
                        Sem foto
                      </Badge>
                    )}

                    {/* Ações */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={uploadingProdutoId === produto.id ? <Loader size={13} className="animate-spin" /> : <Upload size={13} />}
                        onClick={() => handleUploadFoto(produto)}
                        disabled={uploadingProdutoId === produto.id}
                      >
                        {uploadingProdutoId === produto.id ? 'Enviando...' : 'Upload'}
                      </Button>
                      {produto.foto_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={13} />}
                          onClick={() => handleRemoverFoto(produto)}
                          className="text-[var(--danger)] hover:bg-[var(--danger-muted)]"
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Linha inferior — colar link do Drive */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      <input
                        type="text"
                        value={driveUrlInputs[produto.id] || ''}
                        onChange={(e) =>
                          setDriveUrlInputs((prev) => ({ ...prev, [produto.id]: e.target.value }))
                        }
                        placeholder="Colar link do Google Drive..."
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all focus:border-[var(--accent)]"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={savingDriveId === produto.id ? <Loader size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                      onClick={() => handleSaveDriveLink(produto)}
                      disabled={savingDriveId === produto.id || !driveUrlInputs[produto.id]?.trim()}
                    >
                      {savingDriveId === produto.id ? 'Salvando...' : 'Aplicar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Status */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up">
          {[
            { label: 'Bling ERP', value: blingStatus === 'ok' ? 'Conectado' : blingStatus === 'error' ? 'Erro' : 'Não testado', ok: blingStatus === 'ok' },
            { label: 'Empresa', value: empresaNome || 'Não configurada', ok: !!empresaNome },
            { label: 'Email Suporte', value: emailSuporte || 'Não configurado', ok: !!emailSuporte },
          ].map((s) => (
            <Card key={s.label} className="!p-4">
              <p className="text-xs text-[var(--text-muted)] font-medium">{s.label}</p>
              <p className={`text-sm font-bold mt-1.5 ${s.ok ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                {s.ok ? <CheckCircle size={14} className="inline mr-1" /> : null}
                {s.value}
              </p>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    </PrivateRoute>
  );
}
