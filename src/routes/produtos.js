const express = require('express');
const router = express.Router();
const ProdutoController = require('../controllers/produtoController');
const { verificarToken, verificarTipo } = require('../middleware/auth');

// Listar produtos (direção e vendedor)
router.get('/', verificarToken, verificarTipo(['direcao', 'vendedor']), ProdutoController.listar);

// Cadastrar produto/variação nova (direção)
router.post('/', verificarToken, verificarTipo(['direcao']), ProdutoController.criar);

// Atualizar foto do produto (direção)
router.patch('/familia/foto', verificarToken, verificarTipo(['direcao']), ProdutoController.atualizarFotoFamilia);

router.patch('/:id/foto', verificarToken, verificarTipo(['direcao']), ProdutoController.atualizarFoto);

// Remover foto do produto (direção)
router.delete('/:id/foto', verificarToken, verificarTipo(['direcao']), ProdutoController.removerFoto);

module.exports = router;
