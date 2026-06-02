/**
 * Service pour les appels API des campagnes
 * Inclut gestion des erreurs utilisateur-friendly
 */

import api from '../api/axios';

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
    console.log('📡 Fetching segment contact count for:', segmentId);
    const response = await api.get<{ segmentId: string; count: number }>(
      `/contacts/segments/${segmentId}/count`,
    );

    console.log('✅ Contact count retrieved:', response.data.count);
    return response.data.count || 0;
  } catch (error) {
    console.error('❌ Error fetching contact count:', error);
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
    console.log('💾 Saving campaign draft:', campaignId);
    const response = await api.post(`/campaigns/${campaignId}/save-draft`, draftData);

    if (!response.data?.success) {
      return {
        success: false,
        error: response.data?.error || 'Erreur lors de la sauvegarde du brouillon',
      };
    }

    console.log('✅ Draft saved successfully');
    return {
      success: true,
      data: response.data.data,
      message: 'Brouillon sauvegardé',
    };
  } catch (error) {
    console.error('❌ Error saving draft:', error);
    return {
      success: false,
      error: "Une erreur s'est produite. Veuillez réessayer.",
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
    console.log('🚀 Sending campaign:', campaignId, options);
    const response = await api.post(`/campaigns/${campaignId}/send`, options || {});

    if (!response.data.success) {
      return {
        success: false,
        error: response.data.error || "Une erreur s'est produite. Veuillez réessayer.",
      };
    }

    console.log('✅ Campaign sent successfully');
    return {
      success: true,
      data: response.data,
      message: response.data.message || 'Campagne envoyée',
    };
  } catch (error) {
    console.error('❌ Error sending campaign:', error);
    return {
      success: false,
      error: "Une erreur s'est produite. Veuillez réessayer.",
    };
  }
}

/**
 * Annuler la campagne
 */
export async function cancelCampaign(campaignId: string): Promise<CampaignResponse> {
  try {
    console.log('⏹️  Cancelling campaign:', campaignId);
    const response = await api.post(`/campaigns/${campaignId}/cancel`, {});

    if (!response.data.success) {
      return {
        success: false,
        error: response.data.error || "Une erreur s'est produite. Veuillez réessayer.",
      };
    }

    console.log('✅ Campaign cancelled successfully');
    return {
      success: true,
      data: response.data,
      message: 'Campagne annulée',
    };
  } catch (error) {
    console.error('❌ Error cancelling campaign:', error);
    return {
      success: false,
      error: "Une erreur s'est produite. Veuillez réessayer.",
    };
  }
}

/**
 * Récupérer les détails de la campagne
 */
export async function getCampaignDetails(campaignId: string): Promise<CampaignResponse> {
  try {
    console.log('📖 Fetching campaign details:', campaignId);
    const response = await api.get(`/campaigns/${campaignId}`);

    console.log('✅ Campaign details retrieved');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('❌ Error fetching campaign:', error);
    return {
      success: false,
      error: "Une erreur s'est produite. Veuillez réessayer.",
    };
  }
}
