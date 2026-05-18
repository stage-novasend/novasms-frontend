import { Download, TrendingUp } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-on-surface">Analytics</h1>
        <button className="px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2">
          <Download className="w-5 h-5" />
          Exporter les données
        </button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm p-12 border border-outline-variant/30 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-xl font-bold text-on-surface mb-2">
          Analytics avancées (en développement)
        </h2>
        <p className="text-on-surface-variant mb-6">
          Analysez la performance de vos campagnes avec des graphiques détaillés et des insights.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-on-surface mb-2">KPIs en temps réel</h3>
            <p className="text-sm text-on-surface-variant">
              Voir l'évolution sur 7/30/90 jours
            </p>
          </div>
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="text-3xl mx-auto mb-2">🔥</div>
            <h3 className="font-semibold text-on-surface mb-2">Heatmap</h3>
            <p className="text-sm text-on-surface-variant">
              Horaires d'engagement et clics emails
            </p>
          </div>
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="text-3xl mx-auto mb-2">🏆</div>
            <h3 className="font-semibold text-on-surface mb-2">Top campagnes</h3>
            <p className="text-sm text-on-surface-variant">
              Vos 5 meilleures campagnes
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-warning/10 border border-warning rounded-lg">
          <p className="text-sm text-warning font-semibold">
            ⏳ Sprint 5 — Disponible le 30 juin 2026
          </p>
        </div>
      </div>
    </div>
  );
}
