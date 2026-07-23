# 🚀 Plataforma de Garantias

Sistema de inteligência e metrificação de garantias para produtos de LED e automotivos.

## 📋 Pré-requisitos

- **Node.js** v16+ (para o backend)
- **PostgreSQL** v12+ (banco de dados)
- **npm** ou **yarn**

## 🛠️ Setup do Projeto

### 1. Clonar/Configurar o Projeto
```bash
cd /Users/luizotaviomendonca/Garantia
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
```

Editar `.env` com suas credenciais:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=garantias_db
DB_USER=postgres
DB_PASSWORD=sua_senha

# Server
PORT=3001
NODE_ENV=development
JWT_SECRET=uma_chave_super_segura_aqui

# Google Drive (depois configuraremos)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
GOOGLE_DRIVE_FOLDER_ID=...

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 4. Criar Banco de Dados e Aplicar Schema

#### 4.1 Criar banco de dados PostgreSQL
```bash
# Conectar ao PostgreSQL
psql -U postgres

# Dentro do psql:
CREATE DATABASE garantias_db;
\q
```

#### 4.2 Executar schema SQL
```bash
# Aplicar todas as tabelas, índices, triggers e views
psql -U postgres -d garantias_db -f schema.sql
```

#### 4.3 Verificar se foi criado corretamente
```bash
psql -U postgres -d garantias_db

# Dentro do psql:
\dt  # Lista tabelas
\dv  # Lista views
\q
```

### 5. Iniciar o Servidor

**Modo desenvolvimento (com auto-reload):**
```bash
npm run dev
```

**Modo produção:**
```bash
npm start
```

Servidor estará rodando em: `http://localhost:3001`

### 6. Verificar Saúde da API

```bash
curl http://localhost:3001/health
# Response: {"status":"OK","timestamp":"2024-01-20T14:00:00.000Z"}

# Testar conexão com banco
curl http://localhost:3001/api/test-db
```

---

## 🔑 Primeiro Login

### 1. Dados de Usuários Pré-carregados

O schema.sql já insere alguns usuários de exemplo. Para fazer login:

```bash
curl -X POST http://localhost:3001/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao.silva@garantia.com",
    "senha": "123456"
  }'
```

**Response:**
```json
{
  "mensagem": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": "...",
    "nome": "João Silva",
    "email": "joao.silva@garantia.com",
    "tipo_usuario": "vendedor"
  }
}
```

### 2. Usar o Token nas Requisições

Copie o token e use no header `Authorization`:

```bash
curl -X GET http://localhost:3001/api/usuarios/perfil \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## 📊 Estrutura do Projeto

```
garantia/
├── src/
│   ├── config/
│   │   └── database.js          # Conexão PostgreSQL
│   ├── controllers/
│   │   ├── usuarioController.js
│   │   ├── garantiaController.js
│   │   └── metricasController.js
│   ├── routes/
│   │   ├── usuarios.js
│   │   ├── garantias.js
│   │   └── metricas.js
│   ├── middleware/
│   │   └── auth.js              # JWT auth
│   ├── services/
│   │   └── googleDriveService.js # Google Drive API
│   └── server.js                # Servidor Express
├── schema.sql                    # Schema do banco
├── package.json
├── .env                          # Variáveis de ambiente
└── README.md
```

---

## 📚 Documentação da API

Ver [API_DOCS.md](./API_DOCS.md) para documentação completa dos endpoints.

**Resumo rápido:**

```
POST   /api/usuarios/login              # Login
GET    /api/usuarios/perfil             # Perfil do usuário

POST   /api/garantias                   # Criar garantia
GET    /api/garantias                   # Listar (direção/logística)
GET    /api/garantias/meus              # Listar minhas (vendedor)
GET    /api/garantias/{id}              # Obter uma
PATCH  /api/garantias/{id}/status       # Atualizar status
DELETE /api/garantias/{id}              # Deletar

GET    /api/metricas/geral              # KPIs gerais
GET    /api/metricas/vendedores         # Ranking vendedores
GET    /api/metricas/clientes-repetidores  # Alertas clientes
GET    /api/metricas/produtos-defeitos  # Produtos com problemas
GET    /api/metricas/alertas            # Alertas não resolvidos
```

---

## 🔐 Tipos de Usuários e Permissões

| Tipo | Login | Criar Garantia | Ver Próprias | Ver Todas | Alterar Status | Ver Métricas |
|------|-------|----------------|-------------|-----------|----------------|-------------|
| **vendedor** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **logistica** | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **direcao** | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## 🐛 Troubleshooting

### Erro: "cannot connect to database"
- Verificar se PostgreSQL está rodando
- Verificar credenciais no `.env`
- Verificar se o banco `garantias_db` existe

### Erro: "Token inválido"
- Gerar novo token com login
- Verificar se token não expirou (válido por 24h)
- Verificar se JWT_SECRET está correto no `.env`

### Erro: "Acesso negado"
- Verificar tipo de usuário (vendedor/logistica/direcao)
- Verificar se o endpoint permite seu tipo de usuário

---

## 🚀 Próximos Passos

1. **Frontend React** - Interface para vendedores, logística e direção
2. **Integração Google Drive** - Upload automático de vídeos e fotos
3. **Sistema de Alertas** - Notificações em tempo real
4. **Testes Automatizados** - Jest + Supertest
5. **Deploy** - Produção (AWS, Heroku, etc)

---

## 📞 Suporte

Para dúvidas ou bugs, abra uma issue ou entre em contato com o time.
