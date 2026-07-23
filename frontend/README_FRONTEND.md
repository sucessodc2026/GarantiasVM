# 🚀 Plataforma de Garantias - Frontend

Interface web moderna construída com Next.js 14, React e Tailwind CSS.

## 📋 Estrutura do Projeto

```
frontend/
├── app/
│   ├── layout.tsx              # Layout raiz com AuthProvider
│   ├── page.tsx                # Página inicial (redireciona)
│   ├── login/page.tsx          # Página de login
│   └── dashboard/
│       ├── page.tsx            # Redirecionador por tipo de usuário
│       ├── vendedor/page.tsx    # Dashboard vendedor
│       ├── logistica/page.tsx   # Dashboard logística
│       └── direcao/page.tsx     # Dashboard direção
├── src/
│   ├── components/             # Componentes reutilizáveis
│   ├── contexts/               # React Contexts (Auth)
│   ├── services/               # Cliente HTTP (apiService)
│   ├── types/                  # Tipos TypeScript
│   └── utils/                  # Funções auxiliares
└── public/                     # Arquivos estáticos
```

## 🔧 Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

Acesse: `http://localhost:3000`

## 🔑 Contas de Demo

```
👨‍💼 Vendedor:  joao.silva@garantia.com
📦 Logística: pedro.oliveira@garantia.com
📊 Direção:   ana.costa@garantia.com

🔐 Senha: 123456
```

## 📱 Páginas Principais

### **Login** (`/login`)
- Autenticação JWT
- Persistência de sessão no localStorage
- Contas de demo pré-preenchidas

### **Dashboard Vendedor** (`/dashboard/vendedor`)
- 📝 Formulário para registrar garantias
- 📋 Lista de minhas solicitações
- 🔗 Links para fotos/vídeos no Google Drive

### **Dashboard Logística** (`/dashboard/logistica`)
- ⏳ Fila de processamento
- ✓ Marcar como processado
- 📝 Adicionar observações

### **Dashboard Direção** (`/dashboard/direcao`)
- 📊 KPIs em tempo real
- 🚨 Alertas de anomalias
- 👥 Top vendedores
- ⚠️ Clientes em risco

## 🛠️ Tecnologias

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Axios
- React Hot Toast

## 🌍 Variáveis de Ambiente

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

**Status:** ✅ Pronto para uso
