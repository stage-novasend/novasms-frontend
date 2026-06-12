import type { FC } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { useCampaignStore } from '@/store/campaign.store';
import { useCampaignActions } from '@/hooks/useCampaign';
import type { Campaign, CampaignStatus } from '@/store/campaign.store';

/**
 * Campaign List Dashboard
 * Features:
 * - Display all campaigns with status badges
 * - Filter by status (draft, scheduled, sent, paused, failed)
 * - Filter by channel (SMS, EMAIL)
 * - Sort by date or cost
 * - Quick actions (edit, duplicate, delete, view)
 * - Search campaigns by name
 */

const CampaignListDashboard: FC = () => {
  const navigate = useNavigate();
  const { campaigns, deleteCampaign, fetchCampaigns, isLoading, error } = useCampaignStore();
  const { duplicateCampaign } = useCampaignActions();

  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'SMS' | 'EMAIL'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'cost'>('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);

  useEffect(() => {
    void fetchCampaigns();
  }, [fetchCampaigns]);

  const filteredCampaigns = useMemo<Campaign[]>(() => {
    let result = [...campaigns];

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (channelFilter !== 'all') {
      result = result.filter((c) => c.channel === channelFilter);
    }

    if (searchTerm) {
      result = result.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (sortBy === 'cost') {
      result.sort((a, b) => b.estimatedCost - a.estimatedCost);
    }

    return result;
  }, [campaigns, statusFilter, channelFilter, sortBy, searchTerm]);

  const groupedCampaigns = useMemo(() => {
    const automation = filteredCampaigns.filter((campaign) => campaign.status === 'automation');
    const classic = filteredCampaigns.filter((campaign) => campaign.status !== 'automation');

    return { automation, classic };
  }, [filteredCampaigns]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCampaign(deleteTarget.id);
      toast.success('Campagne supprimée avec succès');
      setDeleteTarget(null);
    } catch (error) {
      toast.error('Suppression impossible pour cette campagne');
      console.error('Failed to delete campaign:', error);
    }
  };

  const getStatusBadgeColor = (status: CampaignStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-outline/20 text-on-surface-variant';
      case 'scheduled':
        return 'bg-primary/20 text-primary';
      case 'sent':
        return 'bg-tertiary/20 text-tertiary';
      case 'paused':
        return 'bg-secondary/20 text-secondary';
      case 'failed':
        return 'bg-error/20 text-error';
      case 'cancelled':
        return 'bg-secondary/20 text-secondary';
      case 'automation':
        return 'bg-tertiary/20 text-tertiary';
      default:
        return 'bg-outline/20 text-on-surface-variant';
    }
  };

  const getChannelIcon = (channel: string) => {
    if (channel === 'SMS') {
      return (
        <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#0c5460' }}>
          sms
        </span>
      );
    }
    return (
      <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#7c3aed' }}>
        mail
      </span>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCost = (amount: number) => {
    return `${amount.toFixed(2)} FCFA`;
  };

  const renderCampaignCard = (campaign: Campaign, tone: 'automation' | 'classic') => (
    <div
      key={campaign.id}
      className="flex items-center gap-4 rounded-xl border border-outline-variant/20 bg-white px-5 py-4 transition-all hover:shadow-md hover:-translate-y-px"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      {/* Canal icon */}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: campaign.channel === 'SMS' ? 'rgba(12,84,96,0.08)' : 'rgba(124,58,237,0.08)',
        }}
      >
        {getChannelIcon(campaign.channel)}
      </div>

      {/* Info principale */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold text-on-surface" style={{ fontSize: 14 }}>
            {campaign.name}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusBadgeColor(campaign.status)}`}
          >
            {campaign.status === 'draft' && 'Brouillon'}
            {campaign.status === 'scheduled' && 'Planifiée'}
            {campaign.status === 'sent' && 'Envoyée'}
            {campaign.status === 'paused' && 'En pause'}
            {campaign.status === 'failed' && 'Échouée'}
            {campaign.status === 'cancelled' && 'Annulée'}
            {campaign.status === 'automation' && 'Automatisation'}
          </span>
          {tone === 'automation' && campaign.status !== 'automation' && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              Auto
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              group
            </span>
            {campaign.estimatedRecipients.toLocaleString('fr-FR')} contacts
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              schedule
            </span>
            {formatDate(campaign.updatedAt)}
          </span>
          <span
            className="font-semibold"
            style={{ color: campaign.estimatedCost > 0 ? '#0c5460' : 'var(--text-3)' }}
          >
            {formatCost(campaign.estimatedCost)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Link
          to={`/campaigns/${campaign.id}`}
          className="rounded-lg p-2 text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
          title="Voir"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            visibility
          </span>
        </Link>
        <Link
          to={`/campaigns/${campaign.id}/report`}
          className="rounded-lg p-2 text-on-surface-variant transition hover:bg-surface-container hover:text-primary"
          title="Rapport"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            bar_chart
          </span>
        </Link>
        <Link
          to={`/campaigns/${campaign.id}/edit`}
          className="rounded-lg p-2 text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
          title="Modifier"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            edit
          </span>
        </Link>
        <button
          onClick={async () => {
            const duplicated = await duplicateCampaign(campaign);
            toast.success('Campagne dupliquée');
            navigate(`/campaigns/${duplicated.id}/edit`);
          }}
          className="rounded-lg p-2 text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
          title="Dupliquer"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            content_copy
          </span>
        </button>
        <button
          onClick={() => setDeleteTarget(campaign)}
          className="rounded-lg p-2 text-on-surface-variant transition hover:bg-surface-container"
          title="Supprimer"
        >
          <span className="material-symbols-outlined text-error" style={{ fontSize: 18 }}>
            delete
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[28px] border border-outline-variant/20 bg-gradient-to-br from-white via-surface to-brand-light/40 shadow-[0_18px_50px_rgba(12,84,96,0.08)]">
          <div className="flex flex-col gap-6 px-6 py-7 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-8">
            <div className="max-w-2xl space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Centre de pilotage
              </p>
              <h1 className="text-4xl font-black text-on-surface lg:text-5xl">Campagnes</h1>
              <p className="max-w-xl text-base leading-7 text-on-surface-variant lg:text-lg">
                Gérez vos campagnes SMS et Email avec une vue claire sur les statuts, les coûts et
                les actions rapides.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[34rem]">
              <div className="rounded-2xl border border-outline-variant/20 bg-white/80 px-4 py-4 shadow-sm backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Total
                </p>
                <p className="mt-1 text-2xl font-black text-primary">{filteredCampaigns.length}</p>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-white/80 px-4 py-4 shadow-sm backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Automatisées
                </p>
                <p className="mt-1 text-2xl font-black text-tertiary">
                  {groupedCampaigns.automation.length}
                </p>
              </div>
              <div className="rounded-2xl border border-outline-variant/20 bg-white/80 px-4 py-4 shadow-sm backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                  Classiques
                </p>
                <p className="mt-1 text-2xl font-black text-secondary">
                  {groupedCampaigns.classic.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-outline-variant/20 bg-white p-6 shadow-sm lg:p-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex-1">
              <label className="sr-only" htmlFor="campaign-search">
                Rechercher une campagne
              </label>
              <input
                id="campaign-search"
                type="text"
                placeholder="Rechercher une campagne..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                id="tour-new-campaign-btn"
                to="/campaigns/new"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-3 text-sm font-bold text-white transition hover:bg-secondary/90 active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Nouvelle campagne
              </Link>
              <Link
                to="/campaigns/new?mode=automation"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-primary/5 px-5 py-3 text-sm font-bold text-primary transition hover:bg-primary/10 active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                Campagne automatisée
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1.1fr_0.9fr_0.7fr]">
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Statut
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | 'all')}
                className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="all">Tous</option>
                <option value="draft">Brouillon</option>
                <option value="scheduled">Planifiée</option>
                <option value="sent">Envoyée</option>
                <option value="paused">Mise en pause</option>
                <option value="failed">Échouée</option>
                <option value="cancelled">Annulée</option>
                <option value="automation">Automatisation</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Canal
              </span>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value as 'all' | 'SMS' | 'EMAIL')}
                className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="all">Tous</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Trier par
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'cost')}
                className="w-full rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="date">Date (récent)</option>
                <option value="cost">Coût (élevé)</option>
              </select>
            </label>

            <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                Résultats
              </p>
              <p className="mt-1 text-2xl font-black text-primary">{filteredCampaigns.length}</p>
            </div>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
              <span className="material-symbols-outlined mt-0.5 text-[18px]">error</span>
              <p>{error}</p>
            </div>
          )}
        </section>

        {filteredCampaigns.length === 0 ? (
          <section className="rounded-[28px] border border-dashed border-outline-variant/30 bg-white p-12 text-center shadow-sm">
            <span className="material-symbols-outlined mb-4 block text-7xl text-outline/40">
              mail
            </span>
            <p className="text-lg text-on-surface-variant">
              {searchTerm
                ? 'Aucune campagne trouvée'
                : 'Aucune campagne. Créez votre première campagne.'}
            </p>
            <Link
              to="/campaigns/new"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-secondary px-5 py-3 text-sm font-bold text-white transition hover:bg-secondary/90"
            >
              Créer une campagne
            </Link>
          </section>
        ) : (
          <div className="space-y-8">
            <section className="space-y-4 rounded-[28px] border border-tertiary/10 bg-white p-5 shadow-sm lg:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-tertiary">
                    Automatisées
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Campagnes déclenchées depuis le parcours automatisé.
                  </p>
                </div>
                <span className="rounded-full bg-tertiary/10 px-3 py-1 text-xs font-bold text-tertiary">
                  {groupedCampaigns.automation.length}
                </span>
              </div>

              {groupedCampaigns.automation.length > 0 ? (
                <div className="space-y-4">
                  {groupedCampaigns.automation.map((campaign) =>
                    renderCampaignCard(campaign, 'automation'),
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-tertiary/20 bg-tertiary/5 p-6 text-sm text-on-surface-variant">
                  Aucune campagne automatisée ne correspond à vos filtres.
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-[28px] border border-primary/10 bg-white p-5 shadow-sm lg:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
                    Classiques
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Campagnes créées via le parcours standard avec audience.
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {groupedCampaigns.classic.length}
                </span>
              </div>

              {groupedCampaigns.classic.length > 0 ? (
                <div className="space-y-4">
                  {groupedCampaigns.classic.map((campaign) =>
                    renderCampaignCard(campaign, 'classic'),
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-6 text-sm text-on-surface-variant">
                  Aucune campagne classique ne correspond à vos filtres.
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <Dialog.Root
        open={Boolean(deleteTarget)}
        onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-2xl">
            <Dialog.Title className="text-xl font-bold text-on-surface">
              Supprimer la campagne ?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-on-surface-variant">
              Cette action est irréversible pour <strong>{deleteTarget?.name}</strong>.
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close className="rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high">
                Annuler
              </Dialog.Close>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isLoading}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
                style={{ background: '#dc2626' }}
              >
                {isLoading ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default CampaignListDashboard;
