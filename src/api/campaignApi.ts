/**
 * Campaign API Service
 * Centralized API calls for campaign management
 * Base URL: /api/campaigns
 */

import type {
  CampaignAPICreateRequest,
  CampaignAPIUpdateRequest,
  CampaignAPIResponse,
  CampaignAPIListResponse,
} from '@/types/campaign.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const CAMPAIGNS_ENDPOINT = `${API_BASE_URL}/campaigns`;

/**
 * API Error Handler
 */
interface CampaignAPIError {
  status: number;
  message: string;
  data?: unknown;
}

function createAPIError(status: number, message: string, data?: unknown): Error & CampaignAPIError {
  const error = new Error(message) as Error & CampaignAPIError;
  error.status = status;
  error.message = message;
  error.data = data;
  return error;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw createAPIError(
      response.status,
      error.message || `API Error: ${response.status}`,
      error
    );
  }
  return response.json();
};

/**
 * Campaign API Endpoints
 */
export const campaignApi = {
  /**
   * Create a new campaign
   * POST /api/campaigns
   */
  create: async (payload: CampaignAPICreateRequest): Promise<CampaignAPIResponse> => {
    const response = await fetch(CAMPAIGNS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  /**
   * Get all campaigns for current account
   * GET /api/campaigns
   */
  list: async (options?: {
    status?: string;
    channel?: string;
    limit?: number;
    offset?: number;
  }): Promise<CampaignAPIListResponse> => {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.channel) params.append('channel', options.channel);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const url = `${CAMPAIGNS_ENDPOINT}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /**
   * Get single campaign by ID
   * GET /api/campaigns/:id
   */
  get: async (id: string): Promise<CampaignAPIResponse> => {
    const response = await fetch(`${CAMPAIGNS_ENDPOINT}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /**
   * Update campaign
   * PATCH /api/campaigns/:id
   */
  update: async (
    id: string,
    payload: CampaignAPIUpdateRequest
  ): Promise<CampaignAPIResponse> => {
    const response = await fetch(`${CAMPAIGNS_ENDPOINT}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  /**
   * Delete campaign
   * DELETE /api/campaigns/:id
   */
  delete: async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${CAMPAIGNS_ENDPOINT}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /**
   * Send campaign (mark as sent)
   * POST /api/campaigns/:id/send
   */
  send: async (id: string): Promise<CampaignAPIResponse> => {
    const response = await fetch(`${CAMPAIGNS_ENDPOINT}/${id}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /**
   * Get campaign analytics
   * GET /api/campaigns/:id/analytics
   */
  analytics: async (id: string): Promise<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    bounced: number;
  }> => {
    const response = await fetch(`${CAMPAIGNS_ENDPOINT}/${id}/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

export type { CampaignAPIError };
