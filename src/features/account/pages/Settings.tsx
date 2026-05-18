import { Save, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function Settings() {
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-on-surface mb-6">Paramètres</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30">
            <h2 className="text-lg font-bold text-on-surface mb-4">Préférences générales</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Langue
                </label>
                <select className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-background text-on-surface">
                  <option>Français</option>
                  <option>English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Fuseau horaire
                </label>
                <select className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-background text-on-surface">
                  <option>Africa/Abidjan (UTC+0)</option>
                  <option>Africa/Lagos (UTC+1)</option>
                  <option>Europe/Paris (UTC+1)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Notifications par email
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-on-surface">
                      Campagnes envoyées
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-on-surface">
                      Alertes crédits faibles
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-on-surface">
                      Rapports hebdomadaires
                    </span>
                  </label>
                </div>
              </div>

              <button className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                <Save className="w-5 h-5" />
                Enregistrer les modifications
              </button>
            </div>
          </div>

          {/* API Settings */}
          <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30">
            <h2 className="text-lg font-bold text-on-surface mb-4">Clés API</h2>
            <p className="text-sm text-on-surface-variant mb-4">
              Utilisez les clés API pour intégrer NovaSMS avec vos outils externes
            </p>

            <div className="p-4 bg-background rounded-lg border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-on-surface-variant">Clé publique</p>
                  <p className="font-mono text-xs text-on-surface mt-1 break-all">
                    pk_live_xxxxxxxxxxxxxxxxxxxxxxxx
                  </p>
                </div>
                <button className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                  Copier
                </button>
              </div>
            </div>

            <button className="mt-4 px-4 py-2 bg-outline-variant text-on-surface rounded-lg font-semibold hover:bg-outline-variant/80 transition-all">
              Régénérer les clés
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Info */}
          <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30">
            <h3 className="font-semibold text-on-surface mb-3">À propos</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-on-surface-variant">Version</p>
                <p className="text-on-surface font-semibold">1.0.0</p>
              </div>
              <div>
                <p className="text-on-surface-variant">Environnement</p>
                <p className="text-on-surface font-semibold">Production</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-surface rounded-xl shadow-sm p-6 border border-danger/30">
            <h3 className="font-semibold text-danger mb-3">Zone de danger</h3>

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-danger text-on-primary rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>

            <button className="w-full mt-3 px-4 py-2 bg-danger/10 text-danger rounded-lg font-semibold hover:bg-danger/20 transition-all border border-danger/30">
              Supprimer le compte
            </button>

            <p className="text-xs text-on-surface-variant mt-3">
              ⚠️ Ces actions sont irréversibles
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-info/10 border border-info rounded-lg">
        <p className="text-sm text-info font-semibold">
          ℹ️ Paramètres avancés disponibles dans Sprint 5
        </p>
      </div>
    </div>
  );
}
