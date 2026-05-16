'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import dagre from 'dagre';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FamilyTreeNodeCard, type FamilyTreeNodeData } from './FamilyTreeNodeCard';
import { AddPersonDialog } from './AddPersonDialog';
import { LinkRelationshipDialog } from './LinkRelationshipDialog';
import { EditPersonDialog } from './EditPersonDialog';
import { EditEdgeDialog, type SelectedEdge } from './EditEdgeDialog';
import { PersonInfoPanel } from './PersonInfoPanel';
import { AddParentsDialog } from './AddParentsDialog';
import { deletePerson } from '../actions/families.actions';
import type {
  FamilyMemberRole,
  FamilyPersonRow,
  FamilyRelationshipRow,
} from '../types/family.types';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 96;
const NODE_TYPES = { person: FamilyTreeNodeCard };

interface Props {
  familyId: string;
  persons: FamilyPersonRow[];
  relationships: FamilyRelationshipRow[];
  viewerRole: FamilyMemberRole | null;
}

function buildLayout(
  persons: FamilyPersonRow[],
  relationships: FamilyRelationshipRow[],
  canDelete: boolean,
  onEdit: (p: FamilyPersonRow) => void,
  onDelete: (p: FamilyPersonRow) => void,
): { nodes: Node<FamilyTreeNodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 140, edgesep: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const p of persons) {
    g.setNode(p.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  const flowEdges: Edge[] = [];
  for (const rel of relationships) {
    if (rel.relationship_type === 'parent') {
      g.setEdge(rel.person_id, rel.related_person_id);
      flowEdges.push({
        id: rel.id,
        source: rel.person_id,
        target: rel.related_person_id,
        type: 'smoothstep',
        style: { stroke: '#10b981', strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 18, height: 18 },
        data: { kind: 'parent' },
      });
    }
  }

  for (const rel of relationships) {
    if (rel.relationship_type === 'spouse') {
      flowEdges.push({
        id: rel.id,
        source: rel.person_id,
        target: rel.related_person_id,
        type: 'straight',
        style: { stroke: '#ec4899', strokeWidth: 1.5 },
        data: { kind: 'spouse' },
      });
    }
    if (rel.relationship_type === 'sibling') {
      flowEdges.push({
        id: rel.id,
        source: rel.person_id,
        target: rel.related_person_id,
        type: 'straight',
        style: { stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' },
        data: { kind: 'sibling' },
      });
    }
  }

  dagre.layout(g);

  const flowNodes: Node<FamilyTreeNodeData>[] = persons.map((p) => {
    const pos = g.node(p.id);
    return {
      id: p.id,
      type: 'person',
      data: { person: p, canDelete, onEdit, onDelete },
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      draggable: false,
      connectable: false,
      selectable: true,
    };
  });

  return { nodes: flowNodes, edges: flowEdges };
}

function TreeLegend() {
  const t = useTranslations('familias.tree');
  return (
    <div className="absolute left-3 top-3 z-10 rounded-md bg-white/90 px-3 py-2 text-[11px] text-zinc-600 backdrop-blur-sm dark:bg-zinc-900/90 dark:text-zinc-400">
      <ul className="space-y-1">
        <li className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-5 bg-emerald-500" />
          <span>{t('legend.parents')}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-5 bg-pink-500" />
          <span>{t('legend.spouses')}</span>
        </li>
        <li className="flex items-center gap-2">
          <span
            className="inline-block h-0.5 w-5"
            style={{
              backgroundImage: 'repeating-linear-gradient(to right, #94a3b8 0 4px, transparent 4px 7px)',
            }}
          />
          <span>{t('legend.siblings')}</span>
        </li>
      </ul>
    </div>
  );
}

export function FamilyTreeView({ familyId, persons, relationships, viewerRole }: Props) {
  const router = useRouter();
  const t = useTranslations('familias.tree');
  const [editing, setEditing] = useState<FamilyPersonRow | null>(null);
  const [selectedNode, setSelectedNode] = useState<FamilyPersonRow | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<SelectedEdge | null>(null);
  const [parentsForChild, setParentsForChild] = useState<FamilyPersonRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const isAdmin = viewerRole === 'owner' || viewerRole === 'admin';

  const handleEdit = useCallback((p: FamilyPersonRow) => {
    setEditing(p);
  }, []);

  const handleDelete = useCallback(
    (p: FamilyPersonRow) => {
      if (!isAdmin) return;
      const ok = window.confirm(t('confirmDeletePerson', { name: p.full_name }));
      if (!ok) return;
      setDeleteError(null);
      startTransition(async () => {
        const res = await deletePerson(p.id);
        if (!res.ok) {
          setDeleteError(res.error);
          return;
        }
        setSelectedNode(null);
        router.refresh();
      });
    },
    [isAdmin, router, t],
  );

  const { nodes, edges } = useMemo(
    () => buildLayout(persons, relationships, isAdmin, handleEdit, handleDelete),
    [persons, relationships, isAdmin, handleEdit, handleDelete],
  );

  const personById = useMemo(() => new Map(persons.map((p) => [p.id, p])), [persons]);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const p = personById.get(node.id);
      if (p) setSelectedNode(p);
    },
    [personById],
  );

  const onEdgeClick = useCallback(
    (_: unknown, edge: Edge) => {
      const rel = relationships.find((r) => r.id === edge.id);
      if (!rel) return;
      const source = personById.get(rel.person_id);
      const target = personById.get(rel.related_person_id);
      if (!source || !target) return;
      setSelectedEdge({
        id: rel.id,
        kind: rel.relationship_type,
        source,
        target,
      });
    },
    [relationships, personById],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t('heading', { count: persons.length })}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <AddPersonDialog familyId={familyId} />
          <LinkRelationshipDialog familyId={familyId} persons={persons} />
        </div>
      </div>

      {deleteError && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
          {deleteError}
        </div>
      )}

      {persons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t('empty')}
          </p>
        </div>
      ) : (
        <div className="relative h-[640px] w-full overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <TreeLegend />
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={NODE_TYPES}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              minZoom={0.2}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#e5e7eb" gap={24} />
              <Controls showInteractive={false} />
              <MiniMap pannable zoomable className="!bg-white dark:!bg-zinc-900" />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      )}

      <EditPersonDialog person={editing} onClose={() => setEditing(null)} />

      <PersonInfoPanel
        person={selectedNode}
        canDelete={isAdmin}
        canEditAvatar={Boolean(viewerRole)}
        onClose={() => setSelectedNode(null)}
        onEdit={(p) => {
          setSelectedNode(null);
          setEditing(p);
        }}
        onDelete={(p) => {
          setSelectedNode(null);
          handleDelete(p);
        }}
        onAddParents={(p) => {
          setSelectedNode(null);
          setParentsForChild(p);
        }}
      />

      <EditEdgeDialog
        selected={selectedEdge}
        onClose={() => setSelectedEdge(null)}
      />

      <AddParentsDialog
        familyId={familyId}
        child={parentsForChild}
        existingPersons={persons}
        onClose={() => setParentsForChild(null)}
      />
    </div>
  );
}
