import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { campaignApi } from '@/api/campaignApi';
import type {
  CampaignAPICreateRequest,
  CampaignAPIUpdateRequest,
  Campaign as CampaignModel,
  CampaignBlock as CampaignBlockModel,
  EmailContent as EmailContentModel,
  SMSContent as SMSContentModel,
  ABTestConfig as ABTestConfigModel,
  ScheduleConfig as ScheduleConfigModel,
} from '@/types/campaign.types';

/**
 * Campaign Store — Persistance complète avec localStorage + Intégration API
 * Synchronise Email, SMS, Schedule, A/B testing et récap final
 * Utilise RG-08 (performance), RG-12 (rapport), RG-13 (multi-tenant)
 */

export type Campaign = CampaignModel;
export type CampaignBlock = CampaignBlockModel;
export type EmailContent = EmailContentModel;
export type SMSContent = SMSContentModel;
export type ABTestConfig = ABTestConfigModel;
export type ScheduleConfig = ScheduleConfigModel;
export type CampaignChannel = Campaign['channel'];
export type CampaignStatus = Campaign['status'];

export interface CampaignDraft {
  step: 1 | 2 | 3 | 4; // 1=Channel, 2=Content, 3=Audience, 4=Schedule
  stopCode?: string; // RG-22: SMS STOP code (generated once per draft)
  channel?: CampaignChannel;
  name?: string;
  description?: string;
  segmentId?: string;
  segmentName?: string; // Track segment name for display
  emailContent?: EmailContent;
  smsContent?: SMSContent;
  abTest?: ABTestConfig;
  schedule?: ScheduleConfig;
  estimatedRecipients?: number;
  estimatedCost?: number;
}

interface CampaignStore {
  // State
  campaigns: Campaign[];
  draft: CampaignDraft;
  selectedCampaignId?: string;
  isLoading: boolean;
  error?: string;

  // Actions: Draft Management
  setDraftStep: (step: CampaignDraft['step']) => void;
  setDraftChannel: (channel: CampaignChannel) => void;
  setDraftName: (name: string) => void;
  setDraftSegment: (segmentId: string, segmentName: string) => void;
  setDraftEmailContent: (content: EmailContent) => void;
  setDraftSMSContent: (content: SMSContent) => void;
  setDraftABTest: (config: ABTestConfig) => void;
  setDraftSchedule: (config: ScheduleConfig) => void;
  updateEstimates: (recipients: number, cost: number) => void;

  // Actions: Campaign CRUD
  createCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Campaign>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<Campaign>;
  deleteCampaign: (id: string) => Promise<void>;
  getCampaign: (id: string) => Campaign | undefined;
  listCampaigns: () => Campaign[];

  // Actions: Workflow
  saveDraft: () => void;
  loadDraft: (campaignId?: string) => void;
  clearDraft: () => void;
  submitCampaign: () => Promise<{ success: boolean; campaignId: string }>;

  // Actions: State Management
  setError: (error?: string) => void;
  setLoading: (loading: boolean) => void;
}

const generateStopCode = (): string => {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
};

