import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useAuthStore } from '@/stores/authStore';

interface TwoFactorState {
  isEnabled: boolean;
  method: 'totp' | 'sms' | null;
  secret?: string;
  otpauthUrl?: string;
  qrCodeDataUrl?: string;
  backupCodes?: string[];
}

export default function Security() {
  const { user } = useAuthStore();
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>({
    isEnabled: false,
    method: null,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [totpInputs, setTotpInputs] = useState(['', '', '', '', '', '']);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const renderQrCode = async () => {
      if (twoFactorState.method !== 'totp' || !twoFactorState.otpauthUrl) return;

      const canvas = qrCanvasRef.current;
      if (!canvas) return;

      try {
        await QRCode.toCanvas(canvas, twoFactorState.otpauthUrl, {
          width: 200,
          margin: 1,
          color: {
            dark: '#0C5460',
            light: '#FFFFFF',
          },
        });
      } catch {
        setMessage({
          type: 'error',
          text: "Impossible d'afficher le QR code. Utilisez la clé manuelle.",
        });
      }
    };

    renderQrCode();
  }, [twoFactorState.method, twoFactorState.otpauthUrl]);

  const api = async (path: string, method = 'GET', body?: Record<string, unknown>) => {
    const { accessToken } = useAuthStore.getState();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/${path}`,
      {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      },
    );

    return response.json();
  };

  // Load current account 2FA state on mount
  useEffect(() => {
    const loadAccount = async () => {
      if (!user?.id) return;
      try {
        const res = await api('me', 'GET');
        if (res?.success && res.account) {
          setTwoFactorState((prev) => ({
            ...prev,
            isEnabled: !!res.account.twoFactorEnabled,
            backupCodes: res.account.backupCodes || undefined,
          }));
        } else if (res && res.message) {
          setMessage({ type: 'error', text: res.message });
        }
      } catch {
        setMessage({ type: 'error', text: "Impossible de récupérer l'état du compte." });
      }
    };

    loadAccount();
  }, [user?.id]);

  // Generate TOTP Secret & QR Code
  const handleGenerateTOTP = async () => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Erreur: ID utilisateur non trouvé.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await api('generate-2fa-secret', 'POST', { accountId: user.id });
      if (res.success && res.otpauth_url) {
        setTwoFactorState({
          isEnabled: false,
          method: 'totp',
          secret: res.secret,
          otpauthUrl: res.otpauth_url,
        });
        setMessage({
          type: 'success',
          text: "Secret TOTP généré. Scannez le QR code avec votre appli d'authentification.",
        });
      } else {
        setMessage({ type: 'error', text: res.message || 'Erreur lors de la génération.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur.' });
    } finally {
      setLoading(false);
    }
  };

  // Verify TOTP Code & Enable 2FA
  const handleVerifyAndEnableTOTP = async () => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Erreur: ID utilisateur non trouvé.' });
      return;
    }

    const code = totpInputs.join('');
    if (code.length !== 6) {
      setMessage({ type: 'error', text: 'Veuillez entrer les 6 chiffres.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await api('enable-2fa', 'POST', { accountId: user.id, code });
      if (res.success) {
        setTwoFactorState((prev) => ({
          ...prev,
          isEnabled: true,
          backupCodes: res.backup_codes,
        }));
        setTotpInputs(['', '', '', '', '', '']);
        setMessage({
          type: 'success',
          text: '✅ 2FA TOTP activée avec succès! Conservez vos codes de secours.',
        });
      } else {
        setMessage({ type: 'error', text: res.message || 'Code invalide.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la vérification.' });
    } finally {
      setLoading(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Erreur: ID utilisateur non trouvé.' });
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir désactiver la double authentification?')) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await api('disable-2fa', 'POST', { accountId: user.id });
      if (res.success) {
        setTwoFactorState({ isEnabled: false, method: null });
        setTotpInputs(['', '', '', '', '', '']);
        setMessage({ type: 'success', text: '2FA désactivée.' });
      } else {
        setMessage({ type: 'error', text: res.message || 'Erreur.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur de connexion.' });
    } finally {
      setLoading(false);
    }
  };

  // Copy backup codes to clipboard
  const handleCopyBackupCodes = () => {
    if (twoFactorState.backupCodes) {
      navigator.clipboard.writeText(twoFactorState.backupCodes.join('\n'));
      setMessage({ type: 'success', text: 'Codes de secours copiés!' });
    }
  };

  // Download backup codes
  const handleDownloadBackupCodes = () => {
    if (twoFactorState.backupCodes) {
      const text = twoFactorState.backupCodes.join('\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'novasms-backup-codes.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleTotpInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newInputs = [...totpInputs];
    newInputs[index] = value.slice(-1);
    setTotpInputs(newInputs);

    // Auto-focus next input
    if (value && index < 5) {
      const inputs = document.querySelectorAll('.totp-input');
      if (inputs[index + 1]) (inputs[index + 1] as HTMLInputElement).focus();
    }
  };

  return (
    <div className="content">
      <div className="max-w-6xl mx-auto px-8 py-10 space-y-8">
        {/* Header */}
        <div className="rounded-[28px] border border-outline-variant/20 bg-gradient-to-br from-white via-surface to-brand-light/40 p-8 shadow-[0_18px_50px_rgba(12,84,96,0.08)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Sécurité du compte
              </p>
              <h1 className="text-4xl font-black text-on-surface">Double authentification</h1>
              <p className="text-base text-on-surface-variant leading-7">
                Renforcez la protection de votre compte avec une validation par application
                d’authentification et des codes de secours.
              </p>
            </div>
            {twoFactorState.isEnabled ? (
              <button
                onClick={handleDisable2FA}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-2xl bg-secondary px-5 py-3 text-sm font-bold text-white transition hover:bg-secondary/90 disabled:opacity-60"
              >
                Désactiver la 2FA
              </button>
            ) : (
              <div className="rounded-2xl border border-primary/15 bg-white px-4 py-3 text-sm text-on-surface-variant shadow-sm">
                Protection actuellement inactive
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.45fr_0.95fr]">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Status Card */}
            <section className="rounded-[28px] border border-outline-variant/20 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary text-xl font-bold">
                    2FA
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">État de la protection</h3>
                    <p className="text-sm text-on-surface-variant">
                      {twoFactorState.isEnabled
                        ? 'La double authentification est active.'
                        : 'La double authentification est désactivée.'}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${twoFactorState.isEnabled ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}
                >
                  {twoFactorState.isEnabled ? 'Activée' : 'Inactive'}
                </span>
              </div>
            </section>

            {/* Method Selection */}
            {!twoFactorState.isEnabled && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-[24px] border border-primary/20 bg-gradient-to-br from-white to-brand-light/40 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-on-surface">
                        Application d’authentification
                      </h4>
                      <p className="text-sm text-on-surface-variant mt-1">
                        Méthode recommandée pour protéger votre compte avec des codes temporaires.
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                      Recommandé
                    </span>
                  </div>
                  <button
                    onClick={handleGenerateTOTP}
                    disabled={loading || twoFactorState.method === 'totp'}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-on-primary transition hover:brightness-110 disabled:opacity-60"
                  >
                    {loading ? 'Génération...' : 'Configurer maintenant'}
                  </button>
                </div>

                <div className="rounded-[24px] border border-outline-variant/20 bg-white p-6 opacity-70">
                  <h4 className="text-lg font-bold text-on-surface">SMS</h4>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Option non activée pour le moment. Elle pourra être proposée plus tard si
                    besoin.
                  </p>
                  <button
                    disabled
                    className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-outline-variant/40 px-4 py-3 text-sm font-bold text-on-surface-variant"
                  >
                    Bientôt disponible
                  </button>
                </div>
              </div>
            )}

            {/* TOTP Setup Wizard */}
            {twoFactorState.method === 'totp' && !twoFactorState.isEnabled && (
              <section className="rounded-[28px] border border-outline-variant/20 bg-white p-6 shadow-sm">
                <h3 className="mb-8 flex items-center gap-3 text-2xl font-bold text-on-surface">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-white font-bold">
                    1
                  </span>
                  Configuration de l’application
                </h3>

                <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                  {/* QR Code Section */}
                  <div className="space-y-6">
                    <div>
                      <h5 className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                        Étape 1 · Scanner le code
                      </h5>
                      <div className="inline-block rounded-2xl border border-outline-variant/20 bg-surface p-4">
                        <canvas ref={qrCanvasRef} width={200} height={200} className="block" />
                      </div>
                    </div>

                    {/* Manual Key */}
                    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                        Clé manuelle
                      </p>
                      <div className="flex flex-col gap-2 font-mono font-bold text-secondary sm:flex-row sm:items-center sm:justify-between">
                        <span className="break-all text-xs sm:text-sm tracking-[0.18em]">
                          {twoFactorState.secret || 'J3KZ L92M 88WQ PX44'}
                        </span>
                        <button className="rounded-xl border border-outline-variant/30 px-3 py-2 text-xs font-semibold text-secondary hover:border-primary/40 hover:text-primary">
                          Copier
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Verification Section */}
                  <div className="flex flex-col justify-center space-y-6">
                    <div>
                      <h5 className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                        Étape 2 · Vérifier le code
                      </h5>
                      <p className="mb-6 text-sm text-on-surface-variant">
                        Entrez les 6 chiffres affichés dans votre appli d'authentification.
                      </p>

                      {/* TOTP Input Fields */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {totpInputs.map((val, idx) => (
                          <input
                            key={idx}
                            type="text"
                            maxLength={1}
                            value={val}
                            onChange={(e) => handleTotpInputChange(idx, e.target.value)}
                            className="totp-input h-14 w-12 rounded-xl border border-outline-variant/30 bg-surface text-center text-2xl font-bold text-on-surface transition focus:border-primary focus:bg-white focus:outline-none"
                            inputMode="numeric"
                          />
                        ))}
                      </div>

                      <button
                        onClick={handleVerifyAndEnableTOTP}
                        disabled={loading || totpInputs.join('').length !== 6}
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-secondary px-4 py-3 font-bold text-white transition hover:bg-secondary/90 disabled:opacity-60"
                      >
                        {loading ? 'Vérification...' : 'Activer 2FA'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Message Display */}
            {message && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-primary/20 bg-primary/10 text-secondary' : 'border-red-200 bg-red-50 text-red-700'}`}
              >
                {message.text}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            {/* Backup Codes */}
            {twoFactorState.isEnabled && twoFactorState.backupCodes && (
              <section className="rounded-[24px] border border-outline-variant/20 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-bold text-on-surface">Codes de secours</h3>
                <p className="mb-4 text-sm text-on-surface-variant">
                  Conservez ces codes en lieu sûr. Ils vous permettront d'accéder à votre compte si
                  vous n'avez pas accès à votre appli 2FA.
                </p>

                <div className="mb-4 max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 font-mono text-sm">
                  {twoFactorState.backupCodes.map((code, idx) => (
                    <div key={idx} className="flex justify-between text-text-2">
                      <span>{code}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleDownloadBackupCodes}
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold text-secondary transition hover:border-primary/40 hover:text-primary"
                  >
                    Télécharger
                  </button>
                  <button
                    onClick={handleCopyBackupCodes}
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold text-secondary transition hover:border-primary/40 hover:text-primary"
                  >
                    Copier
                  </button>
                </div>
              </section>
            )}

            {/* Security Tips */}
            <section className="rounded-[24px] border border-outline-variant/20 bg-brand-light/60 p-6 shadow-sm">
              <h4 className="mb-3 text-sm font-bold text-secondary">Conseils utiles</h4>
              <ul className="space-y-2 text-xs text-on-surface-variant">
                <li>• Activez les notifications pour les connexions suspectes</li>
                <li>• Utilisez un gestionnaire de mots de passe sécurisé</li>
                <li>• Conservez vos codes de secours dans un endroit sûr</li>
                <li>• Ne partagez jamais vos codes avec quiconque</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
