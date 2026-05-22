/**
 * Campaign API & Form Types
 * Synchronisé avec backend DTOs et validations
 */

// Internal Domain Types (from store/campaign.store.ts)
export interface CampaignBlock {
  id: string;
  type: 'text' | 'image' | 'button' | 'product' | 'divider' | 'social' | 'columns' | 'spacing' | 'html';
  content: Record<string, unknown>;
}

export interface EmailContent {
  subject: string;
  preheader?: string;
  blocks: CampaignBlock[];
  template?: string;
}

export interface SMSContent {
  message: string;
  senderName: string;
  shortLinks?: Record<string, string>;
  variables?: string[];
}

export interface ABTestConfig {
  enabled: boolean;
  splitRatio: number;
  variantA: { emailSubject?: string; smsMessage?: string };
  variantB: { emailSubject?: string; smsMessage?: string };
  winnerCriteria?: 'open_rate' | 'click_rate' | 'conversion';
  autoEvaluate?: boolean;
}

export interface ScheduleConfig {
  type: 'immediate' | 'scheduled' | 'recurring';
  scheduledAt?: Date;
  timezone?: string;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  aiSuggestedTime?: { date: Date; confidence: number };
}

export interface Campaign {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  channel: 'SMS' | 'EMAIL';
  status: 'draft' | 'scheduled' | 'sent' | 'paused' | 'failed';
  segmentId: string;
  segmentName?: string;
  emailContent?: EmailContent;
  smsContent?: SMSContent;
  abTest?: ABTestConfig;
  schedule?: ScheduleConfig;
  estimatedRecipients: number;
  estimatedCost: number;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  analytics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

export interface CampaignAPICreateRequest {
  name: string;
  description?: string;
  channelType: 'SMS' | 'EMAIL';
  segmentId?: string;
  emailContent?: EmailContent;
  smsContent?: SMSContent;
  abTest?: ABTestConfig;
  schedule?: ScheduleConfig;
  estimatedRecipients?: number;
  estimatedCost?: number;
    promoCode?: string; // EN-1688: Personalization variable
  status: string;
}

export type CampaignAPIUpdateRequest = Partial<CampaignAPICreateRequest>;

export interface CampaignAPIResponse {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  channel: 'SMS' | 'EMAIL';
  status: 'draft' | 'scheduled' | 'sent' | 'paused' | 'failed';
  segmentId: string;
  segmentName?: string;
  emailContent?: EmailContent;
  smsContent?: SMSContent;
  abTest?: ABTestConfig;
  schedule?: ScheduleConfig;
  estimatedRecipients: number;
  estimatedCost: number;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  analytics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

export interface CampaignAPIListResponse {
  data: CampaignAPIResponse[];
  total: number;
  page: number;
  limit: number;
}

// Form Validation Schemas (Zod)
export const createCampaignSchema = {
  name: { required: true, minLength: 3, maxLength: 100 },
  channel: { required: true, enum: ['SMS', 'EMAIL'] },
  segmentId: { required: true, format: 'uuid' },
  emailSubject: { maxLength: 120 },
  smsMessage: { maxLength: 160 },
};

// Segment Type (used in Campaign form)
export interface Segment {
  id: string;
  name: string;
  contactCount: number;
  criteria: Record<string, unknown>;
  createdAt: Date;
}

// Contact Variable Types (for dynamic content)
export const CONTACT_VARIABLES = {
  email: {
    firstName: '{{firstName}}',
    lastName: '{{lastName}}',
    email: '{{email}}',
    phone: '{{phone}}',
    shopName: '{{shopName}}',
    promoCode: '{{promoCode}}',
    tags: '{{tags}}',
    customField1: '{{customField1}}',
  },
  sms: {
    firstName: '{{firstName}}',
    phone: '{{phone}}',
    shopName: '{{shopName}}',
    promoCode: '{{promoCode}}',
    customField1: '{{customField1}}',
  },
};

// SMS Cost Configuration (from backend)
export const SMS_COST_CONFIG = {
  pricePerSegment: 0.08, // FCFA
  segmentLength: 160, // characters
  currency: 'XOF',
};

export const calculateSMSCost = (messageLength: number, recipientCount: number): number => {
  const segments = Math.ceil(messageLength / SMS_COST_CONFIG.segmentLength);
  return segments * SMS_COST_CONFIG.pricePerSegment * recipientCount;
};

export const calculateSMSSegments = (messageLength: number): number => {
  return Math.ceil(messageLength / SMS_COST_CONFIG.segmentLength);
};
