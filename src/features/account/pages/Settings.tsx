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
  } catch {
    // localStorage corrompu
  }
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

interface BalanceData {
  creditBalance: number;
  alertThreshold: number | null;
  creditLimit: number | null;
  language: string;
  timezone: string;
}

export default function Settings() {
  const { logout } = useAuthStore();
  const saved = loadSettings();

  const [language, setLanguage] = useState<string>((saved.language as string) || 'fr');
  const [timezone, setTimezone] = useState<string>((saved.timezone as string) || 'Africa/Abidjan');
  const [notifCampaigns, setNotifCampaigns] = useState<boolean>(saved.notifCampaigns !== false);
  const [notifCredits, setNotifCredits] = useState<boolean>(saved.notifCredits !== false);
  const [notifReports, setNotifReports] = useState<boolean>(saved.notifReports !== false);
  const [notifAutomations, setNotifAutomations] = useState<boolean>(
    saved.notifAutomations !== false,
  );
  const [alertThreshold, setAlertThreshold] = useState<string>(
    (saved.alertThreshold as string) || '',
  );
  const [creditLimitInput, setCreditLimitInput] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [balance, setBalance] = useState<BalanceData | null>(null);

  useEffect(() => {
    const fetchBalance = () => {
      api
        .get<{
          success: boolean;
          balance: number;
          alertThreshold: number | null;
          creditLimit: number | null;
          language: string;
          timezone: string;
        }>('/account/balance')
        .then((res) => {
          setBalance({
            creditBalance: res.data.balance,
            alertThreshold: res.data.alertThreshold,
            creditLimit: res.data.creditLimit ?? null,
            language: res.data.language ?? 'fr',
            timezone: res.data.timezone ?? 'Africa/Abidjan',
          });
          // Toujours utiliser les valeurs DB comme source de vérité
          if (res.data.alertThreshold != null) {
            setAlertThreshold(String(res.data.alertThreshold));
          }
          if (res.data.creditLimit != null) {
            setCreditLimitInput(String(res.data.creditLimit));
          }
          if (res.data.language) {
            setLanguage(res.data.language);
          }
          if (res.data.timezone) {
            setTimezone(res.data.timezone);
          }
        })
        .catch(() => {});
    };

    fetchBalance();

    // Charger les préférences de notification depuis le backend
    api
      .get<{
        success: boolean;
        prefs: {
          emailOnCampaignDone: boolean;
          emailOnLowCredits: boolean;
          weeklyReportEmail: boolean;
          automationAlertsEmail: boolean;
        };
      }>('/account/notification-prefs')
      .then((res) => {
        if (res.data?.prefs) {
          setNotifCampaigns(res.data.prefs.emailOnCampaignDone);
          setNotifCredits(res.data.prefs.emailOnLowCredits);
          setNotifReports(res.data.prefs.weeklyReportEmail ?? true);
          setNotifAutomations(res.data.prefs.automationAlertsEmail ?? true);
        }
      })
      .catch(() => {});

    window.addEventListener('novasms:balance-refresh', fetchBalance);
    return () => window.removeEventListener('novasms:balance-refresh', fetchBalance);
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    // lang est 'fr' ou 'en' (valeurs du select)
    void i18n.changeLanguage(lang === 'fr' ? 'fr' : 'en');
  };

  const handleSave = async () => {
    const parsedCreditLimit = creditLimitInput ? Number(creditLimitInput) : null;

    if (parsedCreditLimit !== null && balance) {
      if (parsedCreditLimit > balance.creditBalance) {
        toast.error(
          `La limite d'utilisation (${parsedCreditLimit.toLocaleString('fr-FR')} FCFA) ne peut pas dépasser le solde actuel (${balance.creditBalance.toLocaleString('fr-FR')} FCFA)`,
        );
        return;
      }
      if (parsedCreditLimit < 0) {
        toast.error("La limite d'utilisation doit être positive");
        return;
      }
    }

    setSaving(true);

    // Persister dans localStorage
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
      const settingsPayload: Record<string, unknown> = {
        language, // déjà 'fr' ou 'en'
        timezone,
      };
      if (alertThreshold) settingsPayload['alertThreshold'] = Number(alertThreshold);
      if (parsedCreditLimit !== null) settingsPayload['creditLimit'] = parsedCreditLimit;

      await Promise.all([
        api.patch('/account/settings', settingsPayload),
        api.patch('/account/notification-prefs', {
          emailOnCampaignDone: notifCampaigns,
          emailOnLowCredits: notifCredits,
          weeklyReportEmail: notifReports,
          automationAlertsEmail: notifAutomations,
        }),
      ]);

      // Rafraîchir la jauge header + sidebar immédiatement
      window.dispatchEvent(new Event('novasms:balance-refresh'));

      toast.success('Préférences enregistrées');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg) {
        toast.error(msg);
      } else {
        toast.success('Préférences enregistrées localement');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content">
      {/* En-tête */}
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
          {balance &&
            (() => {
              const bMax =
                balance.creditLimit && balance.creditLimit > 0
                  ? balance.creditLimit
                  : balance.alertThreshold && balance.alertThreshold > 0
                    ? balance.alertThreshold * 3
                    : null;
              const bPct =
                bMax != null
                  ? Math.min(100, Math.round((Number(balance.creditBalance) / bMax) * 100))
                  : 0;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div
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
                  {bMax != null && (
                    <div style={{ minWidth: 140 }}>
                      <div
                        style={{
                          width: '100%',
                          height: 5,
                          borderRadius: 999,
                          background: 'var(--border)',
                        }}
                      >
                        <div
                          style={{
                            width: `${bPct}%`,
                            height: '100%',
                            borderRadius: 999,
                            background:
                              bPct < 20
                                ? 'var(--color-error, #ef4444)'
                                : bPct < 50
                                  ? '#f59e0b'
                                  : 'var(--brand-gradient)',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        {bPct}% · Alerte sous{' '}
                        {(balance.alertThreshold ?? 100000).toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
          gap: 12,
        }}
      >
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
                <option value="fr">Français</option>
                <option value="en">English</option>
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
                <optgroup label="Afrique">
                  <option value="Africa/Abidjan">Africa/Abidjan (UTC+0)</option>
                  <option value="Africa/Lagos">Africa/Lagos (UTC+1)</option>
                  <option value="Africa/Douala">Africa/Douala (UTC+1)</option>
                  <option value="Africa/Dakar">Africa/Dakar (UTC+0)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (UTC+3)</option>
                  <option value="Africa/Johannesburg">Africa/Johannesburg (UTC+2)</option>
                </optgroup>
                <optgroup label="Europe">
                  <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                  <option value="Europe/London">Europe/London (UTC+0)</option>
                </optgroup>
                <optgroup label="Amérique">
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                  <option value="America/Chicago">America/Chicago (UTC-6)</option>
                </optgroup>
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
                placeholder="ex: 100 000"
              />
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 4 }}>
                Notification email quand le solde passe sous ce seuil
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6 }}>
                Limite d'utilisation (FCFA)
              </div>
              <input
                type="number"
                min={0}
                max={balance?.creditBalance ?? undefined}
                className="input"
                value={creditLimitInput}
                onChange={(e) => setCreditLimitInput(e.target.value)}
                placeholder="ex: 50 000"
              />
              <div
                style={{
                  fontSize: 10.5,
                  color:
                    creditLimitInput && balance && Number(creditLimitInput) > balance.creditBalance
                      ? 'var(--color-error, #ef4444)'
                      : 'var(--text-3)',
                  marginTop: 4,
                }}
              >
                Jauge de crédit basée sur cette limite · doit être ≤ solde actuel
                {balance ? ` (${balance.creditBalance.toLocaleString('fr-FR')} FCFA)` : ''}
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

        {/* API Keys — bientôt disponible */}
        <div className="card" style={{ opacity: 0.8 }}>
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

        {/* Données & confidentialité */}
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