const INITIAL_DRAFT: CampaignDraft = {
  step: 1,
  stopCode: generateStopCode(),
  channel: undefined,
  emailContent: {
    subject: '',
    preheader: '',
    blocks: [],
  },
  smsContent: {
    message: '',
    senderName: '',
    variables: [],
  },
  abTest: {
    enabled: false,
    splitRatio: 20,
    variantA: {},
    variantB: {},
    winnerCriteria: 'open_rate',
    autoEvaluate: false,
  },
  schedule: {
    type: 'immediate',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
};

export const useCampaignStore = create<CampaignStore>()(
  persist(
    (set, get) => ({
      // State
      campaigns: [],
      draft: INITIAL_DRAFT,
      isLoading: false,

      // Draft Management
      setDraftStep: (step) =>
        set((state) => ({
          draft: { ...state.draft, step },
        })),

      setDraftChannel: (channel) =>
        set((state) => ({
          draft: { ...state.draft, channel },
        })),

      setDraftName: (name) =>
        set((state) => ({
          draft: { ...state.draft, name },
        })),

      setDraftSegment: (segmentId, segmentName) =>
        set((state) => ({
          draft: { ...state.draft, segmentId, segmentName },
        })),

      setDraftEmailContent: (emailContent) =>
        set((state) => ({
          draft: { ...state.draft, emailContent },
        })),

      setDraftSMSContent: (smsContent) =>
        set((state) => ({
          draft: { ...state.draft, smsContent },
        })),

      setDraftABTest: (abTest) =>
        set((state) => ({
          draft: { ...state.draft, abTest },
        })),

      setDraftSchedule: (schedule) =>
        set((state) => ({
          draft: { ...state.draft, schedule },
        })),

      updateEstimates: (recipients, cost) =>
        set((state) => ({
          draft: {
            ...state.draft,
            estimatedRecipients: recipients,
            estimatedCost: cost,
          },
        })),

      // Campaign CRUD
      createCampaign: async (campaign) => {
        set({ isLoading: true, error: undefined });
        try {
          const payload: CampaignAPICreateRequest = {
            name: campaign.name,
            description: campaign.description,
            channel: campaign.channel,
            segmentId: campaign.segmentId,
            emailContent: campaign.emailContent,
            smsContent: campaign.smsContent,
            abTest: campaign.abTest,
            schedule: campaign.schedule,
            estimatedRecipients: campaign.estimatedRecipients,
            estimatedCost: campaign.estimatedCost,
            status: campaign.status,
          };

          const response = await campaignApi.create(payload);
          const newCampaign: Campaign = {
            id: response.id,
            accountId: response.accountId,
            name: response.name,
            description: response.description,
            channel: response.channel,
            status: response.status,
            segmentId: response.segmentId,
            segmentName: response.segmentName,
            emailContent: response.emailContent,
            smsContent: response.smsContent,
            abTest: response.abTest,
            schedule: response.schedule ? {
              ...response.schedule,
              scheduledAt: response.schedule.scheduledAt ? new Date(response.schedule.scheduledAt) : undefined,
            } : undefined,
            estimatedRecipients: response.estimatedRecipients,
            estimatedCost: response.estimatedCost,
            createdAt: new Date(response.createdAt),
            updatedAt: new Date(response.updatedAt),
            sentAt: response.sentAt ? new Date(response.sentAt) : undefined,
            analytics: response.analytics,
          };

          set((state) => ({
            campaigns: [...state.campaigns, newCampaign],
            isLoading: false,
          }));

          return newCampaign;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Creation failed';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      updateCampaign: async (id, updates) => {
        set({ isLoading: true, error: undefined });
        try {
          const campaign = get().getCampaign(id);
          if (!campaign) throw new Error('Campaign not found');

          const payload: CampaignAPIUpdateRequest = {
            name: updates.name || campaign.name,
            description: updates.description || campaign.description,
            channel: updates.channel || campaign.channel,
            segmentId: updates.segmentId || campaign.segmentId,
            emailContent: updates.emailContent || campaign.emailContent,
            smsContent: updates.smsContent || campaign.smsContent,
            abTest: updates.abTest || campaign.abTest,
            schedule: updates.schedule || campaign.schedule,
            estimatedRecipients: updates.estimatedRecipients || campaign.estimatedRecipients,
            estimatedCost: updates.estimatedCost || campaign.estimatedCost,
            status: updates.status || campaign.status,
          };

          const response = await campaignApi.update(id, payload);
          const updated: Campaign = {
            id: response.id,
            accountId: response.accountId,
            name: response.name,
            description: response.description,
            channel: response.channel,
            status: response.status,
            segmentId: response.segmentId,
            segmentName: response.segmentName,
            emailContent: response.emailContent,
            smsContent: response.smsContent,
            abTest: response.abTest,
            schedule: response.schedule ? {
              ...response.schedule,
              scheduledAt: response.schedule.scheduledAt ? new Date(response.schedule.scheduledAt) : undefined,
            } : undefined,
            estimatedRecipients: response.estimatedRecipients,
            estimatedCost: response.estimatedCost,
            createdAt: new Date(response.createdAt),
            updatedAt: new Date(response.updatedAt),
            sentAt: response.sentAt ? new Date(response.sentAt) : undefined,
            analytics: response.analytics,
          };

          set((state) => ({
            campaigns: state.campaigns.map((c) => (c.id === id ? updated : c)),
            isLoading: false,
          }));

          return updated;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Update failed';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      deleteCampaign: async (id) => {
        set({ isLoading: true, error: undefined });
        try {
          await campaignApi.delete(id);
          set((state) => ({
            campaigns: state.campaigns.filter((c) => c.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Delete failed';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      getCampaign: (id) => {
        return get().campaigns.find((c) => c.id === id);
      },

      listCampaigns: () => {
        return get().campaigns;
      },

      // Workflow
      saveDraft: () => {
        // Automatically persisted by Zustand localStorage middleware
        set({ error: undefined });
      },

      loadDraft: (campaignId) => {
        if (campaignId) {
          const campaign = get().getCampaign(campaignId);
          if (campaign) {
            set({
              draft: {
                step: 1,
                channel: campaign.channel,
                name: campaign.name,
                description: campaign.description,
                segmentId: campaign.segmentId,
                emailContent: campaign.emailContent,
                smsContent: campaign.smsContent,
                abTest: campaign.abTest,
                schedule: campaign.schedule,
                estimatedRecipients: campaign.estimatedRecipients,
                estimatedCost: campaign.estimatedCost,
              },
              selectedCampaignId: campaignId,
            });
          }
        }
      },

      clearDraft: () => {
        set({
          draft: INITIAL_DRAFT,
          selectedCampaignId: undefined,
          error: undefined,
        });
      },

      submitCampaign: async () => {
        const { draft, selectedCampaignId } = get();

        if (!draft.channel || !draft.name || !draft.segmentId) {
          set({ error: 'Missing required fields' });
          throw new Error('Missing required fields');
        }

        set({ isLoading: true, error: undefined });
        try {
          if (selectedCampaignId) {
            // Update existing
            await get().updateCampaign(selectedCampaignId, {
              name: draft.name,
              description: draft.description,
              channel: draft.channel,
              segmentId: draft.segmentId,
              emailContent: draft.emailContent,
              smsContent: draft.smsContent,
              abTest: draft.abTest,
              schedule: draft.schedule,
              estimatedRecipients: draft.estimatedRecipients || 0,
              estimatedCost: draft.estimatedCost || 0,
              status: 'scheduled',
            });
          } else {
            // Create new
            const campaign = await get().createCampaign({
              accountId: '', // Will be set by backend from JWT
              name: draft.name,
              description: draft.description,
              channel: draft.channel,
              segmentId: draft.segmentId,
              emailContent: draft.emailContent,
              smsContent: draft.smsContent,
              abTest: draft.abTest,
              schedule: draft.schedule,
              estimatedRecipients: draft.estimatedRecipients || 0,
              estimatedCost: draft.estimatedCost || 0,
              status: 'scheduled',
            });
            set({ selectedCampaignId: campaign.id });
          }

          const finalCampaignId = selectedCampaignId || get().selectedCampaignId || '';
          get().clearDraft();
          set({ isLoading: false });
          return { success: true, campaignId: finalCampaignId };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Submit failed';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      // State Management
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),

    {
      name: 'campaign-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        draft: state.draft,
        campaigns: state.campaigns,
      }),
    },
  ),
);
