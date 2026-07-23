const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { google } = require('googleapis');

// Google Drive Setup
const credentialsPath = path.join(__dirname, '../../config/credentials/google-drive.json');
const credentials = JSON.parse(require('fs').readFileSync(credentialsPath, 'utf8'));
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

const auth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

// Configurar multer para armazenar na memória
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Aceitar apenas imagens e vídeos
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
});

class UploadController {
  static async uploadArquivo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
      }

      const file = req.file;
      const tipo = file.mimetype.startsWith('image/') ? 'foto' : 'video';
      let driveUrl = null;

      // Fazer upload para Google Drive
      if (FOLDER_ID) {
        try {
          const { Readable } = require('stream');
          const bufferStream = Readable.from([file.buffer]);

          const fileMetadata = {
            name: `${Date.now()}_${file.originalname}`,
            parents: [FOLDER_ID],
            description: `Garantia - ${tipo} - ${new Date().toISOString()}`,
          };

          const response = await drive.files.create({
            requestBody: fileMetadata,
            media: {
              mimeType: file.mimetype,
              body: bufferStream,
            },
            supportsAllDrives: true,
            fields: 'id, webViewLink, webContentLink',
          });

          driveUrl = response.data.webViewLink;
          console.log('✅ Arquivo enviado para Google Drive:', driveUrl);

          // Compartilhar arquivo para leitura pública
          try {
            await drive.permissions.create({
              fileId: response.data.id,
              resource: {
                role: 'reader',
                type: 'anyone',
              },
              supportsAllDrives: true,
            });
          } catch (e) {
            console.warn('⚠️ Aviso ao compartilhar arquivo:', e.message);
          }
        } catch (driveError) {
          console.error('❌ Erro ao fazer upload para Google Drive:', driveError.message);
          throw driveError;
        }
      }

      res.json({
        mensagem: 'Arquivo enviado com sucesso',
        tipo,
        nome_arquivo: file.originalname,
        url: driveUrl,
        drive_url: driveUrl,
        tamanho: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
      });
    } catch (erro) {
      console.error('Erro ao fazer upload:', erro);
      res.status(500).json({ erro: 'Erro ao fazer upload do arquivo: ' + erro.message });
    }
  }

  static async obterArquivo(req, res) {
    try {
      const { filename } = req.params;

      // Validar filename para prevenir path traversal
      if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ erro: 'Filename inválido' });
      }

      const filepath = path.join(__dirname, '../../uploads', filename);

      // Verificar se arquivo existe
      await fs.access(filepath);

      // Servir arquivo
      res.sendFile(filepath);
    } catch (erro) {
      console.error('Erro ao obter arquivo:', erro);
      res.status(404).json({ erro: 'Arquivo não encontrado' });
    }
  }

  static async deletarArquivo(req, res) {
    try {
      const { filename } = req.params;

      if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ erro: 'Filename inválido' });
      }

      const filepath = path.join(__dirname, '../../uploads', filename);

      await fs.unlink(filepath);

      res.json({ mensagem: 'Arquivo deletado com sucesso' });
    } catch (erro) {
      console.error('Erro ao deletar arquivo:', erro);
      res.status(500).json({ erro: 'Erro ao deletar arquivo' });
    }
  }
}

module.exports = { UploadController, upload };
