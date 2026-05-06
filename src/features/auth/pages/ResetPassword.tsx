import { Bolt } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ResetPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <Bolt className="w-5 h-5 text-white" />
          </div>
          <span className="font-headline font-bold text-secondary">NovaSMS</span>
        </div>
        <h1 className="text-2xl font-bold text-secondary mb-4">Réinitialisation du mot de passe</h1>
        <p className="text-on-surface-variant mb-6">Fonctionnalité en cours de développement.</p>
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
