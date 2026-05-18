/**
 * Service pour les appels API des campagnes
 * Inclut gestion des erreurs utilisateur-friendly
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface CampaignResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

/**
 * Récupérer le nombre de contacts actifs dans un segment
 */
export async function getSegmentContactCount(segmentId: string): Promise<number> {
  try {
    const response = await fetch(`${API_URL}/contacts/segments/${segmentId}/count`, {
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Failed to fetch contact count:', response.status);
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('Error fetching contact count:', error);
    return 0;
  }
}

/**
 * Sauvegarder la campagne comme brouillon
 */
export async function saveCampaignDraft(
  campaignId: string,
  draftData: Record<string, unknown>,
): Promise<CampaignResponse> {
  try {
    const response = await fetch(`${API_URL}/campaigns/${campaignId}/save-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(draftData),
    });

    if (!response.ok) {
      console.error('Save draft failed:', response.status);
      return {
        success: false,
        error: 'Une erreur s\'est produite. Veuillez réessayer.',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
      message: 'Brouillon sauvegardé',
    };
  } catch (error) {
    console.error('Error saving draft:', error);
    return {
      success: false,
      error: 'Une erreur s\'est produite. Veuillez réessayer.',
    };
  }
}

/**
 * Envoyer ou programmer la campagne
 */
export async function sendCampaign(
  campaignId: string,
  options?: {
    immediateOrScheduled?: 'immediate' | 'scheduled';
    scheduledAt?: string;
  },
): Promise<CampaignResponse> {
  try {
    const response = await fetch(`${API_URL}/campaigns/${campaignId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(options || {}),
    });

    if (!response.ok) {
      console.error('Send campaign failed:', response.status);
      return {
        success: false,
        error: 'Une erreur s\'est produite. Veuillez réessayer.',
      };
    }

    const data = await response.json();
    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Une erreur s\'est produite. Veuillez réessayer.',
      };
    }

    return {
      success: true,
      data: data,
      message: data.message || 'Campagne envoyée',
    };
  } catch (error) {
    console.error('Error sending campaign:', error);
    return {
      success: false,
      error: 'Une erreur s\'est produite. Veuillez réessayer.',
    };
  }
}

/**
 * Annuler la campagne
 */
export async function cancelCampaign(campaignId: string): Promise<CampaignResponse> {
  try {
    const response = await fetch(`${API_URL}/campaigns/${campaignId}/cancel`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Cancel campaign failed:', response.status);
      return {
        success: false,
        error: 'Une erreur s\'est produite. Veuillez réessayer.',
      };
    }

    const data = await response.json();
    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Une erreur s\'est produite. Veuillez réessayer.',
      };
    }

    return {
      success: true,
      data: data,
      message: 'Campagne annulée',
    };
  } catch (error) {
    console.error('Error cancelling campaign:', error);
    return {
      success: false,
      error: 'Une erreur s\'est produite. Veuillez réessayer.',
    };
  }
}

/**
 * Récupérer les détails de la campagne
 */
export async function getCampaignDetails(campaignId: string): Promise<CampaignResponse> {
  try {
    const response = await fetch(`${API_URL}/campaigns/${campaignId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Fetch campaign failed:', response.status);
      return {
        success: false,
        error: 'Campagne non trouvée',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return {
      success: false,
      error: 'Une erreur s\'est produite. Veuillez réessayer.',
    };
  }
}
