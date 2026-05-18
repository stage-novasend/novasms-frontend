/**
 * Image Upload Service
 * Uploader les images au serveur et récupérer les URLs
 */

interface UploadedImage {
  id: string;
  url: string; // URL serveur
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

class ImageUploadService {
  private uploadedImages: Map<string, UploadedImage> = new Map();

  /**
   * Upload une image au serveur
   */
  async uploadImage(file: File, campaignId: string): Promise<UploadedImage> {
    const validation = this.validateImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `/api/campaigns/${campaignId}/images/upload`,
      {
        method: 'POST',
        body: formData,
        credentials: 'include', // For JWT cookies
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message ||
          'Erreur lors de l\'upload de l\'image',
      );
    }

    const data = await response.json();
    const uploadedImage: UploadedImage = {
      id: data.id,
      url: data.url,
      name: data.fileName,
      size: data.size,
      type: data.type,
      uploadedAt: new Date(data.uploadedAt),
    };

    this.uploadedImages.set(data.id, uploadedImage);
    return uploadedImage;
  }

  /**
   * Obtenir une image uploadée
   */
  getImage(id: string): UploadedImage | undefined {
    return this.uploadedImages.get(id);
  }

  /**
   * Lister toutes les images
   */
  getAllImages(): UploadedImage[] {
    return Array.from(this.uploadedImages.values());
  }

  /**
   * Supprimer une image
   */
  deleteImage(id: string): boolean {
    return this.uploadedImages.delete(id);
  }

  /**
   * Obtenir une miniature URL
   */
  getThumbnail(imageUrl: string): string {
    // Image URL est fournie par le serveur
    return imageUrl;
  }

  /**
   * Valider la taille et type d'image
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (file.size > MAX_SIZE) {
      return { valid: false, error: `Image trop grande (max ${MAX_SIZE / 1024 / 1024}MB)` };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Type d\'image non supporté (JPEG, PNG, GIF, WebP)' };
    }

    return { valid: true };
  }
}

export const imageUploadService = new ImageUploadService();
export type { UploadedImage };
