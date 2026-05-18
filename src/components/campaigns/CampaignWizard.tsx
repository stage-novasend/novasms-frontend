import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useCampaignStore } from '@/store/campaign.store';
import { CampaignChannelStep } from './steps/CampaignChannelStep';
import { CampaignContentStep } from './steps/CampaignContentStep';
import { CampaignAudienceStep } from './steps/CampaignAudienceStep';
import { CampaignScheduleStep } from './steps/CampaignScheduleStep';

/**
 * CampaignWizard — Orchestrate 4-step workflow
 * Synchronizes: Channel → Content (Email/SMS) → Audience → Schedule/A/B/Review
 * Persists to Zustand store automatically
 */

export const CampaignWizard: FC = () => {
  const {
    draft,
    setDraftStep,
    saveDraft,
    clearDraft,
    submitCampaign,
    error,
    isLoading,
  } = useCampaignStore();

  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    if (draftSaved) {
      const timer = setTimeout(() => setDraftSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [draftSaved]);

  const handleSaveDraft = async () => {
    saveDraft();
    setDraftSaved(true);
  };

  const handleNext = async () => {
    saveDraft();
    if (draft.step < 4) {
      setDraftStep((draft.step + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handlePrev = () => {
    if (draft.step > 1) {
      setDraftStep((draft.step - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await submitCampaign();
      if (result.success) {
        // TODO: Redirect to campaign detail/success page
        console.log('Campaign created:', result.campaignId);
      }
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  const handleDiscard = () => {
    clearDraft();
    setConfirmDiscard(false);
    window.location.href = '/campaigns';
  };

  const renderStep = () => {
    switch (draft.step) {
      case 1:
        return <CampaignChannelStep onNext={handleNext} />;
      case 2:
        return (
          <CampaignContentStep
            onNext={handleNext}
            onPrev={handlePrev}
          />
        );
      case 3:
        return (
          <CampaignAudienceStep
            onNext={handleNext}
            onPrev={handlePrev}
          />
        );
      case 4:
        return (
          <CampaignScheduleStep
            onSubmit={handleSubmit}
            onPrev={handlePrev}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-8 h-16 bg-surface border-b border-outline-variant/10 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h1 className="font-headline text-2xl font-bold text-primary">
            NovaSMS
          </h1>
          <div className="h-6 w-[1px] bg-outline-variant/30" />
          <span className="text-sm text-on-surface-variant">
            {draft.name ? `Brouillon: ${draft.name}` : 'Nouvelle campagne'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {error && (
            <div className="text-error text-sm font-medium">
              {error}
            </div>
          )}
          {draftSaved && (
            <div className="flex items-center gap-2 text-success text-sm font-medium">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Brouillon sauvegardé
            </div>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="px-4 py-2 bg-surface-container text-on-surface font-semibold hover:bg-surface-container-high transition-colors disabled:opacity-50 rounded-lg flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            Enregistrer
          </button>
          <button
            onClick={() => setConfirmDiscard(true)}
            disabled={isLoading}
            className="px-4 py-2 text-on-surface-variant hover:text-error transition-colors disabled:opacity-50"
          >
            Abandonner
          </button>
        </div>
      </header>

      {/* Wizard Content */}
      <main className="flex-1 py-8">
        {renderStep()}
      </main>

      {/* Discard Confirmation Modal */}
      {confirmDiscard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container-lowest rounded-xl p-8 max-w-sm w-full mx-4 space-y-6">
            <div className="flex items-center gap-4 text-error">
              <span className="material-symbols-outlined text-4xl">
                warning
              </span>
              <h3 className="font-headline font-bold text-lg">
                Abandonner les modifications ?
              </h3>
            </div>
            <p className="text-on-surface-variant text-sm">
              Vos modifications seront définitivement perdues.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmDiscard(false)}
                className="flex-1 py-3 bg-surface-container-high text-on-surface font-bold rounded-lg hover:bg-surface-container-highest transition-colors"
              >
                Continuer
              </button>
              <button
                onClick={handleDiscard}
                className="flex-1 py-3 text-error font-semibold hover:bg-error-container/20 rounded-lg transition-colors"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
