'use client';

import { useEffect, useState } from 'react';
import { PrivateRoute } from '@/components/PrivateRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Usuario } from '@/types';
import { apiService } from '@/services/api';
import {
  Users,
  Plus,
  ShieldCheck,
  Truck,
  Search,
  Mail,
  Phone,
  Lock,
  User,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Filtro = 'todos' | 'vendedor' | 'logistica';

export default function GerenciarUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busca, setBusca] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<'vendedor' | 'logistica'>('vendedor');

  useEffect(() => { loadUsuarios(); }, []);

  const loadUsuarios = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.listarUsuarios();
      setUsuarios(data);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNome(''); setEmail(''); setSenha(''); setTelefone('');
    setTipoUsuario('vendedor'); setShowSenha(false);
  };

  const handleCriar = async () => {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      toast.error('Nome, email e senha são obrigatórios');
      return;
    }
    if (senha.length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres');
      return;
    }
    setIsSaving(true);
    try {
      await apiService.criarUsuario({ nome, email, senha, tipo_usuario: tipoUsuario, telefone });
      toast.success(`Usuário ${nome} criado!`);
      setShowModal(false);
      resetForm();
      loadUsuarios();
    } catch (err: any) {
      toast.error(err?.response?.data?.erro || 'Erro ao criar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (usuario: Usuario) => {
    try {
      await apiService.toggleUsuario(usuario.id);
      toast.success(usuario.ativo ? `${usuario.nome} desativado` : `${usuario.nome} ativado`);
      loadUsuarios();
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  const usuariosFiltrados = usuarios
    .filter(u => u.tipo_usuario !== 'direcao')
    .filter(u => filtro === 'todos' || u.tipo_usuario === filtro)
    .filter(u =>
      busca === '' ||
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase())
    );

  const totalVendedores = usuarios.filter(u => u.tipo_usuario === 'vendedor').length;
  const totalLogistica = usuarios.filter(u => u.tipo_usuario === 'logistica').length;
  const totalAtivos = usuarios.filter(u => u.ativo && u.tipo_usuario !== 'direcao').length;

  const filtros: { value: Filtro; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'vendedor', label: 'Vendedor' },
    { value: 'logistica', label: 'Logística' },
  ];

  return (
    <PrivateRoute allowedRoles={['direcao']}>
      <DashboardLayout>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-7 animate-slide-up">
          <div>
            <p className="text-xs text-[var(--text-muted)] font-medium mb-1">Administração</p>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Gerenciar Usuários
            </h1>
          </div>
          <Button icon={<Plus size={16} />} onClick={() => { resetForm(); setShowModal(true); }}>
            Novo Usuário
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6 animate-slide-up">
          {[
            { label: 'Vendedores', value: totalVendedores, icon: <ShieldCheck size={18} />, color: '#a78bfa' },
            { label: 'Logística', value: totalLogistica, icon: <Truck size={18} />, color: 'var(--info)' },
            { label: 'Ativos', value: totalAtivos, icon: <UserCheck size={18} />, color: 'var(--success)' },
          ].map((s) => (
            <Card key={s.label} className="!p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}30`, color: s.color }}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-xl font-extrabold text-[var(--text-primary)]">{s.value}</p>
                  <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filtros + busca */}
        <div className="flex gap-3 mb-5 flex-wrap items-center animate-slide-up">
          <div className="flex gap-1.5">
            {filtros.map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  filtro === f.value
                    ? 'bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]/30'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl pl-10 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
            />
          </div>
        </div>

        {/* Tabela */}
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : usuariosFiltrados.length === 0 ? (
          <EmptyState
            icon={<Users size={40} />}
            title={busca ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            description={busca ? 'Tente outra busca' : 'Clique em "Novo Usuário" para adicionar'}
            action={busca ? undefined : { label: 'Novo Usuário', icon: <Plus size={16} />, onClick: () => { resetForm(); setShowModal(true); } }}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] animate-slide-up">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_120px_100px_100px] gap-3 px-5 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)]">
              {['Usuário', 'Email', 'Tipo', 'Status', 'Ação'].map(h => (
                <span key={h} className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{h}</span>
              ))}
            </div>
            {/* Linhas */}
            {usuariosFiltrados.map((u, i) => (
              <div
                key={u.id}
                className="grid grid-cols-[1fr_1fr_120px_100px_100px] gap-3 px-5 py-3.5 items-center transition-colors hover:bg-[var(--bg-hover)]"
                style={{ borderBottom: i < usuariosFiltrados.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    u.ativo ? '' : 'opacity-45'
                  }`}
                    style={{
                      background: u.tipo_usuario === 'vendedor' ? 'rgba(167,139,250,0.12)' : 'var(--info-muted)',
                      border: `1px solid ${u.tipo_usuario === 'vendedor' ? 'rgba(167,139,250,0.25)' : 'rgba(56,189,248,0.25)'}`,
                      color: u.tipo_usuario === 'vendedor' ? '#a78bfa' : 'var(--info)',
                    }}>
                    {u.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${u.ativo ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{u.nome}</p>
                    {u.telefone && <p className="text-[11px] text-[var(--text-muted)]">{u.telefone}</p>}
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] truncate">{u.email}</p>
                <div>
                  {u.tipo_usuario === 'vendedor' ? (
                    <Badge variant="info" className="!text-[11px]"><ShieldCheck size={10} /> Vendedor</Badge>
                  ) : (
                    <Badge variant="info" className="!text-[11px]"><Truck size={10} /> Logística</Badge>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full w-fit ${
                  u.ativo ? 'bg-[var(--success-muted)] text-[var(--success)]' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                }`}>
                  {u.ativo ? <><UserCheck size={10} /> Ativo</> : <><UserX size={10} /> Inativo</>}
                </span>
                <Button
                  variant={u.ativo ? 'danger' : 'primary'}
                  size="sm"
                  icon={u.ativo ? <UserX size={13} /> : <UserCheck size={13} />}
                  onClick={() => handleToggle(u)}
                >
                  {u.ativo ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DashboardLayout>

      {/* Modal Criar Usuário */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title="Novo Usuário"
        subtitle="Crie um acesso para vendedor ou logística"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button variant="primary" className="flex-[2]" loading={isSaving} icon={<Plus size={16} />} onClick={handleCriar}>
              {isSaving ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Tipo de usuário */}
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
              Tipo de Acesso
            </label>
            <div className="flex gap-2.5">
              {(['vendedor', 'logistica'] as const).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setTipoUsuario(tipo)}
                  className={`flex-1 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl cursor-pointer font-semibold text-sm transition-all duration-150 border-2 ${
                    tipoUsuario === tipo
                      ? tipo === 'vendedor'
                        ? 'border-[#a78bfa]/60 bg-[#a78bfa]/10 text-[#a78bfa]'
                        : 'border-[var(--info)]/60 bg-[var(--info-muted)] text-[var(--info)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--border-medium)]'
                  }`}
                >
                  {tipo === 'vendedor' ? <ShieldCheck size={20} /> : <Truck size={20} />}
                  {tipo === 'vendedor' ? 'Vendedor' : 'Logística'}
                </button>
              ))}
            </div>
          </div>

          <Input label="Nome completo" icon={<User size={14} />}
            value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Ex: João da Silva" />

          <Input label="Email" icon={<Mail size={14} />} type="email"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="joao@empresa.com" />

          <Input label="Telefone (opcional)" icon={<Phone size={14} />}
            value={telefone} onChange={e => setTelefone(e.target.value)}
            placeholder="(11) 99999-9999" />

          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
              Senha inicial
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              <input
                type={showSenha ? 'text' : 'password'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl pl-10 pr-11 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
              />
              <button
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"
              >
                {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
              O usuário poderá alterar a senha após o primeiro acesso
            </p>
          </div>
        </div>
      </Modal>
    </PrivateRoute>
  );
}
