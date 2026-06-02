import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCampaignStore } from '@/store/campaign.store';
import { saveCampaignDraft, sendCampaign, cancelCampaign } from '@/services/campaignService';
import api from '@/api/axios';

interface CampaignScheduleStepProps {
  onSubmit: () => void;
  onPrev: () => void;
}

export const CampaignScheduleStep: FC<CampaignScheduleStepProps> = ({ onPrev }) => {
  const navigate = useNavigate();
  const { draft, setDraftSchedule, setDraftABTest, clearDraft, selectedCampaignId } =
    useCampaignStore();
  const isAutomationMode = draft.mode === 'automation';

  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>(
    draft.schedule?.type === 'scheduled' ? 'scheduled' : 'immediate',
  );
  const [scheduledDate, setScheduledDate] = useState(
    draft.schedule?.scheduledAt
      ? new Date(draft.schedule.scheduledAt).toISOString().split('T')[0]
      : '',
  );
  const [scheduledTime, setScheduledTime] = useState(
    draft.schedule?.scheduledAt
      ? new Date(draft.schedule.scheduledAt).toTimeString().slice(0, 5)
      : '10:00',
  );
  const [timezone, setTimezone] = useState(draft.schedule?.timezone || 'Africa/Abidjan');
  const [abEnabled, setAbEnabled] = useState(draft.abTest?.enabled || false);
  const [splitRatio, setSplitRatio] = useState(draft.abTest?.splitRatio || 20);
  const [promoCode, setPromoCode] = useState(draft.promoCode || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setScheduleType(draft.schedule?.type === 'scheduled' ? 'scheduled' : 'immediate');
    setScheduledDate(
      draft.schedule?.scheduledAt
        ? new Date(draft.schedule.scheduledAt).toISOString().split('T')[0]
        : '',
    );
    setScheduledTime(
      draft.schedule?.scheduledAt
        ? new Date(draft.schedule.scheduledAt).toTimeString().slice(0, 5)
        : '10:00',
    );
    setTimezone(draft.schedule?.timezone || 'Africa/Abidjan');
    setAbEnabled(draft.abTest?.enabled || false);
    setSplitRatio(draft.abTest?.splitRatio || 20);
    setPromoCode(draft.promoCode || '');
  }, [
    draft.schedule?.scheduledAt,
    draft.schedule?.timezone,
    draft.schedule?.type,
    draft.abTest?.enabled,
    draft.abTest?.splitRatio,
    draft.promoCode,
  ]);

  const buildEmailTextContent = (emailContent = draft.emailContent) => {
    const blocks = emailContent?.blocks || [];
    return blocks
      .map((block) => {
        if (block.type === 'text' && typeof block.content.text === 'string') {
          return block.content.text;
        }
        if (block.type === 'button' && typeof block.content.text === 'string') {
          return block.content.text;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n')
      .trim();
  };

  const buildEmailContentPayload = (emailContent = draft.emailContent, channel = draft.channel) => {
    if (channel !== 'EMAIL') return undefined;

    return {
      subject: emailContent?.subject || '',
      preheader: emailContent?.preheader || '',
      blocks: emailContent?.blocks || [],
    };
  };

  const handleScheduleChange = () => {
    if (scheduleType === 'scheduled' && scheduledDate && scheduledTime) {
      const dt = new Date(`${scheduledDate}T${scheduledTime}`);
      setDraftSchedule({ type: 'scheduled', scheduledAt: dt, timezone });
    } else {
      setDraftSchedule({ type: 'immediate', timezone });
    }
  };

  const handleABTestChange = () => {
    const abTestConfig = draft.abTest || {
      enabled: false,
      splitRatio: 20,
      variantA: { emailSubject: '', smsMessage: '' },
      variantB: { emailSubject: '', smsMessage: '' },
    };
    setDraftABTest({ ...abTestConfig, enabled: abEnabled, splitRatio });
  };

  // 📌 Enregistrer brouillon (ne requiert PAS de segmentId)
  const handleSaveDraft = async () => {
    if (!draft.channel || !draft.name) {
      toast.error('Veuillez indiquer un nom et un canal pour la campagne');
      return;
    }

    if (!isAutomationMode && !draft.segmentId) {
      toast.error("Veuillez sélectionner un segment d'audience");
      return;
    }

    setIsSaving(true);
    handleScheduleChange();
    handleABTestChange();

    try {
      console.log('💾 Saving draft from schedule step...');
      const latestDraft = useCampaignStore.getState().draft;

      let campaignId = selectedCampaignId;
      if (!campaignId) {
        console.log('📝 Creating minimal campaign draft...');
        const createRes = await api.post<{ id: string }>('/campaigns', {
          channelType: latestDraft.channel,
          name: latestDraft.name,
          status: isAutomationMode ? 'AUTOMATION' : 'DRAFT',
          segmentId: isAutomationMode ? undefined : latestDraft.segmentId,
        });
        campaignId = createRes.data.id;
        useCampaignStore.setState({ selectedCampaignId: campaignId });
        console.log('✅ Campaign draft created with ID:', campaignId);
      }

      const subject =
        latestDraft.channel === 'EMAIL' ? latestDraft.emailContent?.subject : undefined;
      const content =
        latestDraft.channel === 'SMS'
          ? latestDraft.smsContent?.message
          : buildEmailTextContent(latestDraft.emailContent);

      const draftData: Record<string, unknown> = {
        name: latestDraft.name,
        timezone,
      };
      if (scheduleType === 'scheduled' && scheduledDate && scheduledTime) {
        draftData.scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }
      if (isAutomationMode) {
        draftData.status = 'AUTOMATION';
      }
      if (subject) draftData.subject = subject;
      if (content) draftData.content = content;
      const emailContentPayload = buildEmailContentPayload(
        latestDraft.emailContent,
        latestDraft.channel,
      );
      if (emailContentPayload) {
        draftData.emailContent = emailContentPayload;
        draftData.contentJson = emailContentPayload;
      }
      if (latestDraft.segmentId && !isAutomationMode) draftData.segmentId = latestDraft.segmentId;
      if (promoCode) draftData.promoCode = promoCode;

      const result = await saveCampaignDraft(campaignId, draftData);
      setIsSaving(false);

      if (result.success) {
        console.log('✅ Draft saved successfully');
        toast.success('✓ Brouillon sauvegardé');
      } else {
        console.error('❌ Draft save error:', result.error);
        toast.error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('❌ Error in handleSaveDraft:', err);
      toast.error('Erreur lors de la sauvegarde du brouillon');
      setIsSaving(false);
    }
  };

  // 📌 Envoyer ou programmer
  const handleSendCampaign = async () => {
    const latestDraft = useCampaignStore.getState().draft;

    if (isAutomationMode) {
      await handleSaveDraft();
      return;
    }

    if (!latestDraft.segmentId) {
      toast.error("Veuillez sélectionner un segment d'audience");
      return;
    }

    const subject = latestDraft.channel === 'EMAIL' ? latestDraft.emailContent?.subject : undefined;
    const content =
      latestDraft.channel === 'SMS'
        ? latestDraft.smsContent?.message
        : buildEmailTextContent(latestDraft.emailContent);

    if (!subject && !content) {
      toast.error('Veuillez ajouter du contenu à votre campagne');
      return;
    }

    setIsSaving(true);
    handleScheduleChange();

    if (scheduleType === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        toast.error('Choisissez une date et une heure pour la programmation');
        setIsSaving(false);
        return;
      }

      const plannedDate = new Date(`${scheduledDate}T${scheduledTime}`);
      if (Number.isNaN(plannedDate.getTime()) || plannedDate.getTime() <= Date.now()) {
        toast.error('La date planifiée doit être dans le futur');
        setIsSaving(false);
        return;
      }
    }

    try {
      console.log('🚀 Preparing to send campaign...');

      // If no campaignId, first create the campaign
      let campaignId = selectedCampaignId;
      if (!campaignId) {
        console.log('📝 Creating campaign first to get ID...');
        const createRes = await api.post<{ id: string }>('/campaigns', {
          channelType: latestDraft.channel,
          name: latestDraft.name,
          segmentId: isAutomationMode ? undefined : latestDraft.segmentId,
          promoCode: promoCode || undefined,
          subject,
          content,
          estimatedRecipients: latestDraft.estimatedRecipients || 0,
          estimatedCost: latestDraft.estimatedCost || 0,
          status: isAutomationMode ? 'AUTOMATION' : 'DRAFT',
        });
        campaignId = createRes.data.id;
        useCampaignStore.setState({ selectedCampaignId: campaignId });
        console.log('✅ Campaign created with ID:', campaignId);
      }

      const draftData: Record<string, unknown> = {
        name: latestDraft.name,
        timezone,
        estimatedRecipients: latestDraft.estimatedRecipients || 0,
        estimatedCost: latestDraft.estimatedCost || 0,
      };
      if (scheduleType === 'scheduled' && scheduledDate && scheduledTime) {
        draftData.scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }
      if (!isAutomationMode && latestDraft.segmentId) {
        draftData.segmentId = latestDraft.segmentId;
      }
      if (isAutomationMode) {
        draftData.status = 'AUTOMATION';
      }
      if (subject) draftData.subject = subject;
      if (content) draftData.content = content;
      const emailContentPayload = buildEmailContentPayload(
        latestDraft.emailContent,
        latestDraft.channel,
      );
      if (emailContentPayload) {
        draftData.emailContent = emailContentPayload;
        draftData.contentJson = emailContentPayload;
      }
      if (promoCode) draftData.promoCode = promoCode;
      const saveResult = await saveCampaignDraft(campaignId, draftData);
      if (!saveResult.success) {
        toast.error(saveResult.error || 'Erreur lors de la sauvegarde du brouillon');
        setIsSaving(false);
        return;
      }

      let scheduledAt = undefined;
      if (scheduleType === 'scheduled' && scheduledDate && scheduledTime) {
        scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      const result = await sendCampaign(campaignId, {
        immediateOrScheduled: scheduleType,
        scheduledAt,
      });
      setIsSaving(false);

      if (result.success) {
        const message =
          scheduleType === 'scheduled'
            ? '✓ Campagne programmée avec succès'
            : '✓ Campagne envoyée avec succès';
        console.log('✅ Send campaign successful');
        toast.success(message);

        // Refresh list cache so /campaigns reflects latest status without manual reload.
        await useCampaignStore.getState().fetchCampaigns();

        clearDraft();
        setTimeout(() => navigate('/campaigns'), 1500);
      } else {
        console.error('❌ Send campaign error:', result.error);
        toast.error(result.error || "Erreur lors de l'envoi");
      }
    } catch (err) {
      console.error('❌ Error in handleSendCampaign:', err);
      toast.error("Erreur lors de l'envoi");
      setIsSaving(false);
    }
  };

  // 📌 Abandonner
  const handleCancel = async () => {
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir abandonner cette campagne ?\nLe brouillon sera supprimé.',
    );
    if (!confirmed) return;

    try {
      setIsSaving(true);
      console.log('⏹️  Cancelling campaign...');

      if (selectedCampaignId) {
        const result = await cancelCampaign(selectedCampaignId);
        setIsSaving(false);

        if (result.success) {
          console.log('✅ Campaign cancelled');
          toast.success('✓ Campagne annulée');
          clearDraft();
          navigate('/campaigns');
        } else {
          console.error('❌ Cancel campaign error:', result.error);
          toast.error(result.error || "Erreur lors de l'annulation");
        }
      } else {
        console.log('📌 No campaign ID, just clearing draft');
        clearDraft();
        setIsSaving(false);
        toast.success('✓ Brouillon supprimé');
        navigate('/campaigns');
      }
    } catch (err) {
      console.error('❌ Error in handleCancel:', err);
      toast.error("Erreur lors de l'annulation");
      setIsSaving(false);
    }
  };

  const formatCost = (amount?: number) => `${(amount || 0).toFixed(2)} FCFA`;

  return (
    <div className="max-w-6xl mx-auto px-8 py-12 space-y-12">
      {/* Step Indicator */}
      <div className="flex justify-center">
        <div className="flex items-center gap-4 w-full max-w-4xl">
          <div className="flex flex-col items-center gap-2 flex-1 opacity-40">
            <span className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm border-2 border-primary/40">
              ✓
            </span>
          </div>
          <div className="w-20 h-[2px] bg-primary/40" />
          <div className="flex flex-col items-center gap-2 flex-1 opacity-40">
            <span className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm border-2 border-primary/40">
              ✓
            </span>
          </div>
          <div className="w-20 h-[2px] bg-primary/40" />
          <div className="flex flex-col items-center gap-2 flex-1 opacity-40">
            <span className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm border-2 border-primary/40">
              ✓
            </span>
          </div>
          <div className="w-20 h-[2px] bg-primary/40" />
          <div className="flex flex-col items-center gap-2 flex-1 text-primary">
            <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-sm text-on-primary shadow-lg shadow-primary/20">
              4
            </span>
            <span className="text-xs font-bold uppercase hidden sm:inline">Planification</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-1">
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl font-headline font-bold text-on-surface">
                {isAutomationMode
                  ? 'Enregistrez votre campagne automatisée'
                  : 'Planifiez votre envoi'}
              </h2>
              <p className="text-on-surface-variant">
                {isAutomationMode
                  ? 'Aucun segment n’est requis. La campagne sera sauvegardée comme automatisation.'
                  : "Configurez la date et l'heure d'envoi de votre campagne."}
              </p>
            </div>

            {!isAutomationMode && (
              <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="schedule"
                        value="immediate"
                        checked={scheduleType === 'immediate'}
                        onChange={(e) => setScheduleType(e.target.value as 'immediate')}
                        className="w-5 h-5 cursor-pointer"
                      />
                      <span className="font-bold text-on-surface">Envoyer maintenant</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="schedule"
                        value="scheduled"
                        checked={scheduleType === 'scheduled'}
                        onChange={(e) => setScheduleType(e.target.value as 'scheduled')}
                        className="w-5 h-5 cursor-pointer"
                      />
                      <span className="font-bold text-on-surface">Programmer pour plus tard</span>
                    </label>

                {scheduleType === 'scheduled' && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-4">
                  <div>
                    <label className="text-sm font-bold text-on-surface">Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full mt-2 px-4 py-2 border border-outline-variant rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-on-surface">Heure</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full mt-2 px-4 py-2 border border-outline-variant rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-on-surface">Fuseau horaire</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full mt-2 px-4 py-2 border border-outline-variant rounded-lg"
                    >
                      <option value="Africa/Abidjan">Afrique de l'Ouest (GMT)</option>
                      <option value="Europe/Paris">Europe (CET)</option>
                      <option value="America/New_York">Amérique (EST)</option>
                    </select>
                  </div>
                </div>
                )}
              </div>
            )}

            {/* Promo Code */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface">Code promo (EN-1688)</label>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Ex: SUMMER2024"
                className="w-full px-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
              <p className="text-xs text-on-surface-variant">
                Variable {'{'}
                {'{'} promoCode {'}'}
                {'}'} sera remplacée par cette valeur dans les messages
              </p>
            </div>

            {/* A/B Test Options */}
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={abEnabled}
                  onChange={(e) => setAbEnabled(e.target.checked)}
                  className="w-5 h-5 cursor-pointer"
                />
                <span className="font-bold text-on-surface">Activer test A/B</span>
              </label>

              {abEnabled && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <label className="text-sm font-bold text-on-surface">
                    Ratio de séparation: {splitRatio}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={splitRatio}
                    onChange={(e) => setSplitRatio(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                  <p className="text-xs text-on-surface-variant mt-2">
                    {splitRatio}% recevront la variante A, {100 - splitRatio}% la variante B
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={isAutomationMode ? handleSaveDraft : handleSendCampaign}
                disabled={isSaving}
                className="w-full px-8 py-3 bg-primary text-on-primary font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all active:scale-95"
              >
                {isSaving
                  ? 'Traitement...'
                  : isAutomationMode
                    ? 'Créer la campagne automatisée'
                    : scheduleType === 'scheduled'
                      ? 'Programmer'
                      : 'Envoyer'}
              </button>
              <button
                onClick={() => void handleSaveDraft()}
                disabled={isSaving}
                className="w-full px-8 py-3 border-2 border-primary text-primary font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/5 transition-all active:scale-95"
              >
                {isAutomationMode ? 'Enregistrer comme automatisation' : 'Enregistrer brouillon'}
              </button>
              <button
                onClick={onPrev}
                disabled={isSaving}
                className="w-full px-8 py-3 text-on-surface-variant font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:text-on-surface transition-colors"
              >
                ← Précédent
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="w-full px-8 py-3 text-red-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:text-red-700 transition-colors"
              >
                Abandonner
              </button>
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-2 sticky top-20 h-fit">
          <div className="bg-surface-container rounded-2xl p-8 space-y-6">
            <h3 className="font-headline font-bold text-xl text-on-surface">Récapitulatif</h3>

            <div className="space-y-4">
              <div>
                <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">
                  Campagne
                </p>
                <p className="font-bold text-on-surface">{draft.name}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">
                  Canal
                </p>
                <p className="font-bold text-on-surface">{draft.channel}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">
                  Destinataires
                </p>
                <p className="font-bold text-on-surface">
                  {draft.estimatedRecipients?.toLocaleString('fr-FR')} contacts
                </p>
              </div>
              <div>
                <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">
                  Coût total
                </p>
                <p className="font-headline font-black text-2xl text-primary">
                  {formatCost(draft.estimatedCost)}
                </p>
              </div>
              {scheduleType === 'scheduled' && (
                <div>
                  <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">
                    Envoi prévu
                  </p>
                  <p className="font-bold text-on-surface">
                    {scheduledDate} à {scheduledTime}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
