# Plataforma de Garantias - Documentação da API

## 🔐 Autenticação

Todos os endpoints (exceto `/api/usuarios/login`) requerem um **Bearer Token** no header:

```bash
Authorization: Bearer {seu_token_jwt}
```

## 📋 Endpoints

---

## **USUÁRIOS**

### 1. Login
```
POST /api/usuarios/login
```

**Request:**
```json
{
  "email": "joao.silva@garantia.com",
  "senha": "sua_senha"
}
```

**Response (201):**
```json
{
  "mensagem": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "nome": "João Silva",
    "email": "joao.silva@garantia.com",
    "tipo_usuario": "vendedor"
  }
}
```

### 2. Listar Usuários (Direção apenas)
```
GET /api/usuarios?tipo_usuario=vendedor
```

**Query Params:**
- `tipo_usuario` (opcional): `vendedor`, `logistica`, `direcao`

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "nome": "João Silva",
    "email": "joao.silva@garantia.com",
    "tipo_usuario": "vendedor",
    "ativo": true,
    "criado_em": "2024-01-15T10:30:00Z"
  }
]
```

### 3. Perfil do Usuário Logado
```
GET /api/usuarios/perfil
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "nome": "João Silva",
  "email": "joao.silva@garantia.com",
  "telefone": "11999999999",
  "tipo_usuario": "vendedor",
  "ativo": true,
  "criado_em": "2024-01-15T10:30:00Z"
}
```

---

## **GARANTIAS**

### 1. Criar Garantia (Vendedor)
```
POST /api/garantias
```

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "cliente_id": "123e4567-e89b-12d3-a456-426614174001",
  "produto_id": "123e4567-e89b-12d3-a456-426614174002",
  "descricao_falha": "LED não acende",
  "foto_url": "https://drive.google.com/...",
  "video_url": "https://drive.google.com/..."
}
```

**Response (201):**
```json
{
  "mensagem": "Solicitação de garantia criada com sucesso",
  "garantia": {
    "id": "123e4567-e89b-12d3-a456-426614174003",
    "cliente_id": "123e4567-e89b-12d3-a456-426614174001",
    "vendedor_id": "123e4567-e89b-12d3-a456-426614174000",
    "produto_id": "123e4567-e89b-12d3-a456-426614174002",
    "descricao_falha": "LED não acende",
    "foto_url": "https://drive.google.com/...",
    "video_url": "https://drive.google.com/...",
    "status": "pendente",
    "criado_em": "2024-01-20T14:00:00Z",
    "atualizado_em": "2024-01-20T14:00:00Z"
  }
}
```

### 2. Listar Garantias do Vendedor
```
GET /api/garantias/meus?status=pendente&limite=50&offset=0
```

**Query Params:**
- `status` (opcional): `pendente`, `processado`, `rejeitado`, `concluido`
- `limite` (opcional, default: 50)
- `offset` (opcional, default: 0)

**Response:**
```json
{
  "total": 5,
  "garantias": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "cliente_id": "123e4567-e89b-12d3-a456-426614174001",
      "cliente_nome": "Carlos",
      "cliente_telefone": "11988888888",
      "produto_id": "123e4567-e89b-12d3-a456-426614174002",
      "produto_nome": "LED RGB 10W",
      "produto_categoria": "led",
      "descricao_falha": "LED não acende",
      "status": "pendente",
      "criado_em": "2024-01-20T14:00:00Z"
    }
  ]
}
```

### 3. Listar Todas as Garantias (Logística/Direção)
```
GET /api/garantias?status=pendente&limite=100&offset=0
```

**Query Params:**
- `status` (opcional)
- `limite` (opcional, default: 100)
- `offset` (opcional, default: 0)

**Response:** Mesma estrutura acima, mas com vendedor_nome incluido

### 4. Obter Uma Garantia
```
GET /api/garantias/{id}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "cliente_id": "123e4567-e89b-12d3-a456-426614174001",
  "cliente_nome": "Carlos",
  "cliente_telefone": "11988888888",
  "vendedor_id": "123e4567-e89b-12d3-a456-426614174000",
  "vendedor_nome": "João Silva",
  "produto_id": "123e4567-e89b-12d3-a456-426614174002",
  "produto_nome": "LED RGB 10W",
  "descricao_falha": "LED não acende",
  "foto_url": "https://drive.google.com/...",
  "video_url": "https://drive.google.com/...",
  "status": "pendente",
  "observacoes": null,
  "criado_em": "2024-01-20T14:00:00Z",
  "atualizado_em": "2024-01-20T14:00:00Z"
}
```

