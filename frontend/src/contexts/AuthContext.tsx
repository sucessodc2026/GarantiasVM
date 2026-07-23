'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Usuario, TipoUsuario } from '@/types';
import { apiService } from '@/services/api';

interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sessão ao carregar página
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
      // Opcionalmente, aqui você poderia buscar o perfil do usuário
      const usuarioData = localStorage.getItem('usuario');
      if (usuarioData) {
        setUsuario(JSON.parse(usuarioData));
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, senha: string) => {
    try {
      const response = await apiService.login(email, senha);
      const { token, usuario: usuarioData } = response;

      // Salvar token e dados do usuário
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuarioData));

      apiService.setToken(token);
      setUsuario(usuarioData);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    apiService.clearToken();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: !!usuario,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
