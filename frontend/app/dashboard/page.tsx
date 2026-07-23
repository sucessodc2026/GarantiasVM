'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (usuario) {
      // Redirecionar para a página correta baseado no tipo de usuário
      if (usuario.tipo_usuario === 'vendedor') {
        router.push('/dashboard/vendedor');
      } else if (usuario.tipo_usuario === 'logistica') {
        router.push('/dashboard/logistica');
      } else if (usuario.tipo_usuario === 'direcao') {
        router.push('/dashboard/direcao');
      }
    }
  }, [usuario, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
