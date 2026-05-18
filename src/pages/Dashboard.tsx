import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppMetrics } from '@/hooks/useAppMetrics';
import { contactsApi } from '@/api/contacts';
import type { SegmentWithContacts } from '@/features/contacts/types/contact';
import { BarChart3, Zap, TrendingUp, Users } from 'lucide-react';
import WelcomeChecklist from '@/components/WelcomeChecklist';

export default function Dashboard() {
  const { user, isFirstLogin } = useAuthStore();
  const { contactsTotal, credits } = useAppMetrics();
  const [segments, setSegments] = useState<SegmentWithContacts[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);

  const formatSegmentFormula = (criteria: SegmentWithContacts['criteria']) => {
    const payload = criteria as { logic?: string; rules?: Array<{ field?: string; operator?: string; value?: unknown }> };
    const logic = payload?.logic === 'OR' ? 'OU' : 'ET';
    const rules = Array.isArray(payload?.rules) ? payload.rules : [];
    if (rules.length === 0) return 'Aucune condition';

    const fieldLabels: Record<string, string> = {
      tag: 'Tag',
      status: 'Statut',
      email: 'Email',
      phone: 'Téléphone',
      firstName: 'Prénom',
      lastName: 'Nom',
      location: 'Localisation',
      createdAt: 'Date création',
      lastPurchaseDate: 'Dernier achat',
    };

    const operatorLabels: Record<string, string> = {
      equals: 'égal à',
      contains: 'contient',
      gt: '>',
      lt: '<',
      gte: '>=',
      lte: '<=',
      in: 'dans',
      notIn: 'pas dans',
      notEquals: 'différent de',
    };

    const parts = rules.map((rule) => {
      const field = fieldLabels[rule.field || ''] || 'Champ';
      const operator = operatorLabels[rule.operator || ''] || 'contient';
      const value = Array.isArray(rule.value) ? rule.value.join(', ') : String(rule.value ?? '').trim();
      return `${field} ${operator} ${value || '-'}`;
    });

    return `${logic}: ${parts.join(` ${logic} `)}`;
  };

  useEffect(() => {
    let mounted = true;
    const loadSegments = async () => {
      setSegmentsLoading(true);
      try {
        const data = await contactsApi.listSegmentsWithContacts();
        if (mounted) setSegments(data);
      } catch {
        if (mounted) setSegments([]);
      } finally {
        if (mounted) setSegmentsLoading(false);
      }
    };
    loadSegments();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome Checklist - Visible only during onboarding */}
      {isFirstLogin && <WelcomeChecklist />}

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant text-sm font-medium mb-2">Messages envoyés</p>
              <p className="text-2xl font-bold text-on-surface">0</p>
              <p className="text-xs text-on-surface-variant mt-1">Ce mois</p>
            </div>
            <Zap className="w-10 h-10 text-primary opacity-20" />
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant text-sm font-medium mb-2">Taux d'ouverture</p>
              <p className="text-2xl font-bold text-on-surface">-</p>
              <p className="text-xs text-on-surface-variant mt-1">Moyenne</p>
            </div>
            <TrendingUp className="w-10 h-10 text-primary opacity-20" />
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant text-sm font-medium mb-2">Contacts</p>
              <p className="text-2xl font-bold text-on-surface">
                {contactsTotal.toLocaleString('fr-FR')}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">Base totale</p>
            </div>
            <Users className="w-10 h-10 text-primary opacity-20" />
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant text-sm font-medium mb-2">
                Crédits disponibles
              </p>
              <p className="text-2xl font-bold text-primary">
                {credits == null ? '--' : credits.toLocaleString('fr-FR')}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">FCFA</p>
            </div>
            <BarChart3 className="w-10 h-10 text-primary opacity-20" />
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary-container rounded-xl shadow-sm p-8 border border-outline-variant/30 mb-8">
        <h1 className="text-3xl font-bold text-on-primary mb-2">
          Bienvenue, {user?.name || 'Marchand'}! 👋
        </h1>
        <p className="text-on-primary/80 mb-6">
          Commencez à créer vos campagnes marketing dès maintenant et atteignez vos clients sur tous
          les canaux.
        </p>
        <div className="flex gap-4 flex-wrap">
          <button className="px-6 py-3 bg-on-primary text-primary font-semibold rounded-lg hover:shadow-lg transition-all hover:scale-105">
            ➕ Nouvelle campagne
          </button>
          <button className="px-6 py-3 bg-on-primary/20 text-on-primary font-semibold rounded-lg hover:bg-on-primary/30 transition-all">
            📚 Consulter la documentation
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30">
          <h2 className="text-lg font-bold text-on-surface mb-4">Campagnes récentes</h2>
          <div className="text-center py-8">
            <p className="text-on-surface-variant">Aucune campagne créée pour le moment.</p>
            <p className="text-sm text-on-surface-variant mt-2">
              Créez votre première campagne pour commencer!
            </p>
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30">
          <h2 className="text-lg font-bold text-on-surface mb-4">Segments</h2>
          {segmentsLoading ? (
            <div className="text-center py-8">
              <p className="text-on-surface-variant">Chargement des segments...</p>
            </div>
          ) : segments.length > 0 ? (
            <div className="space-y-3">
              {segments.map((segment) => (
                <details key={segment.id} className="group rounded-lg border border-outline-variant/40 bg-background/50">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-on-surface">
                    <div className="flex flex-col">
                      <span>{segment.name || 'Sans nom'}</span>
                      <span className="text-xs font-normal text-on-surface-variant">
                        {formatSegmentFormula(segment.criteria)}
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      {segment.contactCount} contact{segment.contactCount > 1 ? 's' : ''}
                    </span>
                  </summary>
                  <div className="border-t border-outline-variant/40 px-4 py-3">
                    {segment.contacts.length > 0 ? (
                      <div className="space-y-2">
                        {segment.contacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="grid grid-cols-1 gap-1 text-xs text-on-surface-variant md:grid-cols-3"
                          >
                            <span className="text-on-surface">
                              {(contact.firstName || '-') + ' ' + (contact.lastName || '-')}
                            </span>
                            <span>{contact.email || '-'}</span>
                            <span>{contact.phone || '-'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant">Aucun contact dans ce segment.</p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-on-surface-variant">Aucun segment créé pour le moment.</p>
              <p className="text-sm text-on-surface-variant mt-2">
                Créez des segments pour cibler vos audiences.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
