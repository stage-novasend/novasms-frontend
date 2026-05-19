import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useContactDetail from '../hooks/useContactDetail';
import Timeline from '../components/Timeline';
import { contactsApi } from '@/api/contacts';

type ContactNote = {
  id: string;
  content: string;
  createdAt: string;
};

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useContactDetail(id);
  const [activeTab, setActiveTab] = useState<'history' | 'notes'>('history');
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    tags: '',
  });
  const [noteValue, setNoteValue] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'optout' | 'delete' | 'export' | null>(null);

  if (loading) return <div className="p-6">Chargement…</div>;
  if (error) return <div className="p-6 text-error">{error}</div>;
  if (!data) return <div className="p-6">Contact non trouvé.</div>;

  const contact = data;

  const notes = Array.isArray(contact.notes) ? contact.notes : [];

  const startEdit = () => {
    setFormValues({
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      location: contact.location || '',
      tags: Array.isArray(contact.tags) ? contact.tags.join(', ') : '',
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setActionError(null);
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    setActionError(null);
    setSavingEdit(true);
    try {
      const tags = formValues.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      await contactsApi.update(id, {
        firstName: formValues.firstName.trim() || undefined,
        lastName: formValues.lastName.trim() || undefined,
        email: formValues.email.trim() || undefined,
        phone: formValues.phone.trim() || undefined,
        location: formValues.location.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      await refresh();
      setIsEditing(false);
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : null;
      setActionError(message || 'Erreur de mise à jour');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSaveNote = async () => {
    const note = noteValue.trim();
    if (!id || !note) return;

    setSavingNote(true);
    setNoteError(null);
    try {
      await contactsApi.addNote(id, note);
      setNoteValue('');
      await refresh();
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : null;
      setNoteError(message || 'Erreur de sauvegarde');
    } finally {
      setSavingNote(false);
    }
  };

  const handleOptOut = async () => {
    if (!id) return;
    setActionError(null);
    setActionLoading('optout');
    try {
      console.log('📤 Désabonnement du contact:', id);
      await contactsApi.optOut(id);
      console.log('✅ Contact désabonné avec succès');
      await refresh();
    } catch (err: unknown) {
      console.error('❌ Erreur désabonnement:', err);
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : null;
      setActionError(message || 'Erreur de désabonnement');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm('Confirmer la suppression RGPD de ce contact ?');
    if (!confirmed) return;

    setActionError(null);
    setActionLoading('delete');
    try {
      console.log('🗑️  Suppression du contact:', id);
      await contactsApi.delete(id);
      console.log('✅ Contact supprimé avec succès');
      navigate('/contacts');
    } catch (err: unknown) {
      console.error('❌ Erreur suppression:', err);
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : null;
      setActionError(message || 'Erreur de suppression');
      setActionLoading(null);
    }
  };

  const handleExport = async () => {
    if (!id) return;
    setActionError(null);
    setActionLoading('export');
    try {
      console.log('📥 Export du contact:', id);
      const blob = await contactsApi.exportById(id, 'csv');
      console.log('✅ Blob créé, taille:', blob.size);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contact-${id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      console.log('✅ Fichier téléchargé');
    } catch (err: unknown) {
      console.error('❌ Erreur export:', err);
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : null;
      setActionError(message || 'Erreur d\'export');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6">
      <button onClick={() => navigate('/contacts')} className="mb-4 text-sm text-on-surface-variant">← Retour</button>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center text-xl font-bold">{(contact.firstName || contact.email || 'N').charAt(0)}</div>
            <div>
              <div className="text-lg font-semibold">{contact.firstName || contact.email}</div>
              <div className="text-sm text-on-surface-variant">{contact.email}</div>
            </div>
          </div>
          <div className="text-sm text-right">
            <div className="text-sm">
              Statut: <span className="font-medium">{contact.optOut ? 'Inactif' : 'Actif'}</span>
            </div>
            <div className="text-sm text-on-surface-variant">Ajouté le {new Date(contact.createdAt).toLocaleDateString()}</div>
            <div className="mt-3 flex items-center gap-2 justify-end">
              {isEditing ? (
                <>
                  <button
                    className="px-3 py-1.5 rounded-lg border text-sm"
                    onClick={cancelEdit}
                    disabled={savingEdit}
                  >
                    Annuler
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm disabled:opacity-50"
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                  >
                    {savingEdit ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </>
              ) : (
                <button
                  className="px-3 py-1.5 rounded-lg border text-sm"
                  onClick={startEdit}
                >
                  Modifier
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Infos</h4>
            {isEditing ? (
              <div className="space-y-2">
                <input
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm"
                  placeholder="Prénom"
                  value={formValues.firstName}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, firstName: e.target.value }))}
                />
                <input
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm"
                  placeholder="Nom"
                  value={formValues.lastName}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, lastName: e.target.value }))}
                />
                <input
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm"
                  placeholder="Email"
                  value={formValues.email}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, email: e.target.value }))}
                />
                <input
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm"
                  placeholder="Téléphone"
                  value={formValues.phone}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, phone: e.target.value }))}
                />
                <input
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm"
                  placeholder="Localisation"
                  value={formValues.location}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, location: e.target.value }))}
                />
              </div>
            ) : (
              <>
                <div className="text-sm">Email: <span className="font-medium">{contact.email || '—'}</span></div>
                <div className="text-sm">Téléphone: <span className="font-medium">{contact.phone || '—'}</span></div>
                <div className="text-sm">Localisation: <span className="font-medium">{contact.location || '—'}</span></div>
              </>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Tags</h4>
            {isEditing ? (
              <input
                className="w-full px-3 py-2 rounded-lg border border-outline-variant text-sm"
                placeholder="VIP, Clients fidèles, Abidjan"
                value={formValues.tags}
                onChange={(e) => setFormValues((prev) => ({ ...prev, tags: e.target.value }))}
              />
            ) : (
              <div className="flex gap-2 flex-wrap">
                {(contact.tags || []).length === 0 ? (
                  <span className="text-sm text-on-surface-variant">Aucun tag</span>
                ) : (
                  (contact.tags || []).map((t: string) => (
                    <span key={t} className="px-2 py-1 text-xs bg-surface rounded-md">{t}</span>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="border-b border-outline-variant">
            <nav className="flex gap-4">
              <button onClick={() => setActiveTab('history')} className={`py-2 ${activeTab === 'history' ? 'border-b-2 border-primary' : ''}`}>
                Historique campagnes
              </button>
              <button onClick={() => setActiveTab('notes')} className={`py-2 ${activeTab === 'notes' ? 'border-b-2 border-primary' : ''}`}>
                Notes
              </button>
            </nav>
          </div>

          <div className="mt-4">
            {activeTab === 'history' ? (
              <Timeline events={contact.history || []} />
            ) : (
              <div>
                <textarea
                  className="w-full min-h-[120px] p-3 border rounded-md"
                  placeholder="Ajouter une note…"
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                />
                <div className="mt-3 flex items-center gap-3">
                  <button
                    className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
                    disabled={savingNote || !noteValue.trim()}
                    onClick={handleSaveNote}
                  >
                    {savingNote ? 'Enregistrement…' : 'Enregistrer la note'}
                  </button>
                  {noteError ? <span className="text-sm text-error">{noteError}</span> : null}
                </div>

                <div className="mt-4 space-y-2">
                  {notes.length === 0 ? (
                    <div className="text-sm text-on-surface-variant">Aucune note pour ce contact.</div>
                  ) : (
                    notes.map((note: ContactNote) => (
                      <div key={note.id} className="p-3 border rounded-md bg-surface">
                        <div className="text-sm">{note.content}</div>
                        <div className="text-xs text-on-surface-variant mt-1">
                          {new Date(note.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <button
              className="px-4 py-2 rounded-lg border disabled:opacity-50"
              onClick={handleOptOut}
              disabled={actionLoading !== null || isEditing}
            >
              {actionLoading === 'optout' ? 'Désabonnement…' : 'Désabonner'}
            </button>
            <button
              className="px-4 py-2 rounded-lg border text-error disabled:opacity-50"
              onClick={handleDelete}
              disabled={actionLoading !== null || isEditing}
            >
              {actionLoading === 'delete' ? 'Suppression…' : 'Supprimer'}
            </button>
            <button
              className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
              onClick={handleExport}
              disabled={actionLoading !== null || isEditing}
            >
              {actionLoading === 'export' ? 'Export…' : 'Exporter'}
            </button>
          </div>
          {actionError ? <div className="mt-3 text-sm text-error">{actionError}</div> : null}
        </div>
      </div>
    </div>
  );
}
