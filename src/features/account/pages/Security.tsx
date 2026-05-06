import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { useAuthStore } from '@/stores/authStore'

interface TwoFactorState {
  isEnabled: boolean
  method: 'totp' | 'sms' | null
  secret?: string
  otpauthUrl?: string
  qrCodeDataUrl?: string
  backupCodes?: string[]
}

export default function Security() {
  const { user } = useAuthStore()
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>({
    isEnabled: false,
    method: null,
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [totpInputs, setTotpInputs] = useState(['', '', '', '', '', ''])
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const renderQrCode = async () => {
      if (twoFactorState.method !== 'totp' || !twoFactorState.otpauthUrl) return

      const canvas = qrCanvasRef.current
      if (!canvas) return

      try {
        await QRCode.toCanvas(canvas, twoFactorState.otpauthUrl, {
          width: 200,
          margin: 1,
          color: {
            dark: '#0C5460',
            light: '#FFFFFF',
          },
        })
      } catch {
        setMessage({ type: 'error', text: 'Impossible d\'afficher le QR code. Utilisez la clé manuelle.' })
      }
    }

    renderQrCode()
  }, [twoFactorState.method, twoFactorState.otpauthUrl])

  const api = async (path: string, method = 'GET', body?: any) => {
    const { accessToken } = useAuthStore.getState()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    return response.json()
  }

  // Load current account 2FA state on mount
  useEffect(() => {
    const loadAccount = async () => {
      if (!user?.id) return
      try {
        const res = await api('me', 'GET')
        if (res?.success && res.account) {
          setTwoFactorState((prev) => ({
            ...prev,
            isEnabled: !!res.account.twoFactorEnabled,
            backupCodes: res.account.backupCodes || undefined,
          }))
        } else if (res && res.message) {
          setMessage({ type: 'error', text: res.message })
        }
      } catch (e) {
        setMessage({ type: 'error', text: 'Impossible de récupérer l\'état du compte.' })
      }
    }

    loadAccount()
  }, [user?.id])

  // Generate TOTP Secret & QR Code
  const handleGenerateTOTP = async () => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Erreur: ID utilisateur non trouvé.' })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const res = await api('generate-2fa-secret', 'POST', { accountId: user.id })
      if (res.success && res.otpauth_url) {
        setTwoFactorState({
          isEnabled: false,
          method: 'totp',
          secret: res.secret,
          otpauthUrl: res.otpauth_url,
        })
        setMessage({ type: 'success', text: 'Secret TOTP généré. Scannez le QR code avec votre appli d\'authentification.' })
      } else {
        setMessage({ type: 'error', text: res.message || 'Erreur lors de la génération.' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur.' })
    } finally {
      setLoading(false)
    }
  }

  // Verify TOTP Code & Enable 2FA
  const handleVerifyAndEnableTOTP = async () => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Erreur: ID utilisateur non trouvé.' })
      return
    }

    const code = totpInputs.join('')
    if (code.length !== 6) {
      setMessage({ type: 'error', text: 'Veuillez entrer les 6 chiffres.' })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const res = await api('enable-2fa', 'POST', { accountId: user.id, code })
      if (res.success) {
        setTwoFactorState((prev) => ({
          ...prev,
          isEnabled: true,
          backupCodes: res.backup_codes,
        }))
        setTotpInputs(['', '', '', '', '', ''])
        setMessage({ type: 'success', text: '✅ 2FA TOTP activée avec succès! Conservez vos codes de secours.' })
      } else {
        setMessage({ type: 'error', text: res.message || 'Code invalide.' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Erreur lors de la vérification.' })
    } finally {
      setLoading(false)
    }
  }

  // Disable 2FA
  const handleDisable2FA = async () => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Erreur: ID utilisateur non trouvé.' })
      return
    }

    if (!window.confirm('Êtes-vous sûr de vouloir désactiver la double authentification?')) return

    setLoading(true)
    setMessage(null)
    try {
      const res = await api('disable-2fa', 'POST', { accountId: user.id })
      if (res.success) {
        setTwoFactorState({ isEnabled: false, method: null })
        setTotpInputs(['', '', '', '', '', ''])
        setMessage({ type: 'success', text: '2FA désactivée.' })
      } else {
        setMessage({ type: 'error', text: res.message || 'Erreur.' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Erreur de connexion.' })
    } finally {
      setLoading(false)
    }
  }

  // Copy backup codes to clipboard
  const handleCopyBackupCodes = () => {
    if (twoFactorState.backupCodes) {
      navigator.clipboard.writeText(twoFactorState.backupCodes.join('\n'))
      setMessage({ type: 'success', text: 'Codes de secours copiés!' })
    }
  }

  // Download backup codes
  const handleDownloadBackupCodes = () => {
    if (twoFactorState.backupCodes) {
      const text = twoFactorState.backupCodes.join('\n')
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'novasms-backup-codes.txt'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleTotpInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newInputs = [...totpInputs]
    newInputs[index] = value.slice(-1)
    setTotpInputs(newInputs)
    
    // Auto-focus next input
    if (value && index < 5) {
      const inputs = document.querySelectorAll('.totp-input')
      if (inputs[index + 1]) (inputs[index + 1] as HTMLInputElement).focus()
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Configuration de la Sécurité 2FA</h1>
          <p className="text-on-surface-variant text-lg">Renforcez la protection de votre compte NovaSMS en ajoutant une couche de sécurité supplémentaire.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Card */}
            <section className="card">
              <div className="flex justify-between items-center">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🔒</div>
                  <div>
                    <h3 className="text-xl font-bold">État de la double authentification</h3>
                    <p className="text-sm text-on-surface-variant">
                      {twoFactorState.isEnabled ? '✅ La protection 2FA est activée.' : '❌ La protection 2FA est désactivée.'}
                    </p>
                  </div>
                </div>
                <div>
                  {twoFactorState.isEnabled && (
                    <button onClick={handleDisable2FA} disabled={loading} className="btn-teal text-sm">
                      Désactiver
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Method Selection */}
            {!twoFactorState.isEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* TOTP Method */}
                <div className="card border-l-4 border-brand-primary">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold">📱 Application d'authentification</h4>
                    <span className="bg-brand-primary text-brand-text text-xs px-2 py-1 rounded">Recommandé</span>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-6">
                    Utilisez Google Authenticator ou Authy pour générer des codes de sécurité.
                  </p>
                  <button onClick={handleGenerateTOTP} disabled={loading || twoFactorState.method === 'totp'} className="btn-primary w-full">
                    {loading ? 'Génération...' : 'Configurer TOTP'}
                  </button>
                </div>

                {/* SMS Method (Disabled) */}
                <div className="card opacity-50 grayscale">
                  <h4 className="text-lg font-bold mb-4">💬 SMS</h4>
                  <p className="text-sm text-on-surface-variant mb-6">
                    Recevez un code à 6 chiffres par SMS sur votre mobile.
                  </p>
                  <button disabled className="btn-outline w-full text-xs">
                    Disponible bientôt
                  </button>
                </div>
              </div>
            )}

            {/* TOTP Setup Wizard */}
            {twoFactorState.method === 'totp' && !twoFactorState.isEnabled && (
              <section className="card border-l-4 border-brand-teal">
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center font-bold">1</span>
                  Assistant de configuration TOTP
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* QR Code Section */}
                  <div className="space-y-6">
                    <div>
                      <h5 className="text-sm font-bold uppercase tracking-widest mb-4">Étape 1: Scannez le code</h5>
                      <div className="bg-white p-4 rounded-lg inline-block border border-border">
                        <canvas ref={qrCanvasRef} width={200} height={200} className="block" />
                      </div>
                    </div>

                    {/* Manual Key */}
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-xs font-bold text-on-surface-variant mb-3">Clé manuelle</p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between font-mono text-brand-teal font-bold">
                        <span className="break-all text-xs sm:text-sm tracking-[0.18em]">{twoFactorState.secret || 'J3KZ L92M 88WQ PX44'}</span>
                        <button className="btn-ghost text-xs">📋 Copier</button>
                      </div>
                    </div>
                  </div>

                  {/* Verification Section */}
                  <div className="flex flex-col justify-center space-y-6">
                    <div>
                      <h5 className="text-sm font-bold uppercase tracking-widest mb-4">Étape 2: Vérifiez le code</h5>
                      <p className="text-sm text-on-surface-variant mb-6">
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
                            className="totp-input w-12 h-14 text-center text-2xl font-bold bg-muted border border-border rounded-md focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all"
                            inputMode="numeric"
                          />
                        ))}
                      </div>

                      <button onClick={handleVerifyAndEnableTOTP} disabled={loading || totpInputs.join('').length !== 6} className="btn-teal w-full font-bold">
                        {loading ? 'Vérification...' : 'Activer 2FA'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-brand-light border-brand-primary text-brand-text' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {message.text}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            {/* Backup Codes */}
            {twoFactorState.isEnabled && twoFactorState.backupCodes && (
              <section className="card">
                <h3 className="text-xl font-bold mb-4">🔑 Codes de secours</h3>
                <p className="text-sm text-on-surface-variant mb-4">
                  Conservez ces codes en lieu sûr. Ils vous permettront d'accéder à votre compte si vous n'avez pas accès à votre appli 2FA.
                </p>

                <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {twoFactorState.backupCodes.map((code, idx) => (
                    <div key={idx} className="flex justify-between text-text-2">
                      <span>{code}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={handleDownloadBackupCodes} className="btn-outline text-sm w-full">
                    📥 Télécharger
                  </button>
                  <button onClick={handleCopyBackupCodes} className="btn-outline text-sm w-full">
                    📋 Copier
                  </button>
                </div>
              </section>
            )}

            {/* Security Tips */}
            <section className="card bg-blue-50 border border-blue-200">
              <h4 className="text-sm font-bold text-blue-900 mb-3">💡 Conseils de sécurité</h4>
              <ul className="space-y-2 text-xs text-blue-800">
                <li>✓ Activez les notifications pour les connexions suspectes</li>
                <li>✓ Utilisez un gestionnaire de mots de passe sécurisé</li>
                <li>✓ Conservez vos codes de secours dans un endroit sûr</li>
                <li>✓ Ne partagez jamais vos codes avec quiconque</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
