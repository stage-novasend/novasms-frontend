import type { FC } from 'react';
import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    isLoading,
    error,
  } = useCampaignStore();
  const { duplicateCampaign } = useCampaignActions();

  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'SMS' | 'EMAIL'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'cost'>('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    try {
      await deleteCampaign(id);
      setDeleteConfirm(null);
    } catch (error) {
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

                  {/* Edit (only for draft) */}
                  {campaign.status === 'draft' && (
                    <Link
                      to={`/campaigns/${campaign.id}/edit`}
                      className="p-2 hover:bg-surface-container-high rounded-lg transition-all"
                      title="Modifier"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </Link>
                  )}

                  {/* Duplicate */}
                  <button
                    onClick={async () => {
                      await duplicateCampaign(campaign);
                      navigate('/campaigns/new');
                    }}
                    className="p-2 hover:bg-surface-container-high rounded-lg transition-all"
                    title="Dupliquer"
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>

                  {/* Delete */}
                  {deleteConfirm === campaign.id ? (
                    <div className="absolute right-4 bg-surface-container rounded-lg shadow-lg p-3 flex gap-2">
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        disabled={isLoading}
                        className="px-3 py-1 bg-error text-on-primary text-xs font-bold rounded disabled:opacity-50"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1 bg-outline/20 text-on-surface text-xs font-bold rounded"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(campaign.id)}
                      className="p-2 hover:bg-surface-container-high rounded-lg transition-all"
                      title="Supprimer"
                    >
                      <span className="material-symbols-outlined text-error">delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignListDashboard;
