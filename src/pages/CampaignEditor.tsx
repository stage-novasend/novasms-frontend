import React from 'react';

export default function CampaignEditor() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Éditeur de campagne (Bêta)</h2>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 card">Éditeur Drag & Drop — maquette disponible</div>
        <aside className="card">Inspecteur / propriétés</aside>
      </div>
    </div>
  );
}
