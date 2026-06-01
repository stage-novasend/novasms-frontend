/**
 * Campaign API Service
 * Centralized API calls for campaign management
 * Base URL: /api/campaigns
 * Uses axios client with JWT interceptors for proper authentication
 */

import api from './axios';
import type {
  CampaignAPICreateRequest,
  CampaignAPIUpdateRequest,
  CampaignAPIResponse,
  CampaignAPIListResponse,
} from '@/types/campaign.types';

/**
 * Campaign API Endpoints
 */
export const campaignApi = {
  /**
   * Create a new campaign
   * POST /api/campaigns
   */
  create: async (payload: CampaignAPICreateRequest): Promise<CampaignAPIResponse> => {
    try {
      console.log('📡 Creating campaign:', payload);
      const response = await api.post<CampaignAPIResponse>('/campaigns', payload);
      console.log('✅ Campaign created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating campaign:', error);
      throw error;
    }
  },

  /**
   * Get all campaigns for current account
   * GET /api/campaigns
   */
  list: async (options?: {
    status?: string;
    channel?: string;
    search?: string;
    page?: number;
    limit?: number;
    offset?: number;
  }): Promise<CampaignAPIListResponse> => {
    try {
      console.log('📡 Fetching campaigns:', options);
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.channel) params.append('channel', options.channel);
      if (options?.search) params.append('search', options.search);
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get<CampaignAPIListResponse>(`/campaigns${queryString}`);
      console.log('✅ Campaigns retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching campaigns:', error);
      throw error;
    }
  },

  /**
   * Get single campaign by ID
   * GET /api/campaigns/:id
   */
  get: async (id: string): Promise<CampaignAPIResponse> => {
    try {
      console.log('📡 Fetching campaign:', id);
      const response = await api.get<CampaignAPIResponse>(`/campaigns/${id}`);
      console.log('✅ Campaign retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching campaign:', error);
      throw error;
    }
  },

  /**
   * Update campaign
   * PATCH /api/campaigns/:id
   */
  update: async (id: string, payload: CampaignAPIUpdateRequest): Promise<CampaignAPIResponse> => {
    try {
      console.log('📡 Updating campaign:', id, payload);
      const response = await api.patch<CampaignAPIResponse>(`/campaigns/${id}`, payload);
      console.log('✅ Campaign updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating campaign:', error);
      throw error;
    }
  },

  /**
   * Delete campaign
   * DELETE /api/campaigns/:id
   */
  delete: async (id: string): Promise<{ success: boolean }> => {
    try {
      console.log('🗑️  Deleting campaign:', id);
      const response = await api.delete<{ success: boolean }>(`/campaigns/${id}`);
      console.log('✅ Campaign deleted');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting campaign:', error);
      throw error;
    }
  },

  /**
   * Duplicate campaign
   * POST /api/campaigns/:id/duplicate
   */
  duplicate: async (id: string): Promise<CampaignAPIResponse> => {
    try {
      console.log('📄 Duplicating campaign:', id);
      const response = await api.post<CampaignAPIResponse>(`/campaigns/${id}/duplicate`, {});
      console.log('✅ Campaign duplicated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error duplicating campaign:', error);
      throw error;
    }
  },

  /**
   * Send campaign (mark as sent)
   * POST /api/campaigns/:id/send
   */
  send: async (id: string): Promise<CampaignAPIResponse> => {
    try {
      console.log('🚀 Sending campaign:', id);
      const response = await api.post<CampaignAPIResponse>(`/campaigns/${id}/send`, {});
      console.log('✅ Campaign sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending campaign:', error);
      throw error;
    }
  },

  /**
   * Get campaign analytics
   * GET /api/campaigns/:id/analytics
   */
  analytics: async (
    id: string,
  ): Promise<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    bounced: number;
  }> => {
    try {
      console.log('📊 Fetching analytics for campaign:', id);
      const response = await api.get<{
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        converted: number;
        bounced: number;
      }>(`/campaigns/${id}/analytics`);
      console.log('✅ Analytics retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      throw error;
    }
  },
};
