require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/database');

// Importar rotas
const usuariosRoutes = require('./routes/usuarios');
const garantiasRoutes = require('./routes/garantias');
const metricasRoutes = require('./routes/metricas');
const uploadRoutes = require('./routes/upload');
const blingRoutes = require('./routes/bling');
const configRoutes = require('./routes/configuracoes');
const produtosRoutes = require('./routes/produtos');
const importRoutes = require('./routes/import');
const clientesRoutes = require('./routes/clientes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Teste de conexão com banco
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'Conexão OK', timestamp: result.rows[0].now });
  } catch (erro) {
    console.error('Erro ao conectar ao banco:', erro);
    res.status(500).json({ erro: 'Erro ao conectar ao banco de dados' });
  }
});

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// Middleware de debug para upload
app.use('/api/upload', (req, res, next) => {
  console.log(`📤 /api/upload ${req.method} - Processando...`);
  next();
});

// Rotas
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/garantias', garantiasRoutes);
app.use('/api/metricas', metricasRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/bling', blingRoutes);
app.use('/api/configuracoes', configRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/import', importRoutes);
app.use('/api/clientes', clientesRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

// Iniciar servidor apenas fora da Vercel (localmente)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
