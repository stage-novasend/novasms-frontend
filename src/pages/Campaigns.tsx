import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

interface Campaign {
  id: string;
  name?: string;
  subject?: string;
  channelType?: string;
  scheduledAt?: string | null;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await api.get('/campaigns');
      setCampaigns(res.data.data || []);
    })();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Campagnes</h2>
        <Link to="/campaigns/new" className="btn-primary">
          + Nouvelle campagne
        </Link>
      </div>
      <div className="space-y-4">
        {campaigns.map((c) => (
          <div key={c.id} className="card flex items-center justify-between">
            <div>
              <div className="font-semibold">{c.name || c.subject || 'Campagne'}</div>
              <div className="text-xs text-muted">
                {c.channelType} ·{' '}
                {c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : 'Non planifiée'}
              </div>
            </div>
            <div>
              <Link to={`/campaigns/${c.id}`} className="btn-outline">
                Voir
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
