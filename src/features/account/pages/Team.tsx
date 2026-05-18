import { Plus, Shield } from 'lucide-react';

export default function Team() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Équipe</h1>
          <p className="text-on-surface-variant mt-1">
            Gérez les membres de votre équipe et leurs rôles
          </p>
        </div>
        <button className="px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Inviter un membre
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant text-sm font-medium mb-2">
                Membres actifs
              </p>
              <p className="text-2xl font-bold text-on-surface">1</p>
            </div>
            <Shield className="w-10 h-10 text-primary opacity-20" />
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant text-sm font-medium mb-2">
                Invitations en attente
              </p>
              <p className="text-2xl font-bold text-on-surface">0</p>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant text-sm font-medium mb-2">
                Rôles disponibles
              </p>
              <p className="text-2xl font-bold text-on-surface">3</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30 mb-6">
        <h2 className="text-lg font-bold text-on-surface mb-4">Membres actuels</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-outline-variant/30">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                K
              </div>
              <div>
                <p className="font-semibold text-on-surface">Vous</p>
                <p className="text-sm text-on-surface-variant">Admin • Email: votre@email.com</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
              Admin
            </span>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm p-6 border border-outline-variant/30">
        <h2 className="text-lg font-bold text-on-surface mb-4">Rôles disponibles</h2>
        <div className="space-y-4">
          <div className="p-4 bg-background rounded-lg border border-outline-variant/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-on-surface">Admin</p>
                <p className="text-sm text-on-surface-variant mt-1">
                  Accès complet à tous les outils et paramètres
                </p>
              </div>
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                Actuellement: 1
              </span>
            </div>
          </div>

          <div className="p-4 bg-background rounded-lg border border-outline-variant/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-on-surface">Éditeur</p>
                <p className="text-sm text-on-surface-variant mt-1">
                  Créer et modifier les campagnes, importer les contacts
                </p>
              </div>
              <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded">
                Actuellement: 0
              </span>
            </div>
          </div>

          <div className="p-4 bg-background rounded-lg border border-outline-variant/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-on-surface">Analyste</p>
                <p className="text-sm text-on-surface-variant mt-1">
                  Accès en lecture seule aux rapports et analytics
                </p>
              </div>
              <span className="text-xs bg-success/20 text-success px-2 py-1 rounded">
                Actuellement: 0
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-info/10 border border-info rounded-lg">
        <p className="text-sm text-info font-semibold">
          ℹ️ Sprint 5 — Fonctionnalité complète disponible le 30 juin 2026
        </p>
      </div>
    </div>
  );
}
