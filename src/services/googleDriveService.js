const { google } = require('googleapis');
const { Readable } = require('stream');

class GoogleDriveService {
  constructor(auth) {
    this.drive = google.drive({ version: 'v3', auth });
  }

  async uploadArquivo(nomeArquivo, mimeType, conteudo, idPasta) {
    try {
      const fileMetadata = {
        name: nomeArquivo,
        parents: [idPasta],
      };

      const media = {
        mimeType: mimeType,
        body: Readable.from([conteudo]),
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      return {
        id: response.data.id,
        link: response.data.webViewLink,
      };
    } catch (erro) {
      console.error('Erro ao fazer upload no Google Drive:', erro);
      throw erro;
    }
  }

  async criarPasta(nomePasta, idPastaPai) {
    try {
      const fileMetadata = {
        name: nomePasta,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [idPastaPai],
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id',
      });

      return response.data.id;
    } catch (erro) {
      console.error('Erro ao criar pasta no Google Drive:', erro);
      throw erro;
    }
  }

  async compartilharArquivo(idArquivo) {
    try {
      await this.drive.permissions.create({
        fileId: idArquivo,
        resource: {
          role: 'reader',
          type: 'anyone',
        },
      });

      const arquivo = await this.drive.files.get({
        fileId: idArquivo,
        fields: 'webViewLink',
      });

      return arquivo.data.webViewLink;
    } catch (erro) {
      console.error('Erro ao compartilhar arquivo:', erro);
      throw erro;
    }
  }
}

module.exports = GoogleDriveService;
