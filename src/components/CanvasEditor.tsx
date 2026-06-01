import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AutomationItem, WorkflowEdge, WorkflowNode } from '@/api/automations';

type NodeType = 'trigger' | 'wait' | 'action' | 'end' | 'condition' | 'tag';
type WorkflowNodeConfig = NonNullable<WorkflowNode['config']>;

type Node = WorkflowNode;
type Edge = WorkflowEdge;

type NodeTone = 'trigger' | 'wait' | 'action' | 'condition' | 'tag' | 'end';

const NODE_COPY: Record<
  NodeType,
  { badge: string; title: string; subtitle: string; tone: NodeTone }
> = {
  trigger: { badge: 'Déclencheur', title: 'Trigger', subtitle: 'Nouveau contact', tone: 'trigger' },
  wait: { badge: 'Attente', title: 'Wait', subtitle: 'Délai', tone: 'wait' },
  action: { badge: 'Action', title: 'Action', subtitle: 'Envoi message', tone: 'action' },
  condition: { badge: 'Condition', title: 'Condition', subtitle: 'Règle', tone: 'condition' },
  tag: { badge: 'Tag', title: 'Tag', subtitle: 'Segment', tone: 'tag' },
  end: { badge: 'Fin', title: 'End', subtitle: 'Workflow clôturé', tone: 'end' },
};

const NODE_THEME: Record<NodeTone, string> = {
  trigger: 'border-teal-600/40 bg-white shadow-[0_14px_30px_rgba(12,84,96,0.08)]',
  wait: 'border-amber-400/50 bg-[#FFFBF0] shadow-[0_14px_30px_rgba(217,119,6,0.08)]',
  action: 'border-lime-500/40 bg-[#F4FBEF] shadow-[0_14px_30px_rgba(46,200,10,0.08)]',
  condition: 'border-amber-400/50 bg-[#FFFBF0] shadow-[0_14px_30px_rgba(217,119,6,0.08)]',
  tag: 'border-slate-300 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.06)]',
  end: 'border-slate-300 bg-slate-50 shadow-[0_14px_30px_rgba(15,23,42,0.06)]',
};

const NODE_SUBTEXT: Record<NodeType, string> = {
  trigger: 'Contact ajouté',
  wait: 'Pause avant action',
  action: 'Email message',
  condition: 'A cliqué le lien ?',
  tag: 'Ajouter un tag',
  end: 'Workflow terminé',
};

const WAIT_PRESETS = [
  { label: 'Immédiat', value: '0' },
  { label: '5 minutes', value: '300' },
  { label: '30 minutes', value: '1800' },
  { label: '1 heure', value: '3600' },
  { label: '1 jour', value: '86400' },
  { label: 'Personnalisé', value: 'custom' },
] as const;

const CHANNEL_OPTIONS = ['Email', 'SMS', 'WhatsApp'] as const;

const TAG_OPTIONS = ['VIP', 'Lead chaud', 'Nouveau client', 'Relance', 'Newsletter'] as const;

function cloneState(nodes: Node[], edges: Edge[]) {
  return { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) };
}

