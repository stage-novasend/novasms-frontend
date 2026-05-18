import { Plus } from 'lucide-react';

export default function Automations() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-on-surface">Automatisations</h1>
        <button className="px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Créer une automatisation
        </button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm p-12 border border-outline-variant/30 text-center">
        <div className="text-5xl mb-4">⚙️</div>
        <h2 className="text-xl font-bold text-on-surface mb-2">
          Automatisations (en développement)
        </h2>
        <p className="text-on-surface-variant mb-6">
          Créez des workflows automatisés pour engager vos clients au bon moment.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <h3 className="font-semibold text-on-surface mb-2">
              Automatisations simples
            </h3>
            <p className="text-sm text-on-surface-variant">
              Déclenchez un message à l'ajout d'un contact
            </p>
          </div>
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <h3 className="font-semibold text-on-surface mb-2">
              Workflows multi-étapes
            </h3>
            <p className="text-sm text-on-surface-variant">
              Créez des séquences complexes avec conditions
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-warning/10 border border-warning rounded-lg">
          <p className="text-sm text-warning font-semibold">
            ⏳ Sprint 4 — Disponible le 10 juin 2026
          </p>
        </div>
      </div>
    </div>
  );
}
