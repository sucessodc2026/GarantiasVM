import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class UploadService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
    });

    // Interceptor para adicionar token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async uploadArquivo(file: File): Promise<{ tipo: string; url: string; nome_arquivo: string }> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    // Se o Cloudinary estiver configurado, faz upload direto do frontend
    if (cloudName && uploadPreset) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        return {
          tipo: file.type.startsWith('image/') ? 'foto' : 'video',
          url: response.data.secure_url,
          nome_arquivo: response.data.public_id || file.name,
        };
      } catch (error: any) {
        console.error('Erro ao fazer upload no Cloudinary:', error.response?.data || error);
        throw error;
      }
    }

    // Fallback: faz upload local no backend do app
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        tipo: response.data.tipo,
        url: response.data.url,
        nome_arquivo: response.data.nome_arquivo,
      };
    } catch (error) {
      console.error('Erro ao fazer upload local:', error);
      throw error;
    }
  }

  async uploadMultiplos(
    files: File[]
  ): Promise<{ tipo: string; url: string; nome_arquivo: string }[]> {
    const uploads = files.map((file) => this.uploadArquivo(file));
    return Promise.all(uploads);
  }

  async deletarArquivo(filename: string): Promise<void> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    // Se o Cloudinary estiver ativo, a deleção direta do client em presets unsigned não é recomendada por segurança,
    // então apenas ignoramos ou tratamos de forma simples.
    if (cloudName) {
      console.log('Arquivo hospedado no Cloudinary. Deleção pelo frontend ignorada para segurança.');
      return;
    }

    try {
      await this.api.delete(`/upload/${filename}`);
    } catch (error) {
      console.error('Erro ao deletar arquivo local:', error);
      throw error;
    }
  }
}

export const uploadService = new UploadService();
