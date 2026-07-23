const express = require('express');
const router = express.Router();
const { UploadController, upload } = require('../controllers/uploadController');
const { verificarToken } = require('../middleware/auth');

// Upload de arquivo (qualquer usuário autenticado)
router.post('/', verificarToken, upload.single('file'), UploadController.uploadArquivo);

// Obter arquivo
router.get('/:filename', UploadController.obterArquivo);

// Deletar arquivo
router.delete('/:filename', verificarToken, UploadController.deletarArquivo);

module.exports = router;
