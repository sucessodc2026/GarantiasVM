'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  CheckCircle,
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
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={null}>
      <ConfiguracoesPageConteudo />
    </Suspense>
  );
}

function ConfiguracoesPageConteudo() {
  const searchParams = useSearchParams();
  const [empresaNome, setEmpresaNome] = useState('');
  const [emailSuporte, setEmailSuporte] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [blingConectado, setBlingConectado] = useState(false);
  const [conectandoBling, setConectandoBling] = useState(false);
  const [sincronizandoBling, setSincronizandoBling] = useState(false);

  // Produtos
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(false);
  const [uploadingProdutoId, setUploadingProdutoId] = useState<string | null>(null);
  const [csvClientes, setCsvClientes] = useState('');
  const [csvProdutos, setCsvProdutos] = useState('');
  const [importingClientes, setImportingClientes] = useState(false);
  const [importingProdutos, setImportingProdutos] = useState(false);

  // Cadastro manual de produto/variação
  const [expandido, setExpandido] = useState<string | null>(null);
  const [novaVariacao, setNovaVariacao] = useState<Record<string, string>>({});
  const [salvandoVariacao, setSalvandoVariacao] = useState<string | null>(null);
  const [showNovoProduto, setShowNovoProduto] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  // Cadastro manual de cliente
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteCpfCnpj, setNovoClienteCpfCnpj] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [novoClienteEmail, setNovoClienteEmail] = useState('');
  const [novoClienteCidade, setNovoClienteCidade] = useState('');
  const [salvandoCliente, setSalvandoCliente] = useState(false);

  useEffect(() => { loadConfigs(); loadProdutos(); loadBlingStatus(); }, []);

  // Depois do redirect de volta do OAuth do Bling (?bling=conectado|erro)
  useEffect(() => {
    const bling = searchParams.get('bling');
    if (bling === 'conectado') {
      toast.success('Bling conectado com sucesso!');
      loadBlingStatus();
    } else if (bling === 'erro') {
      toast.error('Não foi possível conectar com o Bling. Tente novamente.');
    }
  }, [searchParams]);

  const loadConfigs = async () => {
    try {
      setIsLoading(true);
      const [empresaResp, emailResp] = await Promise.all([
        apiService.api.get('/configuracoes/empresa_nome'),
        apiService.api.get('/configuracoes/email_suporte'),
      ]);
      if (empresaResp.data?.configurado) setEmpresaNome(empresaResp.data.valor);
      if (emailResp.data?.configurado) setEmailSuporte(emailResp.data.valor);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const loadBlingStatus = async () => {
    try {
      const r = await apiService.blingStatus();
      setBlingConectado(r.bling === 'Conectado');
    } catch {
      // silent
    }
  };

  const handleConectarBling = async () => {
    setConectandoBling(true);
    try {
      const { url } = await apiService.blingOauthIniciar();
      window.location.href = url;
    } catch (err: any) {
      toast.error(err?.response?.data?.erro || 'Erro ao iniciar conexão com o Bling');
      setConectandoBling(false);
    }
  };

  const handleSincronizarBling = async () => {
    setSincronizandoBling(true);
    try {
      const r = await apiService.blingSincronizar();
      toast.success(`Sincronizado! ${r.clientes_sincronizados} clientes`);
    } catch (err: any) {
      toast.error(err?.response?.data?.erro || 'Erro ao sincronizar com o Bling');
    } finally {
      setSincronizandoBling(false);
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

  // A foto é do MODELO, não do encaixe: agrupa os 109 SKUs em ~29 modelos.
  const modelos = useMemo(() => {
    const mapa = new Map<string, { chave: string; representante: Produto; variacoes: number; comFoto: number }>();
    for (const p of produtos) {
      const chave = p.familia || p.nome;
      const atual = mapa.get(chave);
      if (atual) {
        atual.variacoes += 1;
        if (p.foto_url) atual.comFoto += 1;
      } else {
        mapa.set(chave, { chave, representante: p, variacoes: 1, comFoto: p.foto_url ? 1 : 0 });
      }
    }
    return Array.from(mapa.values());
  }, [produtos]);

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
        const r = await apiService.atualizarFotoFamilia(produto.familia || produto.nome, result.url);
        toast.success(r.mensagem);
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
      const r = await apiService.atualizarFotoFamilia(produto.familia || produto.nome);
      toast.success(r.mensagem);
      loadProdutos();
    } catch {
      toast.error('Erro ao remover foto');
    }
  };

  // Nova variação (ex: chegou o encaixe H11 de um modelo que só tinha H16)
  const handleAdicionarVariacao = async (chaveFamilia: string) => {
    const codigo = (novaVariacao[chaveFamilia] || '').trim();
    if (!codigo) { toast.error('Informe o código (SKU) da variação'); return; }
    setSalvandoVariacao(chaveFamilia);
    try {
      await apiService.criarProduto({ nome: codigo, familia_existente: chaveFamilia });
      toast.success(`${codigo} adicionado a ${chaveFamilia}`);
      setNovaVariacao((prev) => ({ ...prev, [chaveFamilia]: '' }));
      loadProdutos();
    } catch (err: any) {
      toast.error(err?.response?.data?.erro || 'Erro ao cadastrar variação');
    } finally {
      setSalvandoVariacao(null);
    }
  };

  // Produto totalmente novo — sem vínculo com nenhum modelo existente
  const handleCriarProduto = async () => {
    if (!novoNome.trim()) { toast.error('Informe o código (SKU) do produto'); return; }
    setSalvandoNovo(true);
    try {
      await apiService.criarProduto({
        nome: novoNome.trim(),
        descricao: novaDescricao.trim() || undefined,
        categoria: novaCategoria.trim() || undefined,
      });
      toast.success('Produto cadastrado!');
      setNovoNome(''); setNovaDescricao(''); setNovaCategoria('');
      setShowNovoProduto(false);
      loadProdutos();
    } catch (err: any) {
      toast.error(err?.response?.data?.erro || 'Erro ao cadastrar produto');
    } finally {
      setSalvandoNovo(false);
    }
  };

  const handleCriarCliente = async () => {
    if (!novoClienteNome.trim()) { toast.error('Informe o nome do cliente'); return; }
    setSalvandoCliente(true);
    try {
      await apiService.criarCliente({
        nome: novoClienteNome.trim(),
        cpf_cnpj: novoClienteCpfCnpj.trim() || undefined,
        telefone: novoClienteTelefone.trim() || undefined,
        email: novoClienteEmail.trim() || undefined,
        cidade: novoClienteCidade.trim() || undefined,
      });
      toast.success('Cliente cadastrado!');
      setNovoClienteNome(''); setNovoClienteCpfCnpj(''); setNovoClienteTelefone('');
      setNovoClienteEmail(''); setNovoClienteCidade('');
      setShowNovoCliente(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.erro || 'Erro ao cadastrar cliente');
    } finally {
      setSalvandoCliente(false);
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
                Conecte sua conta Bling para importar clientes e produtos automaticamente
              </p>
            </div>
            {blingConectado && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--success-muted)] text-[var(--success)] border border-[var(--success)]/25">
                <CheckCircle size={13} /> Conectado
              </span>
            )}
          </div>

          <div className="space-y-3">
            {!blingConectado ? (
              <Button className="!w-full" onClick={handleConectarBling} loading={conectandoBling}
                icon={<Link size={14} />}>
                Conectar com Bling
              </Button>
            ) : (
              <Button variant="secondary" className="!w-full" onClick={handleSincronizarBling}
                loading={sincronizandoBling}
                icon={sincronizandoBling ? <Loader size={14} className="animate-spin" /> : undefined}>
                {sincronizandoBling ? 'Sincronizando...' : 'Sincronizar agora'}
              </Button>
            )}
            <p className="text-xs text-[var(--text-muted)]">
              {blingConectado
                ? 'A conexão fica ativa; use "Sincronizar agora" para trazer clientes e produtos novos do Bling.'
                : 'Você será redirecionado para o Bling para autorizar o acesso.'}
            </p>
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

        {/* ===== Novo Cliente ===== */}
        <Card className="mb-5 animate-slide-up">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Cadastrar Cliente</h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Para casos avulsos — clientes em volume, use a importação por CSV abaixo
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setShowNovoCliente((v) => !v)}
            >
              Novo Cliente
            </Button>
          </div>

          {showNovoCliente && (
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3 animate-slide-up">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Nome *</label>
                  <input
                    type="text"
                    value={novoClienteNome}
                    onChange={(e) => setNovoClienteNome(e.target.value)}
                    placeholder="Ex: Daniel Marcos dos Santos"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">CPF/CNPJ</label>
                  <input
                    type="text"
                    value={novoClienteCpfCnpj}
                    onChange={(e) => setNovoClienteCpfCnpj(e.target.value)}
                    placeholder="Ex: 43.926.174/0001-92"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Telefone</label>
                  <input
                    type="text"
                    value={novoClienteTelefone}
                    onChange={(e) => setNovoClienteTelefone(e.target.value)}
                    placeholder="Ex: 11999999999"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Email</label>
                  <input
                    type="email"
                    value={novoClienteEmail}
                    onChange={(e) => setNovoClienteEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Cidade</label>
                <input
                  type="text"
                  value={novoClienteCidade}
                  onChange={(e) => setNovoClienteCidade(e.target.value)}
                  placeholder="Ex: Cuiabá"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowNovoCliente(false)}>Cancelar</Button>
                <Button size="sm" loading={salvandoCliente} onClick={handleCriarCliente}>Cadastrar</Button>
              </div>
            </div>
          )}
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
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setShowNovoProduto((v) => !v)}
            >
              Novo Produto
            </Button>
          </div>

          {/* Cadastro de produto sem vínculo com nenhum modelo existente.
              Para adicionar variação de um modelo já cadastrado, use o "+"
              dentro da própria linha do modelo, mais abaixo. */}
          {showNovoProduto && (
            <div className="mb-5 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3 animate-slide-up">
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Cadastrar produto novo
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Código (SKU) *</label>
                  <input
                    type="text"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: LANTLED30"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">Categoria</label>
                  <input
                    type="text"
                    value={novaCategoria}
                    onChange={(e) => setNovaCategoria(e.target.value)}
                    placeholder="Ex: Lanternas"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1">Descrição</label>
                <input
                  type="text"
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  placeholder="Ex: LANTERNA LED 30CM - 6000K"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowNovoProduto(false)}>Cancelar</Button>
                <Button size="sm" loading={salvandoNovo} onClick={handleCriarProduto}>Cadastrar</Button>
              </div>
            </div>
          )}

          {isLoadingProdutos ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={24} />
            </div>
          ) : modelos.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">
              Nenhum produto cadastrado
            </p>
          ) : (
            <div className="space-y-2">
              {modelos.map(({ representante: produto, variacoes }) => {
                const chave = produto.familia || produto.nome;
                const aberto = expandido === chave;
                const skusDoModelo = produtos.filter((p) => (p.familia || p.nome) === chave);
                return (
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

                    {/* Info — clicar expande e mostra os SKUs/variações */}
                    <button
                      type="button"
                      onClick={() => setExpandido(aberto ? null : chave)}
                      className="flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                        {produto.familia || produto.nome}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {variacoes > 1
                          ? `${variacoes} variações · a foto vale para todas`
                          : produto.nome}
                        {' · '}
                        <span className="text-[var(--accent)]">{aberto ? 'ocultar' : 'ver variações'}</span>
                      </p>
                    </button>

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

                  {/* Variações do modelo + cadastro de uma nova */}
                  {aberto && (
                    <div className="pl-[72px] animate-slide-up">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {skusDoModelo.map((sku) => (
                          <span
                            key={sku.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--bg-input)] border border-[var(--border-medium)] text-[var(--text-secondary)]"
                          >
                            {sku.variacao || sku.nome}
                            <span className="text-[var(--text-muted)] font-normal">{sku.nome}</span>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={novaVariacao[chave] || ''}
                          onChange={(e) => setNovaVariacao((prev) => ({ ...prev, [chave]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAdicionarVariacao(chave)}
                          placeholder="Código da variação nova (ex: COREH27)"
                          className="flex-1 bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
                        />
                        <Button
                          size="sm"
                          icon={<Plus size={13} />}
                          loading={salvandoVariacao === chave}
                          onClick={() => handleAdicionarVariacao(chave)}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Status */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up">
          {[
            { label: 'Bling ERP', value: blingConectado ? 'Conectado' : 'Não conectado', ok: blingConectado },
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
