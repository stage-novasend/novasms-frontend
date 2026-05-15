import React from 'react';

type Block = { id: string; type: 'text' | 'image' | 'button' | 'separator'; content?: string };

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function CampaignBlocksEditor({
  value,
  onChange,
}: {
  value?: Block[];
  onChange?: (blocks: Block[], html?: string) => void;
}) {
  const [blocks, setBlocks] = React.useState<Block[]>(
    value || [{ id: uid(), type: 'text', content: '' }],
  );

  React.useEffect(() => {
    const html = blocks
      .map((b) => {
        if (b.type === 'text') return `<p>${(b.content || '').replace(/\n/g, '<br/>')}</p>`;
        if (b.type === 'image') return `<img src="${b.content || ''}" alt="image"/>`;
        if (b.type === 'button') return `<a class="btn" href="#">${b.content || 'Bouton'}</a>`;
        if (b.type === 'separator') return `<hr/>`;
        return '';
      })
      .join('\n');

    onChange?.(blocks, html);
  }, [blocks, onChange]);

  function addBlock(type: Block['type']) {
    setBlocks((s) => [...s, { id: uid(), type, content: type === 'separator' ? undefined : '' }]);
  }

  function updateBlock(id: string, patch: Partial<Block>) {
    setBlocks((s) => s.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function removeBlock(id: string) {
    setBlocks((s) => s.filter((b) => b.id !== id));
  }

  function move(id: string, dir: 'up' | 'down') {
    setBlocks((s) => {
      const idx = s.findIndex((b) => b.id === id);
      if (idx === -1) return s;
      const newIdx = dir === 'up' ? Math.max(0, idx - 1) : Math.min(s.length - 1, idx + 1);
      const copy = s.slice();
      const [item] = copy.splice(idx, 1);
      copy.splice(newIdx, 0, item);
      return copy;
    });
  }

  function insertVariable(id: string, variable: string) {
    updateBlock(id, {
      content: (blocks.find((b) => b.id === id)?.content || '') + `{{${variable}}}`,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button type="button" className="btn-outline" onClick={() => addBlock('text')}>
          Ajouter texte
        </button>
        <button type="button" className="btn-outline" onClick={() => addBlock('image')}>
          Ajouter image
        </button>
        <button type="button" className="btn-outline" onClick={() => addBlock('button')}>
          Ajouter bouton
        </button>
        <button type="button" className="btn-outline" onClick={() => addBlock('separator')}>
          Séparateur
        </button>
      </div>

      {blocks.map((b, i) => (
        <div key={b.id} className="card p-3">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium">{b.type.toUpperCase()}</div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-sm"
                onClick={() => move(b.id, 'up')}
                disabled={i === 0}
              >
                ↑
              </button>
              <button
                type="button"
                className="btn-sm"
                onClick={() => move(b.id, 'down')}
                disabled={i === blocks.length - 1}
              >
                ↓
              </button>
              <button type="button" className="btn-sm btn-danger" onClick={() => removeBlock(b.id)}>
                Suppr
              </button>
            </div>
          </div>

          {b.type === 'text' && (
            <>
              <textarea
                className="textarea"
                value={b.content}
                onChange={(e) => updateBlock(b.id, { content: e.target.value })}
                rows={4}
              />
              <div className="mt-2 flex items-center gap-2">
                <label className="text-sm">Insérer variable :</label>
                <select onChange={(e) => insertVariable(b.id, e.target.value)} defaultValue="">
                  <option value="" disabled>
                    --
                  </option>
                  <option value="prénom">prénom</option>
                  <option value="boutique">boutique</option>
                  <option value="code_promo">code_promo</option>
                </select>
              </div>
            </>
          )}

          {b.type === 'image' && (
            <input
              className="input"
              placeholder="URL de l'image"
              value={b.content}
              onChange={(e) => updateBlock(b.id, { content: e.target.value })}
            />
          )}

          {b.type === 'button' && (
            <input
              className="input"
              placeholder="Texte du bouton"
              value={b.content}
              onChange={(e) => updateBlock(b.id, { content: e.target.value })}
            />
          )}

          {b.type === 'separator' && <div className="text-sm text-muted">Séparateur</div>}
        </div>
      ))}

      <div>
        <div className="font-semibold">Aperçu</div>
        <div
          className="border p-3 mt-2"
          dangerouslySetInnerHTML={{
            __html: blocks
              .map((b) =>
                b.type === 'text'
                  ? `<p>${(b.content || '').replace(/\n/g, '<br/>')}</p>`
                  : b.type === 'image'
                    ? `<img src="${b.content}" style="max-width:100%" />`
                    : b.type === 'button'
                      ? `<a class="btn" href="#">${b.content}</a>`
                      : '<hr/>',
              )
              .join('\n'),
          }}
        />
      </div>
    </div>
  );
}
