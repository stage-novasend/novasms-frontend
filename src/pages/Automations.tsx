import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, Clock3, Loader2, Plus, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  automationsApi,
  type AutomationItem,
  type AutomationWorkflow,
  type WorkflowNode,
} from '@/api/automations';
import CanvasEditor from '@/components/CanvasEditor';

type DraftAutomation = {
  name: string;
  trigger: 'contact_added' | 'api';
  delaySeconds: string;
  delayPreset: '0' | '300' | '1800' | '3600' | '86400' | 'custom';
  channel: 'Email' | 'SMS' | 'WhatsApp';
  templateId: string;
  status: 'Active' | 'Inactive' | 'Draft';
};

type WorkflowTemplate = {
  key: string;
  label: string;
  description: string;
  draft: DraftAutomation;
  workflow: AutomationWorkflow;
};

const initialDraft: DraftAutomation = {
  name: 'Bienvenue après inscription',
  trigger: 'contact_added',
  delaySeconds: '3600',
  delayPreset: '3600',
  channel: 'Email',
  templateId: '',
  status: 'Active',
};

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    key: 'welcome',
    label: 'Bienvenue',
    description: 'Accueille automatiquement un nouveau contact avec un message d’introduction.',
    draft: {
      name: 'Bienvenue après inscription',
      trigger: 'contact_added',
      delaySeconds: '3600',
      delayPreset: '3600',
      channel: 'Email',
      templateId: '',
      status: 'Active',
    },
    workflow: {
      nodes: [
        {
          id: 't-1',
          x: 240,
          y: 80,
          label: 'Contact ajouté',
          type: 'trigger',
          config: { triggerSource: 'contact_added' },
        },
        {
          id: 't-2',
          x: 240,
          y: 230,
          label: 'Attente 1 heure',
          type: 'wait',
          config: { delaySeconds: 3600, delayPreset: '3600' },
        },
        {
          id: 't-3',
          x: 240,
          y: 380,
          label: 'Email de bienvenue',
          type: 'action',
          config: { channel: 'Email', templateId: '' },
        },
        { id: 't-4', x: 240, y: 530, label: 'Fin', type: 'end' },
      ],
      edges: [
        { id: 'te-1', from: 't-1', to: 't-2' },
        { id: 'te-2', from: 't-2', to: 't-3' },
        { id: 'te-3', from: 't-3', to: 't-4' },
      ],
    },
  },
  {
    key: 'relance',
    label: 'Relance',
    description: 'Relance un prospect après un délai court puis applique un tag de suivi.',
    draft: {
      name: 'Relance automatique',
      trigger: 'api',
      delaySeconds: '1800',
      delayPreset: '1800',
      channel: 'SMS',
      templateId: '',
      status: 'Active',
    },
    workflow: {
      nodes: [
        {
          id: 'r-1',
          x: 240,
          y: 80,
          label: 'Intégration externe',
          type: 'trigger',
          config: { triggerSource: 'api' },
        },
        {
          id: 'r-2',
          x: 240,
          y: 230,
          label: 'Attente 30 min',
          type: 'wait',
          config: { delaySeconds: 1800, delayPreset: '1800' },
        },
        {
          id: 'r-3',
          x: 240,
          y: 380,
          label: 'SMS de relance',
          type: 'action',
          config: { channel: 'SMS', templateId: '' },
        },
        {
          id: 'r-4',
          x: 240,
          y: 530,
          label: 'Tag relance',
          type: 'tag',
          config: { tag: 'Relance' },
        },
      ],
      edges: [
        { id: 're-1', from: 'r-1', to: 'r-2' },
        { id: 're-2', from: 'r-2', to: 'r-3' },
        { id: 're-3', from: 'r-3', to: 'r-4' },
      ],
    },
  },
  {
    key: 'qualification',
    label: 'Qualification',
    description: 'Vérifie un tag puis branche la séquence selon l’ouverture de la campagne.',
    draft: {
      name: 'Qualification pipeline',
      trigger: 'contact_added',
      delaySeconds: '300',
      delayPreset: '300',
      channel: 'WhatsApp',
      templateId: '',
      status: 'Draft',
    },
    workflow: {
      nodes: [
        {
          id: 'q-1',
          x: 240,
          y: 80,
          label: 'Nouveau contact',
          type: 'trigger',
          config: { triggerSource: 'contact_added' },
        },
        {
          id: 'q-2',
          x: 240,
          y: 230,
          label: 'Vérification tag',
          type: 'condition',
          config: { conditionType: 'tag', tag: 'VIP' },
        },
        {
          id: 'q-3',
          x: 40,
          y: 390,
          label: 'WhatsApp VIP',
          type: 'action',
          config: { channel: 'WhatsApp', templateId: '' },
        },
        {
          id: 'q-4',
          x: 440,
          y: 390,
          label: 'Tag lead',
          type: 'tag',
          config: { tag: 'Lead chaud' },
        },
        { id: 'q-5', x: 240, y: 540, label: 'Fin', type: 'end' },
      ],
      edges: [
        { id: 'qe-1', from: 'q-1', to: 'q-2' },
        { id: 'qe-2', from: 'q-2', to: 'q-3', fromPort: 'left', toPort: 'left' },
        { id: 'qe-3', from: 'q-2', to: 'q-4', fromPort: 'right', toPort: 'right' },
        { id: 'qe-4', from: 'q-3', to: 'q-5' },
        { id: 'qe-5', from: 'q-4', to: 'q-5' },
      ],
    },
  },
];

