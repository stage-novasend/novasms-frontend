import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import CampaignBlocksEditor from '../components/CampaignBlocksEditor';

export default function CampaignEditor() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [name, setName] = useState('');
  const [channelType, setChannelType] = useState<'email' | 'sms'>('email');
  const [subject, setSubject] = useState('');
  const [blocks, setBlocks] = useState<Array<{ id: string; type: string; content?: string }>>([]);
  const [smsContent, setSmsContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: {
        name?: string;
        channelType: 'email' | 'sms';
        subject?: string;
        content?: string | undefined | null;
        scheduledAt?: string | null;
        status: string;
      } = {
        name: name || undefined,
        channelType,
        subject: subject || undefined,
        content:
          channelType === 'email'
            ? blocks.length
              ? JSON.stringify(blocks)
              : undefined
            : smsContent || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        status: 'draft',
      };

      // If editing existing campaign we could call PATCH; for now POST will create
      await api.post('/campaigns', payload);
      navigate('/campaigns');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">{id ? 'Modifier la campagne' : 'Nouvelle campagne'}</h2>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 input"
            placeholder="Nom de la campagne"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Canal</label>
          <select
            value={channelType}
            onChange={(e) => setChannelType(e.target.value as 'email' | 'sms')}
            className="mt-1 input"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        {channelType === 'email' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Objet</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 input"
              placeholder="Objet de l'email"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Contenu</label>
          {/* Editor drag & drop / SMS field */}
          <div className="mt-2">
            {channelType === 'email' ? (
              <CampaignBlocksEditor value={blocks} onChange={(newBlocks) => setBlocks(newBlocks)} />
            ) : (
              <div>
                <textarea
                  value={smsContent}
                  onChange={(e) => setSmsContent(e.target.value)}
                  className="mt-1 textarea"
                  rows={4}
                  placeholder="Texte SMS (160 caractères max)."
                />
                <div className="text-sm text-muted mt-1">
                  {smsContent.length} caractères — {Math.max(1, Math.ceil(smsContent.length / 160))}{' '}
                  SMS
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Planifié le</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-1 input"
          />
        </div>

        {error && <div className="text-red-600">{error}</div>}

        <div className="flex items-center gap-2">
          <button disabled={loading} className="btn-primary" type="submit">
            {loading ? 'Enregistrement...' : 'Enregistrer (Brouillon)'}
          </button>
          <button type="button" className="btn-outline" onClick={() => navigate('/campaigns')}>
            Annuler
          </button>
        </div>
      </form>

      <div className="mt-6">
        <small className="text-muted">
          Maquette disponible dans le dossier MAQUETTE — l'éditeur drag & drop sera intégré ensuite.
        </small>
      </div>
    </div>
  );
}
