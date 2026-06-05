import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/api/axios';
import { toast } from 'sonner';
import i18n from '@/i18n/index';

const SETTINGS_KEY = 'novasms_settings';

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, unknown>;
  } catch {}
  return {};
}

function ToggleRow({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        background: 'var(--muted)',
        borderRadius: 8,
      }}
    >
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-1)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div
        className={`toggle ${checked ? 'on' : 'off'}`}
        onClick={() => onChange(!checked)}
        style={{ cursor: 'pointer' }}
      >
        <div className="toggle-knob" />
      </div>
    </div>
  );
}

export default function Settings() {
  const { logout } = useAuthStore();
  const saved = loadSettings();

  const [language, setLanguage] = useState<string>((saved.language as string) || 'Français');
  const [timezone, setTimezone] = useState<string>(
    (saved.timezone as string) || 'Africa/Abidjan (UTC+0)',
  );
  const [notifCampaigns, setNotifCampaigns] = useState<boolean>(saved.notifCampaigns !== false);
  const [notifCredits, setNotifCredits] = useState<boolean>(saved.notifCredits !== false);
  const [notifReports, setNotifReports] = useState<boolean>(saved.notifReports !== false);
  const [notifAutomations, setNotifAutomations] = useState<boolean>(
    saved.notifAutomations !== false,
  );
  const [alertThreshold, setAlertThreshold] = useState<string>(
    (saved.alertThreshold as string) || '',
  );
  const [apiVisible, setApiVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [balance, setBalance] = useState<{
    creditBalance: number;
    alertThreshold: number | null;
  } | null>(null);

  useEffect(() => {
    api
      .get<{ success: boolean; balance: number; alertThreshold: number | null }>('/account/balance')
      .then((res) => {
        setBalance({ creditBalance: res.data.balance, alertThreshold: res.data.alertThreshold });
        if (res.data.alertThreshold && !alertThreshold) {
          setAlertThreshold(String(res.data.alertThreshold));
        }
      })
      .catch(() => {});

    // Charger les préférences de notification depuis le backend
    api
      .get<{
        success: boolean;
        prefs: { emailOnCampaignDone: boolean; emailOnLowCredits: boolean };
      }>('/account/notification-prefs')
      .then((res) => {
        if (res.data?.prefs) {
          setNotifCampaigns(res.data.prefs.emailOnCampaignDone);
          setNotifCredits(res.data.prefs.emailOnLowCredits);
        }
      })
      .catch(() => {});
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    // Appliquer immédiatement le changement de langue dans l'app
    void i18n.changeLanguage(lang === 'Français' ? 'fr' : 'en');
  };

  const handleSave = async () => {
    setSaving(true);
    const prefs = {
      language,
      timezone,
      notifCampaigns,
      notifCredits,
      notifReports,
      notifAutomations,
      alertThreshold,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(prefs));
    try {
      await Promise.all([
        alertThreshold
          ? api.patch('/account/settings', { alertThreshold: Number(alertThreshold) })
          : Promise.resolve(),
        api.patch('/account/notification-prefs', {
          emailOnCampaignDone: notifCampaigns,
          emailOnLowCredits: notifCredits,
        }),
      ]);
      toast.success('Préférences enregistrées');
    } catch {
      toast.success('Préférences enregistrées localement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content">
      {/* En-tête rapide */}
      <div className="card" style={{ padding: '13px 16px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div
              style={{
                width: 36,
                height: 36,
                background: '#e0edef',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 14 14"
                fill="none"
                stroke="#0c5460"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="7" cy="7" r="1.5" />
                <circle cx="7" cy="7" r="5" />
                <path d="M7 2v1M7 11v1M2 7H1M13 7h-1M3.5 3.5l.7.7M9.8 9.8l.7.7M3.5 10.5l.7-.7M9.8 4.2l.7-.7" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
                Paramètres
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-2)', marginTop: 2 }}>
                Préférences de l'espace de travail
              </div>
            </div>
          </div>
          {balance && (
            <div
              className="credits-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 12px',
                background: 'var(--muted)',
                borderRadius: 20,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="var(--brand-primary)"
                strokeWidth="1.4"
              >
                <circle cx="6" cy="6" r="5" />
                <path d="M4.5 6l1 1 2-2" />
              </svg>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-1)' }}>
                {Number(balance.creditBalance).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
        {/* Préférences générales */}
        <div className="card">
          <div className="card-title mb-12">Préférences générales</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6 }}>
                Langue de l'interface
              </div>
              <select
                className="input"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="Français">Français</option>
                <option value="English">English</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6 }}>
                Fuseau horaire
              </div>
              <select
                className="input"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="Africa/Abidjan (UTC+0)">Africa/Abidjan (UTC+0)</option>
                <option value="Africa/Lagos (UTC+1)">Africa/Lagos (UTC+1)</option>
                <option value="Africa/Nairobi (UTC+3)">Africa/Nairobi (UTC+3)</option>
                <option value="Europe/Paris (UTC+1)">Europe/Paris (UTC+1)</option>
                <option value="America/New_York (UTC-5)">America/New_York (UTC-5)</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6 }}>
                Seuil d'alerte crédits faibles (FCFA)
              </div>
              <input
                type="number"
                min={0}
                className="input"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                placeholder="ex: 5 000"
              />
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 4 }}>
                Notification email quand le solde passe sous ce seuil
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-title mb-12">Notifications par email</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ToggleRow
              label="Campagnes envoyées"
              sub="Email à chaque envoi de campagne terminé"
              checked={notifCampaigns}
              onChange={setNotifCampaigns}
            />
            <ToggleRow
              label="Alertes crédits faibles"
              sub={
                alertThreshold
                  ? `Sous ${Number(alertThreshold).toLocaleString('fr-FR')} FCFA`
                  : "Définir un seuil d'alerte"
              }
              checked={notifCredits}
              onChange={setNotifCredits}
            />
            <ToggleRow
              label="Rapports hebdomadaires"
              sub="Résumé des performances chaque lundi"
              checked={notifReports}
              onChange={setNotifReports}
            />
            <ToggleRow
              label="Automatisations"
              sub="Alertes d'exécution et d'erreur"
              checked={notifAutomations}
              onChange={setNotifAutomations}
            />
          </div>
        </div>

        {/* API Keys */}
        <div className="card">
          <div className="flex items-center justify-between mb-12">
            <div className="card-title">Clés API</div>
            <span className="chip">Bientôt disponible</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                padding: '16px',
                background: 'var(--muted)',
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>🔑</div>
              <div
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}
              >
                Accès API REST — Bientôt disponible
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
                Générez des clés API pour intégrer NovaSMS dans vos applications. Cette
                fonctionnalité sera disponible prochainement.
              </div>
            </div>
            <div
              style={{
                padding: '10px 14px',
                background: '#fffbeb',
                border: '0.5px solid #fcd34d',
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 11, color: '#92400e' }}>
                ⚠️ Les clés API donnent un accès programmatique complet à votre compte. Elles seront
                générées de façon sécurisée.
              </div>
            </div>
          </div>
        </div>

        {/* Compte & données */}
        <div className="card">
          <div className="card-title mb-12">Données & confidentialité</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '12px 14px', background: 'var(--muted)', borderRadius: 8 }}>
              <div
                style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-1)', marginBottom: 4 }}
              >
                Exporter mes données
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 8 }}>
                Téléchargez l'ensemble de vos données (contacts, campagnes, analytics) au format
                JSON/CSV.
              </div>
              <button
                className="btn-sm"
                onClick={() => {
                  toast.info("Préparation de l'export…");
                  api
                    .get('/account/export', { responseType: 'blob' })
                    .then((res) => {
                      const url = URL.createObjectURL(res.data as Blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `novasms-export-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('Export téléchargé');
                    })
                    .catch(() => toast.error("Erreur lors de l'export"));
                }}
              >
                Demander l'export
              </button>
            </div>
            <div style={{ padding: '12px 14px', background: 'var(--muted)', borderRadius: 8 }}>
              <div
                style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-1)', marginBottom: 4 }}
              >
                Conformité RGPD
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 8 }}>
                NovaSMS est conforme au Règlement Général sur la Protection des Données. Vos données
                sont hébergées en Europe.
              </div>
              <span className="tag green">Conforme RGPD</span>
            </div>
            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: '#feecec',
                color: '#7f1d1d',
                border: '1px solid #f5c2c2',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12.5,
                fontWeight: 500,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M5 7h8" />
              </svg>
              Se déconnecter
            </button>
          </div>
        </div>
      </div>

      {/* Bouton enregistrer */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div className="flex items-center justify-between">
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
            Les modifications sont enregistrées sur votre navigateur et synchronisées avec le
            serveur.
          </div>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer les préférences'}
          </button>
        </div>
      </div>
    </div>
  );
}