export default function CanvasEditor({
  automation,
  workflows = [],
  onSave,
  onClose,
  isSaving = false,
}: {
  automation: AutomationItem | null;
  workflows?: AutomationItem[];
  onSave: (workflow: { nodes: Node[]; edges: Edge[] }) => Promise<void> | void;
  onClose: () => void;
  isSaving?: boolean;
}) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<{ nodeId: string; port: string } | null>(null);
  const [linkMode, setLinkMode] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragPointerId = useRef<number | null>(null);
  const panRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(
    null,
  );

  // undo/redo
  const history = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const future = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);

  useEffect(() => {
    const workflow = automation?.workflow;
    if (!automation || !workflow) {
      const defaultNodes: Node[] = [
        { id: 'n-trigger', x: 280, y: 60, label: 'Trigger', type: 'trigger' },
        { id: 'n-wait', x: 280, y: 190, label: 'Wait', type: 'wait' },
        { id: 'n-action', x: 280, y: 320, label: 'Action', type: 'action' },
        { id: 'n-condition', x: 560, y: 190, label: 'Condition', type: 'condition' },
        { id: 'n-tag', x: 560, y: 320, label: 'Tag', type: 'tag' },
      ];
      const defaultEdges: Edge[] = [
        { id: 'e-1', from: 'n-trigger', to: 'n-wait' },
        { id: 'e-2', from: 'n-wait', to: 'n-action' },
      ];
      setNodes(defaultNodes);
      setEdges(defaultEdges);
      history.current = [cloneState(defaultNodes, defaultEdges)];
      future.current = [];
      return;
    }

    try {
      const wf = automation.workflow;
      if (wf?.nodes && wf?.edges) {
        setNodes(wf.nodes);
        setEdges(wf.edges);
        history.current = [cloneState(wf.nodes, wf.edges)];
        future.current = [];
      }
    } catch {
      // ignore
    }
  }, [automation]);

  const pushHistory = useCallback((n: Node[], e: Edge[]) => {
    history.current.push(cloneState(n, e));
    if (history.current.length > 50) history.current.shift();
    future.current = [];
  }, []);

  const undo = useCallback(() => {
    if (history.current.length <= 1) return;
    const cur = history.current.pop();
    if (!cur) return;
    future.current.push(cur);
    const prev = history.current[history.current.length - 1];
    if (!prev) return;
    setNodes(prev.nodes);
    setEdges(prev.edges);
  }, []);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(cloneState(next.nodes, next.edges));
    setNodes(next.nodes);
    setEdges(next.edges);
  }, []);

  // drag
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const onPointerDownNode = useCallback(
    (e: React.PointerEvent, node: Node) => {
      if (connectFrom) return;
      const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      dragRef.current = {
        id: node.id,
        offsetX: e.clientX - targetRect.left,
        offsetY: e.clientY - targetRect.top,
      };
      dragPointerId.current = e.pointerId;
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      setDraggingNodeId(node.id);
      setNodes((current) => {
        const index = current.findIndex((item) => item.id === node.id);
        if (index === -1) return current;
        const next = [...current];
        const moved = next.splice(index, 1)[0];
        if (!moved) return current;
        next.push(moved);
        return next;
      });
      setSelectedNodeId(node.id);
      setEditingNodeId(null);
    },
    [connectFrom],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (panRef.current && !dragRef.current) {
        const { startX, startY, baseX, baseY } = panRef.current;
        setPan({ x: baseX + (e.clientX - startX), y: baseY + (e.clientY - startY) });
        return;
      }
      if (!dragRef.current) return;
      const dragState = dragRef.current;
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;
      const rawX = (e.clientX - canvasRect.left) / zoom - dragState.offsetX;
      const rawY = (e.clientY - canvasRect.top) / zoom - dragState.offsetY;
      const snap = (v: number) => Math.round(v / 8) * 8;
      const nextX = snap(rawX);
      const nextY = snap(rawY);
      setNodes((cur) => cur.map((n) => (n.id === dragState.id ? { ...n, x: nextX, y: nextY } : n)));
    },
    [zoom],
  );

  const onPointerUp = useCallback(() => {
    if (dragRef.current) {
      pushHistory(nodes, edges);
    }
    dragRef.current = null;
    panRef.current = null;
    dragPointerId.current = null;
    setDraggingNodeId(null);
  }, [nodes, edges, pushHistory]);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => onPointerMove(event);
    const handleUp = () => onPointerUp();

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [onPointerMove, onPointerUp]);

  // create node/edge
  const addNode = useCallback(
    (type: NodeType) => {
      const id = `n-${Date.now()}`;
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const x = canvasRect
        ? Math.max(40, Math.round(canvasRect.width / 2 - 110))
        : 140 + nodes.length * 24;
      const y = canvasRect
        ? Math.max(40, Math.round(canvasRect.height / 2 - 70))
        : 120 + nodes.length * 24;
      const n = { id, x, y, label: `${type}`, type } as Node;
      const nextNodes = [...nodes, n];
      setNodes(nextNodes);
      setSelectedNodeId(id);
      pushHistory(nextNodes, edges);
    },
    [nodes, edges, pushHistory],
  );

  const changeZoom = useCallback((nextZoom: number) => {
    setZoom(Math.max(0.7, Math.min(1.5, Number(nextZoom.toFixed(2)))));
  }, []);

  const onPointerDownCanvas = useCallback(
    (event: React.PointerEvent) => {
      if (event.target !== event.currentTarget) return;
      if (connectFrom || linkMode) {
        setConnectFrom(null);
        setLinkMode(false);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setEditingNodeId(null);
        return;
      }
      panRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        baseX: pan.x,
        baseY: pan.y,
      };
      (event.currentTarget as Element).setPointerCapture(event.pointerId);
    },
    [connectFrom, linkMode, pan.x, pan.y],
  );

  const startConnect = useCallback((nodeId: string, port: string) => {
    setLinkMode(true);
    setSelectedEdgeId(null);
    setConnectFrom({ nodeId, port });
  }, []);

  const finishConnect = useCallback(
    (toNodeId: string, toPort: string) => {
      if (!connectFrom) return;
      if (connectFrom.nodeId === toNodeId) {
        setConnectFrom(null);
        return;
      }
      const alreadyExists = edges.some(
        (edge) => edge.from === connectFrom.nodeId && edge.to === toNodeId,
      );
      if (alreadyExists) {
        setConnectFrom(null);
        return;
      }
      const edge: Edge = {
        id: `e-${Date.now()}`,
        from: connectFrom.nodeId,
        to: toNodeId,
        fromPort: connectFrom.port,
        toPort,
      };
      const nextEdges = [...edges, edge];
      setEdges(nextEdges);
      pushHistory(nodes, nextEdges);
      setSelectedNodeId(null);
      setSelectedEdgeId(edge.id);
      setConnectFrom(null);
    },
    [connectFrom, nodes, edges, pushHistory],
  );

  const cancelConnect = useCallback(() => {
    setConnectFrom(null);
    setLinkMode(false);
  }, []);

  const deleteSelected = useCallback(() => {
    if (selectedEdgeId) {
      const nextEdges = edges.filter((e) => e.id !== selectedEdgeId);
      setEdges(nextEdges);
      pushHistory(nodes, nextEdges);
      setSelectedEdgeId(null);
      return;
    }
    if (selectedNodeId) {
      const nextNodes = nodes.filter((n) => n.id !== selectedNodeId);
      const nextEdges = edges.filter((e) => e.from !== selectedNodeId && e.to !== selectedNodeId);
      setNodes(nextNodes);
      setEdges(nextEdges);
      pushHistory(nextNodes, nextEdges);
      setSelectedNodeId(null);
      return;
    }
  }, [selectedEdgeId, selectedNodeId, nodes, edges, pushHistory]);

  // edit label
  const setNodeLabel = useCallback(
    (id: string, label: string) => {
      const next = nodes.map((n) => (n.id === id ? { ...n, label } : n));
      setNodes(next);
    },
    [nodes],
  );

  const updateNodeConfig = useCallback(
    (id: string, configPatch: Partial<WorkflowNodeConfig>) => {
      const next = nodes.map((n) =>
        n.id === id ? { ...n, config: { ...(n.config || {}), ...configPatch } } : n,
      );
      setNodes(next);
      pushHistory(next, edges);
    },
    [nodes, edges, pushHistory],
  );

  // keyboard handlers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Delete') {
        deleteSelected();
      }
      if (e.key === 'Escape') {
        cancelConnect();
        setEditingNodeId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, deleteSelected, cancelConnect]);

  // Center canvas helper
  const centerCanvas = useCallback(() => {
    if (!canvasRef.current || nodes.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const minX = Math.min(...nodes.map((n) => n.x));
    const maxX = Math.max(...nodes.map((n) => n.x + 220));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxY = Math.max(...nodes.map((n) => n.y + 120));
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const offsetX = rect.width / 2 - (minX + contentW / 2);
    const offsetY = rect.height / 2 - (minY + contentH / 2);
    const next = nodes.map((n) => ({ ...n, x: n.x + offsetX, y: n.y + offsetY }));
    setNodes(next);
    pushHistory(next, edges);
  }, [nodes, edges, pushHistory]);

  // Mini-map viewport
  const [minimapViewport, setMinimapViewport] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>({ left: 0, top: 0, width: 0, height: 0 });
  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const minX = Math.min(...nodes.map((n) => n.x));
    const maxX = Math.max(...nodes.map((n) => n.x + 220));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxY = Math.max(...nodes.map((n) => n.y + 120));
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    const scale = 0.12; // minimap scale heuristic
    const left = (rect.width / 2 - (minX + contentW / 2)) * scale + 8;
    const top = (rect.height / 2 - (minY + contentH / 2)) * scale + 8;
    const width = contentW * scale;
    const height = contentH * scale;
    setMinimapViewport({ left, top, width, height });
  }, [nodes]);

  const handleSave = useCallback(async () => {
    await onSave({ nodes, edges });
  }, [nodes, edges, onSave]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-4 backdrop-blur-sm">
      <div className="flex h-[92vh] w-[min(1280px,100%)] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(12,84,96,0.22)]">
        <style>{`\n          .connection-line { stroke: #6d7b65; stroke-width: 2; fill: none; stroke-dasharray: 4; }\n          .connection-line.selected { stroke: #2EC80A; stroke-width: 3; }\n          @keyframes dash { to { stroke-dashoffset: -1000; } }\n          .connection-line { animation: dash 30s linear infinite; }\n          .node-handle { width: 10px; height: 10px; background: white; border: 2px solid #6d7b65; border-radius: 50%; }\n          .node-handle-left { position: absolute; left: -6px; top: 50%; transform: translateY(-50%); }\n          .node-handle-right { position: absolute; right: -6px; top: 50%; transform: translateY(-50%); }\n          .minimap-preview { position: fixed; bottom: 24px; right: 24px; width: 200px; height: 120px; background: rgba(255,255,255,0.95); border: 1px solid rgba(109,123,101,0.12); border-radius: 12px; box-shadow: 0 10px 30px rgba(12,84,96,0.12); z-index:60; }\n        `}</style>
        <div className="flex items-center justify-between border-b border-outline-variant/40 px-5 py-4">
          <div>
            <h3 className="text-lg font-black text-secondary">Éditeur visuel</h3>
            <p className="text-sm text-on-surface-variant">
              Workflow · séquence visuelle déplaçable
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-secondary"
            >
              Fermer
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant/30 bg-surface/40 px-5 py-3">
          <button
            onClick={() => addNode('trigger')}
            className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-secondary"
          >
            + Trigger
          </button>
          <button
            onClick={() => addNode('wait')}
            className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-secondary"
          >
            + Wait
          </button>
          <button
            onClick={() => addNode('action')}
            className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-secondary"
          >
            + Action
          </button>
          <button
            onClick={() => addNode('condition')}
            className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-secondary"
          >
            + Condition
          </button>
          <button
            onClick={() => addNode('tag')}
            className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-secondary"
          >
            + Tag
          </button>
          <button
            onClick={() => addNode('end')}
            className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-secondary"
          >
            + End
          </button>
          <div className="mx-2 h-8 w-px bg-outline-variant/40" />
          <button
            onClick={undo}
            className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-secondary"
          >
            Undo
          </button>
          <button
            onClick={redo}
            className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-secondary"
          >
            Redo
          </button>
          <button
            onClick={deleteSelected}
            className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-secondary"
          >
            Suppr
          </button>
          <button
            onClick={() => {
              if (linkMode || connectFrom) {
                cancelConnect();
              } else {
                setLinkMode(true);
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
              }
            }}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${linkMode || connectFrom ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/40 bg-white text-secondary'}`}
          >
            {linkMode || connectFrom ? 'Annuler liaison' : 'Lier flèche'}
          </button>
          {(linkMode || connectFrom) && (
            <span className="text-xs font-semibold text-on-surface-variant">
              {connectFrom ? 'Sélectionnez le nœud cible' : 'Sélectionnez le nœud source'}
            </span>
          )}
          <button
            onClick={() => {
              const start = nodes.find((n) => n.type === 'trigger')?.id;
              const visited: string[] = [];
              let cur = start;
              while (cur) {
                visited.push(cur);
                const out = edges.find((e) => e.from === cur);
                if (!out) break;
                cur = out.to;
                if (visited.includes(cur)) break;
              }
              alert(
                `Preview path: ${visited.map((id) => nodes.find((n) => n.id === id)?.label).join(' -> ')}`,
              );
            }}
            className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-secondary"
          >
            Preview
          </button>
          <button
            onClick={() => centerCanvas()}
            className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-secondary"
            title="Centrer le canvas"
          >
            Centrer
          </button>
          <button
            onClick={() => changeZoom(zoom - 0.1)}
            className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-secondary"
            title="Dézoomer"
          >
            -
          </button>
          <span className="rounded-xl border border-outline-variant/30 bg-white px-3 py-2 text-sm font-semibold text-secondary">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => changeZoom(zoom + 0.1)}
            className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-secondary"
            title="Zoomer"
          >
            +
          </button>
          <button
            onClick={async () => {
              if (!automation?.id) {
                alert("Sauvegardez l'automation d'abord");
                return;
              }
              try {
                const res = await fetch(`/api/automations/${automation.id}/report`);
                const j = await res.json();
                alert(JSON.stringify(j, null, 2));
              } catch (err) {
                alert('Erreur rapport: ' + String(err));
              }
            }}
            className="rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-semibold text-secondary"
          >
            Rapport
          </button>
        </div>

        <div className="grid flex-1 grid-cols-[260px_minmax(0,1fr)_300px] overflow-hidden bg-[#F7F9F7]">
          <aside className="border-r border-outline-variant/30 bg-white p-4">
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Workflows
              </p>
              <div className="mt-3 space-y-2">
                {(workflows.length > 0 ? workflows : automation ? [automation] : [])
                  .slice(0, 3)
                  .map((workflow, index) => {
                    const nodesCount =
                      workflow.workflow?.nodes?.length ?? (index === 0 ? nodes.length : 0);
                    const statusLabel = workflow.status;
                    return (
                      <div
                        key={workflow.id}
                        className={`rounded-2xl border p-3 ${workflow.id === automation?.id ? 'border-primary/30 bg-primary/5' : 'border-outline-variant/30 bg-white'}`}
                      >
                        <p className="text-sm font-bold text-secondary">{workflow.name}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {nodesCount > 0 ? `${nodesCount} nœuds` : 'Workflow sans nœud'} ·{' '}
                          {statusLabel}
                        </p>
                      </div>
                    );
                  })}
                {workflows.length === 0 && !automation && (
                  <div className="rounded-2xl border border-dashed border-outline-variant/30 bg-surface/40 p-3 text-xs text-on-surface-variant">
                    Aucun workflow disponible.
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-outline-variant/30 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Stats workflow sélectionné
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Entrées totales</span>
                  <strong>892</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">En cours</span>
                  <strong className="text-secondary">124</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Convertis</span>
                  <strong className="text-success">318</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Taux conversion</span>
                  <strong className="text-primary">35.6%</strong>
                </div>
              </div>
            </div>
          </aside>

          <section
            ref={canvasRef}
            className="relative overflow-hidden p-8 cursor-grab active:cursor-grabbing"
            onPointerDown={onPointerDownCanvas}
            onWheel={(event) => {
              if (!event.ctrlKey && !event.metaKey) return;
              event.preventDefault();
              changeZoom(zoom + (event.deltaY > 0 ? -0.08 : 0.08));
            }}
            onClick={() => {
              if (connectFrom || linkMode) cancelConnect();
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
              setEditingNodeId(null);
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(109,123,101,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(109,123,101,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(12,84,96,0.05)_1px,transparent_1px)] [background-size:22px_22px]" />

            <div
              className="relative h-full w-full"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                width: `${100 / zoom}%`,
                height: `${100 / zoom}%`,
              }}
            >
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                <defs>
                  <marker
                    id="arrow"
                    viewBox="0 0 10 10"
                    refX="10"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                  </marker>
                </defs>
                {edges.map((edge) => {
                  const from = nodes.find((n) => n.id === edge.from);
                  const to = nodes.find((n) => n.id === edge.to);
                  if (!from || !to) return null;
                  const x1 = edge.fromPort === 'left' ? from.x : from.x + 220;
                  const y1 = from.y + 32;
                  const x2 = edge.toPort === 'right' ? to.x + 220 : to.x;
                  const y2 = to.y + 32;
                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const curvature = Math.min(200, Math.hypot(dx, dy) / 2);
                  const cx1 = x1 + curvature;
                  const cx2 = x2 - curvature;
                  const d = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
                  return (
                    <g key={edge.id}>
                      <path
                        d={d}
                        markerEnd="url(#arrow)"
                        className={`connection-line ${selectedEdgeId === edge.id ? 'selected' : ''} cursor-pointer`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedNodeId(null);
                          setSelectedEdgeId(edge.id);
                        }}
                      />
                    </g>
                  );
                })}
              </svg>

              <div className="relative flex h-full flex-col items-center gap-0">
                <div
                  style={{ left: 0, top: 0 }}
                  className="relative flex h-full w-full items-start justify-center"
                >
                  {nodes.map((node) => {
                    const copy = NODE_COPY[node.type];
                    return (
                      <div
                        key={node.id}
                        style={{
                          left: node.x,
                          top: node.y,
                          zIndex:
                            draggingNodeId === node.id ? 40 : selectedNodeId === node.id ? 20 : 10,
                          touchAction: 'none',
                        }}
                        className={`absolute w-[220px] select-none rounded-2xl border px-4 py-3 overflow-visible ${NODE_THEME[copy.tone]} ${selectedNodeId === node.id ? 'ring-2 ring-primary' : ''} cursor-grab active:cursor-grabbing`}
                        onPointerDown={(e) => onPointerDownNode(e, node)}
                        onPointerUp={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (linkMode || connectFrom) {
                            if (!connectFrom) {
                              setConnectFrom({ nodeId: node.id, port: 'right' });
                              setSelectedNodeId(node.id);
                              return;
                            }
                            finishConnect(node.id, 'left');
                            setLinkMode(false);
                            return;
                          }
                          setSelectedNodeId(node.id);
                          setSelectedEdgeId(null);
                          setEditingNodeId(null);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <div
                              className={`mt-1 h-2.5 w-2.5 rounded-full ${copy.tone === 'trigger' ? 'bg-teal-500' : copy.tone === 'wait' ? 'bg-amber-500' : copy.tone === 'action' ? 'bg-lime-500' : 'bg-slate-400'}`}
                            />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                                {copy.badge}
                              </p>
                              {editingNodeId === node.id ? (
                                <input
                                  autoFocus
                                  className="mt-1 w-full border-b border-outline-variant/60 bg-transparent text-sm font-bold text-secondary outline-none"
                                  value={node.label}
                                  onPointerDown={(event) => event.stopPropagation()}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(ev) => setNodeLabel(node.id, ev.target.value)}
                                  onBlur={() => {
                                    pushHistory(nodes, edges);
                                    setEditingNodeId(null);
                                  }}
                                />
                              ) : (
                                <div
                                  className="mt-1 text-sm font-bold text-secondary"
                                  onDoubleClick={() => setEditingNodeId(node.id)}
                                >
                                  {node.label}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 relative" style={{ width: 36 }}>
                            <button
                              title="left port"
                              onPointerDown={(event) => event.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                startConnect(node.id, 'left');
                              }}
                              className="node-handle node-handle-left"
                            />
                            <button
                              title="right port"
                              onPointerDown={(event) => event.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                startConnect(node.id, 'right');
                              }}
                              className="node-handle node-handle-right"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-on-surface-variant">
                          {NODE_SUBTEXT[node.type]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <aside className="border-l border-outline-variant/30 bg-white p-4">
            <div className="rounded-3xl border border-outline-variant/30 bg-surface/40 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Inspecteur
              </p>
              <h4 className="mt-2 text-base font-black text-secondary">
                {selectedNode?.label ?? 'Aucun nœud sélectionné'}
              </h4>
              <p className="mt-1 text-sm text-on-surface-variant">
                {selectedNode
                  ? NODE_SUBTEXT[selectedNode.type]
                  : 'Cliquez un nœud pour le modifier.'}
              </p>

              {selectedNode && (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-2xl border border-outline-variant/30 bg-white p-3">
                    <label className="text-xs font-semibold text-on-surface-variant">
                      Nom du nœud
                    </label>
                    <input
                      className="mt-2 w-full rounded-xl border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none"
                      value={selectedNode.label}
                      onChange={(event) => setNodeLabel(selectedNode.id, event.target.value)}
                      placeholder="Nom du nœud"
                    />
                  </div>
                  <div className="rounded-2xl border border-outline-variant/30 bg-white p-3">
                    <p className="text-xs font-semibold text-on-surface-variant">Type</p>
                    <p className="mt-1 font-semibold text-secondary">{selectedNode.type}</p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant/30 bg-white p-3">
                    <p className="text-xs font-semibold text-on-surface-variant">Position</p>
                    <p className="mt-1 font-semibold text-secondary">
                      x {Math.round(selectedNode.x)} · y {Math.round(selectedNode.y)}
                    </p>
                  </div>

                  {selectedNode.type === 'wait' && (
                    <div className="rounded-2xl border border-outline-variant/30 bg-white p-3">
                      <label className="text-xs font-semibold text-on-surface-variant">Délai</label>
                      <select
                        className="mt-2 w-full rounded-xl border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none"
                        value={
                          selectedNode.config?.delayPreset ||
                          (selectedNode.config?.delaySeconds ? 'custom' : '0')
                        }
                        onChange={(event) => {
                          const nextPreset = event.target
                            .value as WorkflowNodeConfig['delayPreset'];
                          if (nextPreset === 'custom') {
                            updateNodeConfig(selectedNode.id, {
                              delayPreset: nextPreset,
                              delaySeconds: selectedNode.config?.delaySeconds ?? 0,
                            });
                            return;
                          }
                          updateNodeConfig(selectedNode.id, {
                            delayPreset: nextPreset,
                            delaySeconds: Number(nextPreset) || 0,
                          });
                        }}
                      >
                        {WAIT_PRESETS.map((preset) => (
                          <option key={preset.value} value={preset.value}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                      {(selectedNode.config?.delayPreset === 'custom' ||
                        (!selectedNode.config?.delayPreset &&
                          selectedNode.config?.delaySeconds !== 0)) && (
                        <input
                          type="number"
                          min={0}
                          className="mt-2 w-full rounded-xl border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none"
                          value={String(selectedNode.config?.delaySeconds ?? 0)}
                          onChange={(event) =>
                            updateNodeConfig(selectedNode.id, {
                              delaySeconds: Number(event.target.value) || 0,
                              delayPreset: 'custom',
                            })
                          }
                        />
                      )}
                    </div>
                  )}

                  {selectedNode.type === 'trigger' && (
                    <div className="rounded-2xl border border-outline-variant/30 bg-white p-3">
                      <label className="text-xs font-semibold text-on-surface-variant">
                        Source du déclencheur
                      </label>
                      <select
                        className="mt-2 w-full rounded-xl border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none"
                        value={selectedNode.config?.triggerSource || 'contact_added'}
                        onChange={(event) =>
                          updateNodeConfig(selectedNode.id, {
                            triggerSource: event.target
                              .value as WorkflowNodeConfig['triggerSource'],
                          })
                        }
                      >
                        <option value="contact_added">Contact ajouté</option>
                        <option value="api">Intégration externe</option>
                      </select>
                    </div>
                  )}

                  {selectedNode.type === 'action' && (
                    <div className="space-y-3 rounded-2xl border border-outline-variant/30 bg-white p-3">
                      <div>
                        <label className="text-xs font-semibold text-on-surface-variant">
                          Canal
                        </label>
                        <select
                          className="mt-2 w-full rounded-xl border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none"
                          value={selectedNode.config?.channel || 'Email'}
                          onChange={(event) =>
                            updateNodeConfig(selectedNode.id, {
                              channel: event.target.value as WorkflowNodeConfig['channel'],
                            })
                          }
                        >
                          {CHANNEL_OPTIONS.map((channel) => (
                            <option key={channel} value={channel}>
                              {channel}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-on-surface-variant">
                          Template
                        </label>
                        <input
                          className="mt-2 w-full rounded-xl border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none"
                          value={selectedNode.config?.templateId || ''}
                          onChange={(event) =>
                            updateNodeConfig(selectedNode.id, { templateId: event.target.value })
                          }
                          placeholder="uuid-template"
                        />
                      </div>
                    </div>
                  )}

                  {selectedNode.type === 'tag' && (
                    <div className="rounded-2xl border border-outline-variant/30 bg-white p-3">
                      <label className="text-xs font-semibold text-on-surface-variant">
                        Tag à appliquer
                      </label>
                      <select
                        className="mt-2 w-full rounded-xl border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none"
                        value={selectedNode.config?.tag || 'VIP'}
                        onChange={(event) =>
                          updateNodeConfig(selectedNode.id, { tag: event.target.value })
                        }
                      >
                        {TAG_OPTIONS.map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                        <option value="__custom__">Personnalisé</option>
                      </select>
                      {selectedNode.config?.tag === '__custom__' && (
                        <input
                          className="mt-2 w-full rounded-xl border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none"
                          value={selectedNode.config?.value || ''}
                          onChange={(event) =>
                            updateNodeConfig(selectedNode.id, { value: event.target.value })
                          }
                          placeholder="Votre tag"
                        />
                      )}
                    </div>
                  )}

                  {selectedNode.type === 'condition' && (
                    <div className="space-y-3 rounded-2xl border border-outline-variant/30 bg-white p-3">
                      <div>
                        <label className="text-xs font-semibold text-on-surface-variant">
                          Type de condition
                        </label>
                        <select
                          className="mt-2 w-full rounded-xl border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none"
                          value={selectedNode.config?.conditionType || 'field'}
                          onChange={(event) =>
                            updateNodeConfig(selectedNode.id, {
                              conditionType: event.target
                                .value as WorkflowNodeConfig['conditionType'],
                            })
                          }
                        >
                          <option value="field">Champ contact</option>
                          <option value="tag">Tag</option>
                          <option value="open">Ouverture</option>
                          <option value="click">Clic</option>
                          <option value="purchase">Achat</option>
                        </select>
                      </div>

                      {(selectedNode.config?.conditionType === 'open' ||
                        selectedNode.config?.conditionType === 'click') && (
                        <div>
                          <label className="text-xs font-semibold text-on-surface-variant">
                            ID campagne optionnel
                          </label>
                          <input
                            className="mt-2 w-full rounded-xl border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none"
                            value={selectedNode.config?.campaignId || ''}
                            onChange={(event) =>
                              updateNodeConfig(selectedNode.id, { campaignId: event.target.value })
                            }
                            placeholder="uuid-campagne"
                          />
                        </div>
                      )}

                      {(selectedNode.config?.conditionType === 'tag' ||
                        !selectedNode.config?.conditionType ||
                        selectedNode.config?.conditionType === 'field') && (
                        <div>
                          <label className="text-xs font-semibold text-on-surface-variant">
                            Valeur / Tag
                          </label>
                          <input
                            className="mt-2 w-full rounded-xl border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none"
                            value={selectedNode.config?.value || selectedNode.config?.tag || ''}
                            onChange={(event) =>
                              updateNodeConfig(
                                selectedNode.id,
                                selectedNode.config?.conditionType === 'tag'
                                  ? { tag: event.target.value }
                                  : { value: event.target.value },
                              )
                            }
                            placeholder="VIP / email / phone / ..."
                          />
                        </div>
                      )}

                      {selectedNode.config?.conditionType === 'field' && (
                        <>
                          <div>
                            <label className="text-xs font-semibold text-on-surface-variant">
                              Champ
                            </label>
                            <input
                              className="mt-2 w-full rounded-xl border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none"
                              value={selectedNode.config?.field || ''}
                              onChange={(event) =>
                                updateNodeConfig(selectedNode.id, { field: event.target.value })
                              }
                              placeholder="firstName / email / location"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-on-surface-variant">
                              Opérateur
                            </label>
                            <select
                              className="mt-2 w-full rounded-xl border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none"
                              value={selectedNode.config?.operator || 'exists'}
                              onChange={(event) =>
                                updateNodeConfig(selectedNode.id, {
                                  operator: event.target.value as WorkflowNodeConfig['operator'],
                                })
                              }
                            >
                              <option value="exists">Existe</option>
                              <option value="equals">Égale</option>
                              <option value="notEquals">Différent</option>
                              <option value="contains">Contient</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-on-surface-variant">
                              Valeur
                            </label>
                            <input
                              className="mt-2 w-full rounded-xl border border-outline-variant/40 px-3 py-2 text-sm text-secondary outline-none"
                              value={selectedNode.config?.value || ''}
                              onChange={(event) =>
                                updateNodeConfig(selectedNode.id, { value: event.target.value })
                              }
                              placeholder="Maya"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
        {/* Mini-map preview */}
        <div className="minimap-preview" aria-hidden>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div
              style={{
                position: 'absolute',
                left: '38%',
                top: '10%',
                width: '24%',
                height: '12%',
                background: 'rgba(18,163,77,0.16)',
                borderRadius: 6,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '38%',
                top: '32%',
                width: '24%',
                height: '12%',
                background: 'rgba(245,158,11,0.12)',
                borderRadius: 6,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '35%',
                top: '54%',
                width: '30%',
                height: '15%',
                background: 'rgba(124,58,237,0.12)',
                borderRadius: 6,
              }}
            />
            {/* viewport box */}
            <div
              style={{
                position: 'absolute',
                left: `${minimapViewport.left}px`,
                top: `${minimapViewport.top}px`,
                width: `${minimapViewport.width}px`,
                height: `${minimapViewport.height}px`,
                border: '2px solid rgba(19,110,0,0.28)',
                boxSizing: 'border-box',
                borderRadius: 6,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
