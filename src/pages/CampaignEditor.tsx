import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';

export default function CampaignEditor() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [name, setName] = useState('');
  const [channelType, setChannelType] = useState<'email' | 'sms'>('email');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        name: name || undefined,
        channelType,
        subject: subject || undefined,
        content: content || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        status: 'draft',
      };

      // If editing existing campaign we could call PATCH; for now POST will create
      await api.post('/campaigns', payload);
      navigate('/campaigns');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">{id ? 'Modifier la campagne' : 'Nouvelle campagne'}</h2>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 max-w-3xl">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 input" placeholder="Nom de la campagne" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Canal</label>
          <select value={channelType} onChange={(e) => setChannelType(e.target.value as any)} className="mt-1 input">
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        {channelType === 'email' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Objet</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 input" placeholder="Objet de l'email" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Contenu</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} className="mt-1 textarea" rows={8} placeholder={channelType === 'sms' ? 'Texte SMS (160 caractères max).' : 'Contenu HTML ou texte.'} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Planifié le</label>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-1 input" />
        </div>

        {error && <div className="text-red-600">{error}</div>}

        <div className="flex items-center gap-2">
          <button disabled={loading} className="btn-primary" type="submit">{loading ? 'Enregistrement...' : 'Enregistrer (Brouillon)'}</button>
          <button type="button" className="btn-outline" onClick={() => navigate('/campaigns')}>Annuler</button>
        </div>
      </form>

      <div className="mt-6">
        <small className="text-muted">Maquette disponible dans le dossier MAQUETTE — l'éditeur drag & drop sera intégré ensuite.</small>
      </div>
    </div>
  );
}
