'use client';

import { useEffect, useState } from 'react';
import { PrivateRoute } from '@/components/PrivateRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Garantia } from '@/types';
import { apiService } from '@/services/api';
import { Users, Search, Phone, Mail, MapPin, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface ClienteBusca {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  cpf_cnpj?: string;
  cidade?: string;
  cep?: string;
  criado_em: string;
}

export default function ClientesPage() {
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState<ClienteBusca[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [buscou, setBuscou] = useState(false);

  const [expandido, setExpandido] = useState<string | null>(null);
  const [historico, setHistorico] = useState<Record<string, Garantia[]>>({});
  const [carregandoHistorico, setCarregandoHistorico] = useState<string | null>(null);

  // Busca com debounce — evita bater na API a cada tecla digitada.
  useEffect(() => {
    if (!busca.trim()) { setClientes([]); setBuscou(false); return; }
    const timer = setTimeout(() => buscarClientes(busca), 400);
    return () => clearTimeout(timer);
  }, [busca]);

  const buscarClientes = async (termo: string) => {
    setIsLoading(true);
    try {
      const data = await apiService.listarClientes(termo);
      setClientes(data || []);
      setBuscou(true);
    } catch {
      toast.error('Erro ao buscar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHistorico = async (clienteId: string) => {
    if (expandido === clienteId) { setExpandido(null); return; }
    setExpandido(clienteId);
    if (!historico[clienteId]) {
      setCarregandoHistorico(clienteId);
      try {
        const garantias = await apiService.historicoCliente(clienteId);
        setHistorico((prev) => ({ ...prev, [clienteId]: garantias || [] }));
      } catch {
        toast.error('Erro ao carregar histórico do cliente');
      } finally {
        setCarregandoHistorico(null);
      }
    }
  };

  return (
    <PrivateRoute allowedRoles={['direcao']}>
      <DashboardLayout>
        <div className="animate-slide-up mb-8">
          <p className="text-xs text-[var(--text-muted)] font-medium mb-1">Administração</p>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            <Users size={28} className="text-[var(--text-muted)]" />
            Clientes
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1.5">Consulte clientes por nome, CPF/CNPJ, telefone ou cidade</p>
        </div>

        <Card className="mb-5 animate-slide-up">
          <Input
            icon={<Search size={16} />}
            placeholder="Buscar por nome, CPF/CNPJ, telefone, email ou cidade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            autoFocus
          />
        </Card>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : !buscou ? (
          <Card>
            <EmptyState icon={<Search size={20} />} title="Busque um cliente" description="Digite acima pra encontrar um cliente cadastrado." />
          </Card>
        ) : clientes.length === 0 ? (
          <Card>
            <EmptyState icon={<Users size={20} />} title="Nenhum cliente encontrado" description="Tente outro termo de busca." />
          </Card>
        ) : (
          <div className="space-y-2">
            {clientes.map((c) => (
              <Card key={c.id} className="!p-0 overflow-hidden animate-slide-up">
                <button
                  type="button"
                  onClick={() => toggleHistorico(c.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{c.nome}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[var(--text-muted)]">
                      {c.cpf_cnpj && <span>{c.cpf_cnpj}</span>}
                      {c.telefone && <span className="flex items-center gap-1"><Phone size={11} />{c.telefone}</span>}
                      {c.email && <span className="flex items-center gap-1"><Mail size={11} />{c.email}</span>}
                      {c.cidade && <span className="flex items-center gap-1"><MapPin size={11} />{c.cidade}</span>}
                    </div>
                  </div>
                  {expandido === c.id ? <ChevronUp size={16} className="text-[var(--text-muted)] flex-shrink-0" /> : <ChevronDown size={16} className="text-[var(--text-muted)] flex-shrink-0" />}
                </button>

                {expandido === c.id && (
                  <div className="px-5 pb-4 border-t border-[var(--border-subtle)] pt-3">
                    <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText size={12} /> Histórico de garantias
                    </p>
                    {carregandoHistorico === c.id ? (
                      <div className="flex justify-center py-4"><Spinner size={20} /></div>
                    ) : (historico[c.id]?.length || 0) === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] py-2">Nenhuma solicitação de garantia registrada.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {historico[c.id].map((g) => (
                          <div key={g.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] text-xs">
                            <span className="text-[var(--text-primary)] font-medium truncate">{g.produto_nome || 'Produto'}</span>
                            <span className="text-[var(--text-muted)] flex-shrink-0">
                              {new Date(g.criado_em).toLocaleDateString('pt-BR')} · {g.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </DashboardLayout>
    </PrivateRoute>
  );
}
