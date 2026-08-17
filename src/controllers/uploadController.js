const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const crypto = require('crypto');

// Pasta exclusiva desta aplicação. Fica fora do diretório do código para
// sobreviver a redeploys e para não misturar com outras apps da VPS.
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/garantias-vm/uploads';

// URL pública servida pelo Nginx (location /uploads).
const PUBLIC_PATH = '/uploads';

const MIMES_PERMITIDOS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
};

// Guarda por tipo e por mês: evita dezenas de milhares de arquivos numa pasta só.
function pastaDestino(mimetype) {
  const tipo = mimetype.startsWith('image/') ? 'fotos' : 'videos';
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  return { tipo, relativa: path.join(tipo, String(ano), mes) };
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { relativa } = pastaDestino(file.mimetype);
    const destino = path.join(UPLOAD_DIR, relativa);
    fs.mkdir(destino, { recursive: true }, (err) => cb(err, destino));
  },
  filename: (req, file, cb) => {
    // Nome do usuário nunca vira nome de arquivo: só a extensão do MIME validado.
    const ext = MIMES_PERMITIDOS[file.mimetype] || '';
    cb(null, `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (MIMES_PERMITIDOS[file.mimetype]) return cb(null, true);
  cb(new Error('Tipo de arquivo não suportado'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

// Impede que o filename da URL escape da pasta de uploads.
function caminhoSeguro(filename) {
  const limpo = path.normalize(filename).replace(/^(\.\.[/\\])+/, '');
  const completo = path.resolve(UPLOAD_DIR, limpo);
  if (!completo.startsWith(path.resolve(UPLOAD_DIR))) return null;
  return completo;
}

class UploadController {
  static async uploadArquivo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
      }

      const file = req.file;
      const { tipo, relativa } = pastaDestino(file.mimetype);
      const urlRelativa = path.posix.join(
        PUBLIC_PATH,
        relativa.split(path.sep).join('/'),
        file.filename
      );

      res.json({
        mensagem: 'Arquivo enviado com sucesso',
        tipo: tipo === 'fotos' ? 'foto' : 'video',
        nome_arquivo: file.originalname,
        url: urlRelativa,
        caminho: urlRelativa,
        tamanho: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
      });
    } catch (erro) {
      console.error('Erro ao fazer upload:', erro);
      res.status(500).json({ erro: 'Erro ao fazer upload do arquivo: ' + erro.message });
    }
  }

  static async obterArquivo(req, res) {
    try {
      const completo = caminhoSeguro(req.params[0] || req.params.filename);
      if (!completo) return res.status(400).json({ erro: 'Caminho inválido' });
      if (!fs.existsSync(completo)) return res.status(404).json({ erro: 'Arquivo não encontrado' });
      res.sendFile(completo);
    } catch (erro) {
      console.error('Erro ao obter arquivo:', erro);
      res.status(500).json({ erro: 'Erro ao obter arquivo' });
    }
  }

  static async deletarArquivo(req, res) {
    try {
      const completo = caminhoSeguro(req.params[0] || req.params.filename);
      if (!completo) return res.status(400).json({ erro: 'Caminho inválido' });
      if (!fs.existsSync(completo)) return res.status(404).json({ erro: 'Arquivo não encontrado' });
      await fsp.unlink(completo);
      res.json({ mensagem: 'Arquivo removido' });
    } catch (erro) {
      console.error('Erro ao deletar arquivo:', erro);
      res.status(500).json({ erro: 'Erro ao deletar arquivo' });
    }
  }
}

module.exports = { UploadController, upload };
