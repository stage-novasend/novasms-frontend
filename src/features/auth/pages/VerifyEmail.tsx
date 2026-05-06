import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bolt, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function VerifyEmail() {
  const logout = useAuthStore((state) => state.logout);
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    logout();
  }, [logout]);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/auth/verify-email/${token}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json();

        if (json.success) {
          setStatus('success');
          setMessage('Votre email est confirmé. Redirection...');
          setTimeout(() => navigate('/confirmation-success'), 1500);
        } else {
          setStatus('error');
          setMessage(json.message || 'Lien invalide ou expiré.');
        }
      } catch {
        setStatus('error');
        setMessage('Erreur de connexion au serveur.');
      }
    };

    if (token) {
      verify();
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-background text-on-surface font-body antialiased flex flex-col">
      {/* Header */}
      <header className="px-6 lg:px-12 py-6 flex justify-center border-b border-outline-variant/20 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <Bolt className="w-5 h-5 text-white" />
          </div>
          <span className="font-headline font-extrabold text-xl tracking-tight text-secondary">
            NovaSMS
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 lg:px-12 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-outline-variant/30 p-8 lg:p-12 text-center"
        >
          {/* Loading State */}
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h1 className="font-headline text-2xl font-bold text-secondary mb-4">
                Vérification en cours...
              </h1>
              <p className="text-on-surface-variant">
                Nous confirmons votre adresse e-mail. Veuillez patienter.
              </p>
            </>
          )}

          {/* Success State */}
          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-headline text-2xl font-bold text-secondary mb-4">
                Email vérifié avec succès !
              </h1>
              <p className="text-on-surface-variant mb-6">{message}</p>
              <p className="text-sm text-primary font-semibold">
                Redirection vers la page de confirmation...
              </p>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="font-headline text-2xl font-bold text-secondary mb-4">
                Vérification échouée
              </h1>
              <p className="text-on-surface-variant mb-6">{message}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:brightness-110 transition-all"
                >
                  Réessayer l'inscription
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface text-secondary font-semibold rounded-xl hover:bg-surface-variant transition-all border border-outline-variant"
                >
                  Se connecter
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-secondary/40 border-t border-outline-variant/20 bg-white">
        <p>
          Copyright 2026 NovaSMS —{' '}
          <Link to="/" className="hover:text-primary">
            Retour au site
          </Link>
        </p>
      </footer>
    </div>
  );
}
