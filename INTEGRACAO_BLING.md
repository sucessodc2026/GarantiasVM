# 🔗 Integração com Bling ERP

Guia completo para integrar a Plataforma de Garantias com seu ERP Bling.

## 📋 Pré-requisitos

1. **Conta Bling** - Ativa e com acesso ao seu painel
2. **Chave API do Bling** - Gere em: `Painel Bling → Usuários → [seu usuário] → API`
3. **Acesso como Diretor** - Apenas usuários de direção podem configurar a integração

---

## 🚀 Passo 1: Configurar a Chave de API

### No Bling:
1. Acesse `https://www.bling.com.br/`
2. Vá para **Painel → Usuários**
3. Clique em seu usuário
4. Procure por **"Chave de API"** ou **"API Key"**
5. Copie a chave (algo como: `a1b2c3d4e5f6g7h8i9j0...`)

### Na Plataforma:
1. Faça login como **Diretor**: `ana.costa@garantia.com`
2. Vá para **Dashboard → Configurações Bling** (futuramente)
3. Cole a chave de API
4. Clique em **"Conectar Bling"**

---

## 📡 Endpoints da API

### **Configurar Chave**
```bash
POST /api/bling/config
Authorization: Bearer {token_diretor}

Body: {
  "apiKey": "sua_chave_aqui"
}

Response: {
  "mensagem": "API Key configurada com sucesso",
  "clientes_encontrados": 42
}
```

### **Verificar Status**
```bash
GET /api/bling/status
Authorization: Bearer {token}

Response: {
  "bling": "Configurado",
  "database": "Conectado",
  "mensagem": "Integração com Bling ativa"
}
```

### **Listar Clientes**
```bash
GET /api/bling/clientes?termo=João
Authorization: Bearer {token}

Response: {
  "total": 3,
  "clientes": [
    {
      "id": "12345",
      "nome": "João Silva",
      "email": "joao@email.com",
      "telefone": "11999999999"
    }
  ]
}
```

### **Listar Produtos**
```bash
GET /api/bling/produtos?termo=LED
Authorization: Bearer {token}

Response: {
  "total": 5,
  "produtos": [
    {
      "id": "67890",
      "nome": "LED RGB 10W",
      "sku": "LED-RGB-10W",
      "categoria": "Iluminação",
      "preco": 45.90
    }
  ]
}
```

### **Sincronizar Banco Local**
```bash
POST /api/bling/sincronizar
Authorization: Bearer {token_diretor}

Response: {
  "mensagem": "Sincronização concluída",
  "clientes_sincronizados": 42,
  "produtos_sincronizados": 127,
  "total": 169
}
```

---

## 🎨 Usando no Formulário de Vendedor

### Antes (Sem Bling):
```jsx
<input
  type="text"
  placeholder="Cole o ID do cliente"
  value={cliente_id}
/>
```

### Depois (Com Bling - Autocomplete):
```jsx
<AutocompleteSearch
  label="Cliente"
  placeholder="Digite o nome do cliente..."
  onSelect={(cliente) => setFormData({...formData, cliente_id: cliente.id})}
  searchFn={(termo) => blingService.listarClientes(termo)}
  helpText="Busca em tempo real do seu ERP"
/>
```

---

## 💾 Sincronização Automática

O sistema pode sincronizar dados do Bling periodicamente:

```javascript
// Sincronizar a cada 6 horas (exemplo)
setInterval(async () => {
  const result = await blingService.sincronizar();
  console.log(`✓ ${result.total} registros sincronizados`);
}, 6 * 60 * 60 * 1000);
```

---

## 🔒 Segurança

- ✅ Chave de API armazenada apenas na memória do servidor
- ✅ Apenas diretores podem configurar
- ✅ Token JWT obrigatório em todas as requisições
- ✅ Sync não sobrescreve dados locais modificados

---

## 🚨 Troubleshooting

### Erro: "API Key inválida"
- Verifique se a chave está correta no Bling
- Confirme que seu usuário tem permissão de API

### Erro: "Bling não está configurado"
- Configure a chave de API primeiro (POST /api/bling/config)
- Apenas diretores podem fazer isso

### Clientes/Produtos não aparecem
- Confirme que existem clientes/produtos no seu Bling
- Tente sincronizar manualmente: POST /api/bling/sincronizar

---

## 📊 Diagrama de Fluxo

```
Vendedor abre formulário
       ↓
Digita nome do cliente
       ↓
Busca em tempo real no Bling
       ↓
API retorna sugestões
       ↓
Vendedor clica em um cliente
       ↓
Cliente ID é preenchido automaticamente
       ↓
Mesmo para produtos
       ↓
Submeter formulário (com IDs do Bling)
```

---

## 🎯 Benefícios

✅ **Sem erros de digitação** - Busca por nome, não por ID  
✅ **Dados sempre atualizados** - Integrado com seu ERP  
✅ **Menos cliques** - Autocomplete no formulário  
✅ **Rastreabilidade** - Relaciona garantias com pedidos Bling  
✅ **Sincronização** - Mantém banco local sincronizado  

---

## 📞 Próximos Passos

1. **Configurar página de settings** - Fazer upload da chave na UI
2. **Adicionar sync automático** - A cada X horas
3. **Integrar com pedidos** - Buscar histórico de pedidos
4. **Adicionar filtros avançados** - Por categoria, preço, etc
5. **Gerar relatórios integrados** - Com dados do Bling

---

**Status**: ✅ API pronta para integração  
**Última atualização**: 2026-07-20