### 5. Atualizar Status da Garantia (Logística/Direção)
```
PATCH /api/garantias/{id}/status
```

**Request Body:**
```json
{
  "status": "processado",
  "observacoes": "Novo produto enviado"
}
```

**Response:**
```json
{
  "mensagem": "Status atualizado com sucesso",
  "garantia": {
    "id": "123e4567-e89b-12d3-a456-426614174003",
    "status": "processado",
    "atualizado_em": "2024-01-20T15:30:00Z"
  }
}
```

### 6. Deletar Garantia (Direção apenas)
```
DELETE /api/garantias/{id}
```

**Response (200):**
```json
{
  "mensagem": "Garantia deletada com sucesso"
}
```

---

## **MÉTRICAS E DASHBOARDS**

### 1. Métricas Gerais (Direção)
```
GET /api/metricas/geral
```

**Response:**
```json
{
  "total_garantias": 45,
  "processadas": 35,
  "pendentes": 8,
  "rejeitadas": 2,
  "taxa_aprovacao": "77.78"
}
```

### 2. Garantias por Vendedor (últimos 30 dias)
```
GET /api/metricas/vendedores
```

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "nome": "João Silva",
    "total": 12,
    "processadas": 10,
    "pendentes": 2,
    "taxa_aprovacao": "83.33"
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174100",
    "nome": "Maria Santos",
    "total": 8,
    "processadas": 6,
    "pendentes": 2,
    "taxa_aprovacao": "75.00"
  }
]
```

### 3. Clientes Repetidores (últimos 30 dias)
```
GET /api/metricas/clientes-repetidores
```

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174050",
    "nome": "Carlos da Silva",
    "telefone": "11988888888",
    "total_solicitacoes": 5,
    "produtos_diferentes": 2
  }
]
```

### 4. Produtos com Defeitos
```
GET /api/metricas/produtos-defeitos
```

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "nome": "LED RGB 10W",
    "categoria": "led",
    "total_defeitos": 8,
    "clientes_afetados": 6
  }
]
```

### 5. Histórico de Garantias do Cliente
```
GET /api/metricas/cliente/{cliente_id}
```

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174003",
    "cliente_id": "123e4567-e89b-12d3-a456-426614174001",
    "produto_id": "123e4567-e89b-12d3-a456-426614174002",
    "produto_nome": "LED RGB 10W",
    "produto_categoria": "led",
    "vendedor_name": "João Silva",
    "descricao_falha": "LED não acende",
    "status": "processado",
    "criado_em": "2024-01-20T14:00:00Z"
  }
]
```

### 6. Alertas Não Resolvidos (Direção)
```
GET /api/metricas/alertas
```

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174200",
    "tipo": "cliente_repetidor",
    "cliente_id": "123e4567-e89b-12d3-a456-426614174001",
    "vendedor_id": null,
    "produto_id": null,
    "alerta_para": "Carlos da Silva",
    "descricao": "Cliente com 5 solicitações em 30 dias",
    "valor_metrica": "5.00",
    "limite_alerta": "3.00",
    "resolvido": false,
    "criado_em": "2024-01-20T14:00:00Z"
  }
]
```

### 7. Resolver Alerta (Direção)
```
PATCH /api/metricas/alertas/{id}/resolver
```

**Response:**
```json
{
  "mensagem": "Alerta marcado como resolvido",
  "alerta": {
    "id": "123e4567-e89b-12d3-a456-426614174200",
    "resolvido": true,
    "resolvido_em": "2024-01-20T16:00:00Z"
  }
}
```

---

## ✅ Códigos de Status

- `200 OK` - Sucesso
- `201 Created` - Recurso criado
- `400 Bad Request` - Erro na validação
- `401 Unauthorized` - Token inválido ou expirado
- `403 Forbidden` - Acesso negado (tipo de usuário não autorizado)
- `404 Not Found` - Recurso não encontrado
- `500 Internal Server Error` - Erro do servidor

---

## 📝 Notas

1. **Paginação:** Use `limite` e `offset` para paginar resultados
2. **Período de dados:** Métricas geralmente consideram últimos 30 dias
3. **Timestamps:** Formato ISO 8601 (UTC)
4. **Token expira em:** 24 horas
