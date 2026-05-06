import { useAuthStore } from '@/stores/authStore';
import { BarChart3, Zap, TrendingUp, Users } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
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
              <p className="text-2xl font-bold text-on-surface">0</p>
              <p className="text-xs text-on-surface-variant mt-1">Base totale</p>
            </div>
            <Users className="w-10 h-10 text-primary opacity-20" />
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant text-sm font-medium mb-2">Crédits disponibles</p>
              <p className="text-2xl font-bold text-primary">5 000</p>
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
          Commencez à créer vos campagnes marketing dès maintenant et atteignez vos clients sur tous les canaux.
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
            <p className="text-sm text-on-surface-variant mt-2">Créez votre première campagne pour commencer!</p>
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30">
          <h2 className="text-lg font-bold text-on-surface mb-4">Segments</h2>
          <div className="text-center py-8">
            <p className="text-on-surface-variant">Aucun segment créé pour le moment.</p>
            <p className="text-sm text-on-surface-variant mt-2">Créez des segments pour cibler vos audiences.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
