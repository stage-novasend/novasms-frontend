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
  const {
    campaigns,
    deleteCampaign,
    fetchCampaigns,
    isLoading,
    error,
  } = useCampaignStore();
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
      result = result.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortBy === 'date') {
      result.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } else if (sortBy === 'cost') {
      result.sort((a, b) => b.estimatedCost - a.estimatedCost);
    }

    return result;
  }, [campaigns, statusFilter, channelFilter, sortBy, searchTerm]);

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
    return channel === 'SMS'
      ? '💬'
      : '📧';
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

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-headline font-black text-4xl text-on-surface mb-2">
          Campagnes
        </h1>
        <p className="text-on-surface-variant text-lg">
          Gérez, modifiez et suivez toutes vos campagnes de marketing
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-6 mb-8">
        {/* Search & Create */}
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher une campagne..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl font-body text-on-surface transition-all"
            />
          </div>
          <Link
            to="/campaigns/new"
            className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:brightness-110 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Nouvelle campagne
          </Link>
          <Link
            to="/campaigns/new?mode=automation"
            className="px-6 py-3 border border-primary/30 bg-primary/5 text-primary font-bold rounded-xl hover:bg-primary/10 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">bolt</span>
            Campagne automatisée
          </Link>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-label-sm font-bold uppercase tracking-widest text-on-surface-variant">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | 'all')}
              className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant focus:ring-2 focus:ring-primary rounded-lg font-body text-on-surface"
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
          </div>

          {/* Channel Filter */}
          <div className="space-y-2">
            <label className="text-label-sm font-bold uppercase tracking-widest text-on-surface-variant">
              Canal
            </label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as 'all' | 'SMS' | 'EMAIL')}
              className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant focus:ring-2 focus:ring-primary rounded-lg font-body text-on-surface"
            >
              <option value="all">Tous</option>
              <option value="SMS">SMS</option>
              <option value="EMAIL">Email</option>
            </select>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <label className="text-label-sm font-bold uppercase tracking-widest text-on-surface-variant">
              Trier par
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'cost')}
              className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant focus:ring-2 focus:ring-primary rounded-lg font-body text-on-surface"
            >
              <option value="date">Date (récent)</option>
              <option value="cost">Coût (élevé)</option>
            </select>
          </div>

          {/* Stats */}
          <div className="bg-primary/10 rounded-lg p-4 flex flex-col justify-center">
            <p className="text-on-surface-variant text-xs font-bold uppercase">Total</p>
            <p className="font-headline font-black text-2xl text-primary">
              {filteredCampaigns.length}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-error">error</span>
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* Campaign List */}
      {filteredCampaigns.length === 0 ? (
        <div className="bg-surface-container rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-8xl text-outline/50 block mb-4">
            mail
          </span>
          <p className="text-on-surface-variant text-lg">
            {searchTerm
              ? 'Aucune campagne trouvée'
              : 'Aucune campagne. Créez votre première campagne!'}
          </p>
          <Link
            to="/campaigns/new"
            className="mt-6 inline-block px-6 py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 transition-all"
          >
            Créer une campagne
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="relative bg-surface-container rounded-2xl p-6 flex items-center justify-between hover:bg-surface-container-high transition-all border border-outline-variant/10"
            >
              {/* Left: Campaign Info */}
              <div className="flex-1 flex items-start gap-6">
                {/* Channel Icon & Name */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-4xl">{getChannelIcon(campaign.channel)}</div>
                  <div className="flex-1">
                    <h3 className="font-headline font-bold text-lg text-on-surface mb-1">
                      {campaign.name}
                    </h3>
                    {campaign.description && (
                      <p className="text-on-surface-variant text-sm mb-3">
                        {campaign.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Status Badge */}
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusBadgeColor(
                          campaign.status
                        )}`}
                      >
                        {campaign.status === 'draft' && 'Brouillon'}
                        {campaign.status === 'scheduled' && 'Planifiée'}
                        {campaign.status === 'sent' && 'Envoyée'}
                        {campaign.status === 'paused' && 'Pause'}
                        {campaign.status === 'failed' && 'Échouée'}
                        {campaign.status === 'cancelled' && 'Annulée'}
                        {campaign.status === 'automation' && 'Automatisation'}
                      </span>

                      {/* Recipients */}
                      <div className="text-xs text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">group</span>
                        {campaign.estimatedRecipients.toLocaleString('fr-FR')} contacts
                      </div>

                      {/* Date */}
                      <div className="text-xs text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {formatDate(campaign.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Cost & Actions */}
              <div className="flex items-center gap-6">
                {/* Cost */}
                <div className="text-right">
                  <p className="text-on-surface-variant text-xs font-bold uppercase">Coût</p>
                  <p className="font-headline font-black text-2xl text-primary">
                    {formatCost(campaign.estimatedCost)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* View */}
                  <Link
                    to={`/campaigns/${campaign.id}`}
                    className="p-2 hover:bg-surface-container-high rounded-lg transition-all"
                    title="Voir"
                  >
                    <span className="material-symbols-outlined">visibility</span>
                  </Link>

                  <Link
                    to={`/campaigns/${campaign.id}/edit`}
                    className="p-2 hover:bg-surface-container-high rounded-lg transition-all"
                    title="Modifier"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </Link>

                  {/* Duplicate */}
                  <button
                    onClick={async () => {
                      const duplicated = await duplicateCampaign(campaign);
                      toast.success('Campagne dupliquée');
                      navigate(`/campaigns/${duplicated.id}/edit`);
                    }}
                    className="p-2 hover:bg-surface-container-high rounded-lg transition-all"
                    title="Dupliquer"
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>

                  <button
                    onClick={() => setDeleteTarget(campaign)}
                    className="p-2 hover:bg-surface-container-high rounded-lg transition-all"
                    title="Supprimer"
                  >
                    <span className="material-symbols-outlined text-error">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                className="rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
              >
                Confirmer
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default CampaignListDashboard;
