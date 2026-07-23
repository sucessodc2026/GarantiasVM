'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, senha);
      toast.success('Acesso autorizado');
      router.push('/dashboard');
    } catch {
      toast.error('Email ou senha inválidos');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex">
      {/* Painel esquerdo — branding */}
      <div className="flex-1 hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0E0F1A 0%, #13142B 50%, #0A0B0F 100%)' }}
      >
        <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(213,25,74,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(231,196,56,0.10) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          <img src="/logo.png" alt="GarantiaHub" className="h-32 w-auto" />
        </div>

        <div className="relative z-10 max-w-sm">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[var(--text-primary)] mb-5">
            Gestão de garantias{' '}
            <span className="text-[var(--accent)]">simplificada</span>
          </h1>
          <p className="text-base text-[var(--text-secondary)] leading-relaxed">
            Plataforma centralizada para registro, análise e controle de garantias com inteligência operacional.
          </p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="w-full max-w-md mx-auto flex flex-col justify-center px-8 lg:px-12 lg:border-l border-[var(--border-subtle)]">
        <div className="animate-slide-up">
          {/* Logo mobile */}
          <div className="mb-8 lg:hidden">
            <img src="/logo.png" alt="GarantiaHub" className="h-28 w-auto" />
          </div>

          <div className="mb-9">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1.5">
              Entrar na plataforma
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Acesse com suas credenciais corporativas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Email corporativo
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
                  placeholder="seu.email@empresa.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] rounded-xl pl-10 pr-11 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--accent)] text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-all duration-150 hover:bg-[var(--accent-hover)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              {isLoading ? 'Verificando...' : 'Acessar plataforma'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
