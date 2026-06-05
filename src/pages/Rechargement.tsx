import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { toast } from 'sonner';

type Operator = 'orange' | 'mtn' | 'wave' | 'moov';
type PayTab = 'mobile' | 'visa';

const OPERATORS: { id: Operator; emoji: string; label: string }[] = [
  { id: 'orange', emoji: '🟠', label: 'Orange Money' },
  { id: 'mtn', emoji: '🟡', label: 'MTN MoMo' },
  { id: 'wave', emoji: '🔵', label: 'Wave' },
  { id: 'moov', emoji: '🟢', label: 'Moov Money' },
];

const AMOUNTS = [5000, 10000, 25000, 50000];

export default function Rechargement() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<PayTab>('mobile');
  const [operator, setOperator] = useState<Operator>('orange');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState<number>(10000);
  const [customAmount, setCustomAmount] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Carte Visa
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Succès
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const finalAmount = amount || Number(customAmount) || 0;
  // Crédits reçus = montant payé (pas d'ajout de solde fictif hardcodé)
  const creditsAfter = finalAmount;

  async function handleSendOtp() {
    if (!phone || phone.length < 8) {
      toast.error('Numéro invalide');
      return;
    }
    setOtpSent(true);
    toast.success('Code OTP envoyé par SMS');
  }

  async function handleConfirm() {
    if (tab === 'mobile') {
      const code = otp.join('');
      if (code.length < 6) {
        toast.error('Entrez le code OTP à 6 chiffres');
        return;
      }
    }
    setLoading(true);
    try {
      const paid = finalAmount || Number(customAmount) || 0;
      const res = await api.post('/payments/recharge', {
        amount: paid,
        method: tab === 'mobile' ? operator : 'visa',
        phone: tab === 'mobile' ? `+225${phone.replace(/\s/g, '')}` : undefined,
        otp: tab === 'mobile' ? otp.join('') : undefined,
        card:
          tab === 'visa'
            ? { number: cardNum, expiry: cardExp, cvv: cardCvv, name: cardName }
            : undefined,
      });
      const txId: string | null = (res.data as { transactionId?: string })?.transactionId ?? null;
      setPaidAmount(paid);
      setTransactionId(txId);
      setSuccess(true);
      toast.success('Paiement confirmé ! Crédits ajoutés.');
    } catch {
      toast.error('Échec du paiement. Vérifiez vos informations.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadReceipt() {
    if (!transactionId) return;
    setDownloadLoading(true);
    try {
      const res = await api.get(`/transactions/${transactionId}/receipt`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recu-novasms.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Impossible de télécharger le reçu.');
    } finally {
      setDownloadLoading(false);
    }
  }

  function handleOtpInput(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[i] = digit;
    setOtp(newOtp);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  }

  // ── Écran de succès ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div
        id="tour-rechargement-header"
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          background: 'var(--bg)',
        }}
      >
        <div
          style={{
            flex: 1,
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '100%', maxWidth: 520 }}>
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              {/* Icône check */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#2ec80a,#aaee22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div
                style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}
              >
                Paiement confirmé !
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 28 }}>
                Vos crédits ont été ajoutés instantanément à votre compte.
              </div>

              <div style={{ fontSize: 44, fontWeight: 900, color: '#0c5460', lineHeight: 1.1 }}>
                {paidAmount.toLocaleString('fr-FR')} FCFA
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, marginBottom: 36 }}>
                rechargés avec succès
              </div>

              {/* Boutons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {transactionId && (
                  <button
                    className="btn-primary"
                    onClick={handleDownloadReceipt}
                    disabled={downloadLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '11px 22px',
                      fontSize: 13,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {downloadLoading ? 'Génération…' : 'Télécharger le reçu PDF'}
                  </button>
                )}
                <button
                  className="btn-outline"
                  onClick={() => navigate('/dashboard')}
                  style={{ padding: '11px 22px', fontSize: 13 }}
                >
                  Retour au dashboard →
                </button>
              </div>

              {/* Référence transaction */}
              {transactionId && (
                <div
                  style={{
                    marginTop: 28,
                    padding: '10px 16px',
                    background: 'var(--muted)',
                    borderRadius: 8,
                    fontSize: 11,
                    color: 'var(--text-2)',
                  }}
                >
                  Référence :{' '}
                  <span
                    style={{ fontWeight: 600, color: 'var(--text-1)', fontFamily: 'monospace' }}
                  >
                    {transactionId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulaire de paiement ─────────────────────────────────────────────────
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          flex: 1,
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 680,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Card principale */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>
                Choisissez votre mode de paiement
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                Paiement sécurisé · Créditage instantané
              </div>
            </div>

            {/* Tabs */}
            <div
              style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}
            >
              <button
                onClick={() => setTab('mobile')}
                style={{
                  flex: 1,
                  padding: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    tab === 'mobile' ? 'linear-gradient(135deg,#2ec80a,#aaee22)' : 'var(--muted)',
                  color: tab === 'mobile' ? '#0c5460' : 'var(--text-2)',
                  borderRadius: '10px 0 0 10px',
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 2 }}>📱</div>
                Mobile Money
              </button>
              <button
                onClick={() => setTab('visa')}
                style={{
                  flex: 1,
                  padding: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    tab === 'visa' ? 'linear-gradient(135deg,#2ec80a,#aaee22)' : 'var(--muted)',
                  color: tab === 'visa' ? '#0c5460' : 'var(--text-2)',
                  borderRadius: '0 10px 10px 0',
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 2 }}>💳</div>
                Carte Visa
              </button>
            </div>

            {tab === 'mobile' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Opérateur */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-1)',
                      marginBottom: 8,
                    }}
                  >
                    Opérateur
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {OPERATORS.map((op) => (
                      <div
                        key={op.id}
                        onClick={() => setOperator(op.id)}
                        style={{
                          flex: 1,
                          border: `0.5px solid ${operator === op.id ? '#2ec80a' : 'var(--border)'}`,
                          borderRadius: 10,
                          padding: 12,
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: operator === op.id ? '#edfce8' : 'var(--surface)',
                        }}
                      >
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{op.emoji}</div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: operator === op.id ? '#0c5460' : 'var(--text-1)',
                          }}
                        >
                          {op.label}
                        </div>
                        {operator === op.id && (
                          <div style={{ fontSize: 10, color: '#16a34a', marginTop: 2 }}>
                            ● Sélectionné
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Téléphone */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-1)',
                      marginBottom: 8,
                    }}
                  >
                    Numéro de téléphone Mobile Money
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-2)',
                      }}
                    >
                      +225
                    </div>
                    <input
                      className="form-input"
                      style={{ paddingLeft: 52 }}
                      placeholder="07 12 34 56 78"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Montant */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-1)',
                      marginBottom: 8,
                    }}
                  >
                    Montant à recharger
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4,1fr)',
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    {AMOUNTS.map((a) => (
                      <button
                        key={a}
                        onClick={() => {
                          setAmount(a);
                          setCustomAmount('');
                        }}
                        style={{
                          padding: 9,
                          fontSize: 12.5,
                          fontWeight: 500,
                          border: `0.5px solid ${amount === a && !customAmount ? '#2ec80a' : 'rgba(0,0,0,0.12)'}`,
                          borderRadius: 10,
                          background: amount === a && !customAmount ? '#edfce8' : 'var(--surface)',
                          color: amount === a && !customAmount ? '#0c5460' : 'var(--text-1)',
                          cursor: 'pointer',
                        }}
                      >
                        {a.toLocaleString('fr-FR')} FCFA
                      </button>
                    ))}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      value={customAmount || amount.toString()}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setAmount(0);
                      }}
                      style={{ paddingRight: 52 }}
                      placeholder="Autre montant"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 12,
                        color: 'var(--text-2)',
                        fontWeight: 600,
                      }}
                    >
                      FCFA
                    </div>
                  </div>
                  {finalAmount > 0 && (
                    <div
                      style={{
                        marginTop: 6,
                        padding: '10px 12px',
                        background: '#edfce8',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: 11, color: '#0c5460' }}>
                        Crédits reçus après paiement
                      </span>
                      <strong style={{ color: '#0c5460', fontSize: 15 }}>
                        {creditsAfter.toLocaleString('fr-FR')} FCFA
                      </strong>
                    </div>
                  )}
                </div>

                {/* OTP */}
                <div
                  style={{
                    background: 'var(--muted)',
                    borderRadius: 14,
                    padding: 16,
                    border: '0.5px solid rgba(0,0,0,0.12)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--text-1)',
                      marginBottom: 4,
                    }}
                  >
                    Confirmation par code OTP
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginBottom: 12 }}>
                    Un code à 6 chiffres sera envoyé au +225 {phone || '07 XX XX XX XX'} par votre
                    opérateur.
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el;
                        }}
                        className="form-input"
                        style={{
                          width: 44,
                          textAlign: 'center',
                          fontSize: 18,
                          fontWeight: 700,
                          padding: '8px 0',
                        }}
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpInput(i, e.target.value)}
                        placeholder="•"
                      />
                    ))}
                    <button
                      className="btn-sm"
                      onClick={handleSendOtp}
                      style={{ marginLeft: 8, whiteSpace: 'nowrap' }}
                    >
                      {otpSent ? 'Renvoyer' : 'Envoyer OTP'}
                    </button>
                  </div>
                </div>

                <button
                  className="btn-primary"
                  onClick={handleConfirm}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading
                    ? 'Traitement…'
                    : `Confirmer le paiement de ${finalAmount.toLocaleString('fr-FR')} FCFA →`}
                </button>
              </div>
            ) : (
              /* Visa form */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-1)',
                      marginBottom: 8,
                    }}
                  >
                    Numéro de carte
                  </label>
                  <input
                    className="form-input"
                    placeholder="1234 5678 9012 3456"
                    value={cardNum}
                    onChange={(e) => setCardNum(e.target.value)}
                    maxLength={19}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-1)',
                      marginBottom: 8,
                    }}
                  >
                    Titulaire de la carte
                  </label>
                  <input
                    className="form-input"
                    placeholder="Nom complet"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-1)',
                        marginBottom: 8,
                      }}
                    >
                      Date d'expiration
                    </label>
                    <input
                      className="form-input"
                      placeholder="MM/AA"
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value)}
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-1)',
                        marginBottom: 8,
                      }}
                    >
                      CVV
                    </label>
                    <input
                      className="form-input"
                      placeholder="123"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      maxLength={4}
                      type="password"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-1)',
                        marginBottom: 8,
                      }}
                    >
                      Montant
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-input"
                        placeholder="10 000"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        style={{ paddingRight: 44 }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: 10,
                          color: 'var(--text-2)',
                          fontWeight: 600,
                        }}
                      >
                        FCFA
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  className="btn-primary"
                  onClick={handleConfirm}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading
                    ? 'Traitement…'
                    : `Payer ${(Number(customAmount) || finalAmount).toLocaleString('fr-FR')} FCFA →`}
                </button>
              </div>
            )}
          </div>

          {/* Badges sécurité */}
          <div
            style={{ display: 'flex', gap: 12, justifyContent: 'space-between', padding: '0 4px' }}
          >
            {[
              'Paiement sécurisé TLS 1.3',
              'Créditage instantané',
              'Reçu PDF disponible',
              'Conformité PCI-DSS',
            ].map((label) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 10.5,
                  color: 'var(--text-2)',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="1.4"
                >
                  <path d="M7 1l5 2v5c0 3-2.5 5-5 6C4.5 13 2 11 2 8V3z" />
                  <polyline points="4.5,7 6.5,9 9.5,5" />
                </svg>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