const nodeStyles = {
  trigger: 'border-l-4 border-teal-600/40 bg-white text-teal-900 shadow-sm',
  wait: 'border-l-4 border-amber-400/40 bg-white text-amber-900 shadow-sm',
  action: 'border-l-4 border-lime-500/40 bg-white text-lime-900 shadow-sm',
  condition: 'border-l-4 border-purple-500/40 bg-white text-purple-900 shadow-sm',
  end: 'border-l-4 border-slate-300 bg-white text-slate-700 shadow-sm',
} as const;

function formatDelay(seconds: number) {
  if (!seconds) return 'Immédiat';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `${hours} h`;
}

function triggerLabel(trigger: 'contact_added' | 'api') {
  return trigger === 'contact_added' ? 'Contact ajouté' : 'Intégration externe';
}

function statusChip(status: AutomationItem['status']) {
  if (status === 'Active') return 'border-lime-200 bg-lime-50 text-lime-700';
  if (status === 'Inactive') return 'border-slate-200 bg-slate-100 text-slate-600';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function describeWorkflowNode(node?: WorkflowNode | null) {
  if (!node) return 'Aucun détail';
  const config = node.config ?? {};
  if (node.type === 'trigger')
    return config.triggerSource === 'api' ? 'Déclencheur externe' : 'Contact ajouté';
  if (node.type === 'wait')
    return config.delaySeconds ? formatDelay(config.delaySeconds) : 'Immédiat';
  if (node.type === 'action')
    return `${config.channel || 'Email'}${config.templateId ? ` · ${config.templateId}` : ''}`;
  if (node.type === 'tag') return config.tag || 'Tag';
  if (node.type === 'condition')
    return config.conditionType === 'field'
      ? `Champ ${config.field || 'contact'}`
      : `Condition ${config.conditionType || ''}`.trim();
  return 'Fin';
}

function workflowNodesFromAutomation(automation: AutomationItem | null) {
  return automation?.workflow?.nodes ?? [];
}

function PreviewNode({
  title,
  subtitle,
  tone,
}: {
  title: string;
  subtitle: string;
  tone: keyof typeof nodeStyles;
}) {
  return (
    <div className={`rounded-xl px-4 py-3 text-center ${nodeStyles[tone]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
        {subtitle}
      </p>
      <p className="mt-2 text-sm font-headline text-secondary font-bold">{title}</p>
    </div>
  );
}

export default function Automations() {
  const [items, setItems] = useState<AutomationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  const [draft, setDraft] = useState<DraftAutomation>(initialDraft);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);

  const selectedAutomation = useMemo(
    () =>
      selectedId === null
        ? null
        : (items.find((automation) => automation.id === selectedId) ?? items[0] ?? null),
    [items, selectedId],
  );

  const selectedMetrics = useMemo(() => {
    const executions = selectedAutomation?._count?.executions ?? 0;
    const sent = selectedAutomation?.sendCount ?? 0;
    const inProgress = Math.max(0, executions - sent);
    const conversion = executions > 0 ? (sent / executions) * 100 : 0;

    return {
      entries: executions,
      inProgress,
      sent,
      conversion,
    };
  }, [selectedAutomation]);

  const previewNodes = useMemo(
    () => workflowNodesFromAutomation(selectedAutomation),
    [selectedAutomation],
  );

  const loadAutomations = async () => {
    setRefreshing(true);
    try {
      const data = await automationsApi.list();
      setItems(data);
      setSelectedId((current) => (current === undefined ? (data[0]?.id ?? null) : current));
    } catch (error) {
      toast.error('Impossible de charger les automatisations');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAutomations();
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const created = await automationsApi.create({
        name: draft.name.trim(),
        trigger: draft.trigger,
        delaySeconds: Number(draft.delaySeconds) || 0,
        channel: draft.channel,
        templateId: draft.templateId.trim() || undefined,
        status: draft.status,
      });

      if (selectedTemplateKey) {
        const template = WORKFLOW_TEMPLATES.find((item) => item.key === selectedTemplateKey);
        if (template) {
          const updated = await automationsApi.update(created.id, { workflow: template.workflow });
          setItems((current) => [updated, ...current]);
          setSelectedId(updated.id);
          setEditorOpen(true);
          setSelectedTemplateKey(null);
          toast.success(`Workflow créé à partir du modèle “${template.label}”`);
          return;
        }
      }

      setItems((current) => [created, ...current]);
      setSelectedId(created.id);
      setEditorOpen(true);
      setDraft(initialDraft);
      setSelectedTemplateKey(null);
      toast.success('Workflow créé');
    } catch (error) {
      toast.error('La création du workflow a échoué');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await automationsApi.toggle(id);
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      toast.success(updated.status === 'Active' ? 'Workflow activé' : 'Workflow désactivé');
    } catch (error) {
      toast.error('Impossible de changer le statut');
      console.error(error);
    }
  };

  const handleQuickTest = () => {
    if (!selectedAutomation) {
      toast.error('Sélectionnez un workflow pour tester');
      return;
    }

    toast.success(
      `Test prêt: ${selectedAutomation.name} (${triggerLabel(selectedAutomation.trigger)} · ${formatDelay(selectedAutomation.delaySeconds)})`,
    );
  };

  const applyTemplate = (template: WorkflowTemplate) => {
    setDraft(template.draft);
    setSelectedTemplateKey(template.key);
    toast.info(`Modèle “${template.label}” prêt à être créé`);
  };

  return (
    <div className="min-h-full bg-[#f7f9f7] p-4 sm:p-6">
      <div className="mx-auto w-full max-w-[1280px] overflow-hidden rounded-2xl border border-outline-variant/30 bg-white shadow-[0_18px_50px_rgba(12,84,96,0.10)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-outline-variant/30 px-5 py-4">
          <div>
            <h1 className="text-base font-semibold text-secondary">Automatisations</h1>
            <p className="text-xs text-on-surface-variant">
              {selectedAutomation
                ? `${selectedAutomation.name} · séquence active`
                : 'Gestion de vos workflows'}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickTest}
              className="rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-xs font-semibold text-secondary transition hover:border-primary/50 hover:text-primary"
            >
              Tester
            </button>
            <button
              type="button"
              disabled={!selectedAutomation}
              onClick={() => {
                if (!selectedAutomation) return;
                void handleToggle(selectedAutomation.id);
              }}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selectedAutomation?.status === 'Active'
                ? 'Désactiver le workflow'
                : 'Activer le workflow'}
            </button>
          </div>
        </div>

        <div className="grid min-h-[760px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
          <aside className="border-r border-outline-variant/30 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-secondary">Workflows</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(initialDraft);
                    setSelectedId(null);
                    setSelectedTemplateKey(null);
                    setEditorOpen(false);
                    toast.info('Nouveau workflow prêt à être créé');
                  }}
                  className="rounded-md border border-outline-variant/40 bg-white px-2 py-1 text-xs font-semibold text-secondary transition hover:border-primary/40 hover:text-primary"
                >
                  <span className="inline-flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" /> Créer
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void loadAutomations()}
                  className="rounded-md border border-outline-variant/40 bg-white p-1.5 text-secondary transition hover:border-primary/40 hover:text-primary"
                  title="Actualiser"
                >
                  <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface/40 p-4 text-sm text-on-surface-variant">
                Chargement des workflows...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface/40 p-4 text-sm text-on-surface-variant">
                Aucun workflow pour le moment.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((automation) => {
                  const isSelected = automation.id === selectedAutomation?.id;
                  return (
                    <button
                      key={automation.id}
                      type="button"
                      onClick={() => setSelectedId(automation.id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                        isSelected
                          ? 'border-primary/40 bg-primary/10'
                          : 'border-outline-variant/30 bg-white hover:border-primary/30 hover:bg-surface'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-secondary">{automation.name}</p>
                          <p className="mt-1 text-xs text-on-surface-variant">
                            {triggerLabel(automation.trigger)} · {automation.channel}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusChip(automation.status)}`}
                        >
                          {automation.status}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
                        <span>{formatDelay(automation.delaySeconds)}</span>
                        <span>{automation.sendCount} envois</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-5 border-t border-outline-variant/30 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                Stats workflow sélectionné
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Entrées totales</span>
                  <strong>{selectedMetrics.entries}</strong>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-on-surface-variant">En cours</span>
                  <strong className="text-secondary">{selectedMetrics.inProgress}</strong>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Convertis</span>
                  <strong className="text-success">{selectedMetrics.sent}</strong>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Taux conversion</span>
                  <strong className="text-primary">{selectedMetrics.conversion.toFixed(1)}%</strong>
                </p>
              </div>
            </div>
          </aside>

          <section className="relative overflow-hidden bg-[#f7f9f7] p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(12,84,96,0.12)_1px,transparent_1px)] [background-size:24px_24px]" />

            <div className="relative mx-auto flex max-w-[340px] flex-col items-stretch gap-3">
              {previewNodes.length > 0 ? (
                previewNodes.map((node, index) => (
                  <div key={node.id} className="flex flex-col items-stretch gap-3">
                    <PreviewNode
                      tone={
                        node.type === 'trigger'
                          ? 'trigger'
                          : node.type === 'wait'
                            ? 'wait'
                            : node.type === 'action'
                              ? 'action'
                              : node.type === 'condition'
                                ? 'condition'
                                : node.type === 'tag'
                                  ? 'action'
                                  : 'end'
                      }
                      subtitle={
                        node.type === 'trigger'
                          ? 'Déclencheur'
                          : node.type === 'wait'
                            ? 'Attente'
                            : node.type === 'action'
                              ? 'Action'
                              : node.type === 'condition'
                                ? 'Condition'
                                : node.type === 'tag'
                                  ? 'Tag'
                                  : 'Fin'
                      }
                      title={node.label}
                    />
                    <p className="-mt-2 text-center text-[11px] font-medium text-on-surface-variant">
                      {describeWorkflowNode(node)}
                    </p>
                    {index < previewNodes.length - 1 && (
                      <div className="mx-auto h-8 w-px bg-outline-variant/80" />
                    )}
                  </div>
                ))
              ) : (
                <>
                  <PreviewNode
                    tone="trigger"
                    subtitle="Déclencheur"
                    title={
                      selectedAutomation
                        ? triggerLabel(selectedAutomation.trigger)
                        : 'Contact ajouté'
                    }
                  />
                  <div className="mx-auto h-8 w-px bg-outline-variant/80" />
                  <PreviewNode
                    tone="wait"
                    subtitle="Attente"
                    title={
                      selectedAutomation ? formatDelay(selectedAutomation.delaySeconds) : '1 heure'
                    }
                  />
                  <div className="mx-auto h-8 w-px bg-outline-variant/80" />
                  <PreviewNode
                    tone="action"
                    subtitle="Envoi message"
                    title={
                      selectedAutomation
                        ? `${selectedAutomation.channel} message`
                        : 'Email de relance'
                    }
                  />
                  <div className="mx-auto h-8 w-px bg-outline-variant/80" />
                  <PreviewNode
                    tone="condition"
                    subtitle="Condition"
                    title="Ouverture / clic / achat / tag"
                  />
                  <div className="mx-auto h-8 w-px bg-outline-variant/80" />
                  <PreviewNode tone="end" subtitle="Fin" title="Workflow clôturé" />
                </>
              )}
            </div>

            <div className="relative mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  if (!selectedAutomation) {
                    toast.error('Créez ou sélectionnez d’abord un workflow pour ouvrir l’éditeur');
                    return;
                  }
                  setEditorOpen(true);
                }}
                className="rounded-lg border border-outline-variant/40 bg-white px-4 py-2 text-sm font-semibold text-secondary transition hover:border-primary/40 hover:text-primary"
              >
                Ouvrir l’éditeur visuel
              </button>
            </div>
          </section>

          <aside className="border-l border-outline-variant/30 bg-white p-4">
            <h2 className="text-sm font-semibold text-secondary">Nouveau workflow</h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              Configurez le déclencheur, le délai et le canal pour créer un workflow conforme.
            </p>

            <form className="mt-4 space-y-3" onSubmit={(event) => void handleCreate(event)}>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-secondary" htmlFor="automation-name">
                  Nom
                </label>
                <input
                  id="automation-name"
                  className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none transition focus:border-primary"
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Bienvenue après inscription"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs font-semibold text-secondary"
                  htmlFor="automation-trigger"
                >
                  Déclencheur
                </label>
                <select
                  id="automation-trigger"
                  className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none transition focus:border-primary"
                  value={draft.trigger}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      trigger: event.target.value as DraftAutomation['trigger'],
                    }))
                  }
                >
                  <option value="contact_added">Contact ajouté</option>
                  <option value="api">Intégration externe (site, CRM, Zapier)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs font-semibold text-secondary"
                  htmlFor="automation-delay-preset"
                >
                  Délai
                </label>
                <select
                  id="automation-delay-preset"
                  className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none transition focus:border-primary"
                  value={draft.delayPreset}
                  onChange={(event) => {
                    const nextPreset = event.target.value as DraftAutomation['delayPreset'];
                    setDraft((current) => ({
                      ...current,
                      delayPreset: nextPreset,
                      delaySeconds:
                        nextPreset === 'custom' ? current.delaySeconds || '0' : nextPreset,
                    }));
                  }}
                >
                  <option value="0">Immédiat</option>
                  <option value="300">5 min</option>
                  <option value="1800">30 min</option>
                  <option value="3600">1 heure</option>
                  <option value="86400">1 jour</option>
                  <option value="custom">Personnalisé</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs font-semibold text-secondary"
                  htmlFor="automation-delay-custom"
                >
                  Secondes (personnalisé)
                </label>
                <input
                  id="automation-delay-custom"
                  type="number"
                  min={0}
                  disabled={draft.delayPreset !== 'custom'}
                  className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:bg-surface"
                  value={draft.delaySeconds}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      delaySeconds: event.target.value,
                      delayPreset: 'custom',
                    }))
                  }
                />
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs font-semibold text-secondary"
                  htmlFor="automation-channel"
                >
                  Canal
                </label>
                <select
                  id="automation-channel"
                  className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none transition focus:border-primary"
                  value={draft.channel}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      channel: event.target.value as DraftAutomation['channel'],
                    }))
                  }
                >
                  <option value="Email">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-secondary" htmlFor="automation-status">
                  Statut
                </label>
                <select
                  id="automation-status"
                  className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none transition focus:border-primary"
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as DraftAutomation['status'],
                    }))
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs font-semibold text-secondary"
                  htmlFor="automation-template-id"
                >
                  Template ID (optionnel)
                </label>
                <input
                  id="automation-template-id"
                  className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none transition focus:border-primary"
                  value={draft.templateId}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, templateId: event.target.value }))
                  }
                  placeholder="uuid-template"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-bold text-white transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Créer le workflow
              </button>
            </form>

            <div className="mt-4 rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs text-secondary">
              <p className="font-semibold">Conformité RG</p>
              <ul className="mt-2 space-y-1 text-on-surface-variant">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-lime-600" />
                  Déclencheur contact ajouté ou intégration externe
                </li>
                <li className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-3.5 w-3.5 text-amber-600" />
                  Délai configurable: immédiat, 30 min, 1h, 1 jour, personnalisé
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-lime-600" />
                  Compteur d’envois et activation sans perte de configuration
                </li>
              </ul>
            </div>

            <div className="mt-4 rounded-lg border border-outline-variant/30 bg-white p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                Modèles prêts à l’emploi
              </p>
              <div className="mt-3 space-y-2">
                {WORKFLOW_TEMPLATES.map((template) => (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${selectedTemplateKey === template.key ? 'border-primary bg-primary/10' : 'border-outline-variant/30 bg-surface hover:border-primary/30'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-secondary">{template.label}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {template.description}
                        </p>
                      </div>
                      <span className="rounded-full border border-outline-variant/20 px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                        Modèle
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {editorOpen && (
        <CanvasEditor
          automation={selectedAutomation}
          workflows={items}
          onSave={async (workflow) => {
            if (!selectedAutomation) return;
            try {
              setSaving(true);
              const updated = await automationsApi.update(selectedAutomation.id, { workflow });
              setItems((cur) => cur.map((it) => (it.id === updated.id ? updated : it)));
              setSelectedId(updated.id);
              toast.success(`Workflow “${updated.name}” enregistré et synchronisé`);
              setEditorOpen(false);
            } catch (err) {
              console.error(err);
              toast.error('Impossible d’enregistrer le workflow');
            } finally {
              setSaving(false);
            }
          }}
          onClose={() => setEditorOpen(false)}
          isSaving={saving}
        />
      )}
    </div>
  );
}
