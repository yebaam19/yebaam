'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import dagre from 'dagre';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FamilyTreeNodeCard, type FamilyTreeNodeData } from './FamilyTreeNodeCard';
import { AddPersonDialog } from './AddPersonDialog';
import { LinkRelationshipDialog } from './LinkRelationshipDialog';
import { EditPersonDialog } from './EditPersonDialog';
import { deletePerson } from '../actions/families.actions';
import type {
  FamilyMemberRole,
  FamilyPersonRow,
  FamilyRelationshipRow,
} from '../types/family.types';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 92;
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
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 100, edgesep: 30 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const p of persons) {
    g.setNode(p.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  const flowEdges: Edge[] = [];
  for (const rel of relationships) {
    if (rel.relationship_type === 'parent') {
      g.setEdge(rel.person_id, rel.related_person_id);
      flowEdges.push({
        id: `parent-${rel.id}`,
        source: rel.person_id,
        target: rel.related_person_id,
        type: 'smoothstep',
        style: { stroke: '#10b981', strokeWidth: 1.5 },
      });
    }
  }

  for (const rel of relationships) {
    if (rel.relationship_type === 'spouse') {
      flowEdges.push({
        id: `spouse-${rel.id}`,
        source: rel.person_id,
        target: rel.related_person_id,
        type: 'straight',
        style: { stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '4 2' },
        label: '♥',
        labelStyle: { fontSize: 12, fill: '#f59e0b' },
      });
    }
    if (rel.relationship_type === 'sibling') {
      flowEdges.push({
        id: `sibling-${rel.id}`,
        source: rel.person_id,
        target: rel.related_person_id,
        type: 'straight',
        style: { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '2 2' },
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

export function FamilyTreeView({ familyId, persons, relationships, viewerRole }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<FamilyPersonRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const isAdmin = viewerRole === 'owner' || viewerRole === 'admin';

  const handleEdit = useCallback((p: FamilyPersonRow) => {
    setEditing(p);
  }, []);

  const handleDelete = useCallback(
    (p: FamilyPersonRow) => {
      if (!isAdmin) return;
      const ok = window.confirm(
        `¿Eliminar a "${p.full_name}" del árbol? Esto borra también sus relaciones, eventos y fotos asociadas.`,
      );
      if (!ok) return;
      setDeleteError(null);
      startTransition(async () => {
        const res = await deletePerson(p.id);
        if (!res.ok) {
          setDeleteError(res.error);
          return;
        }
        router.refresh();
      });
    },
    [isAdmin, router],
  );

  const { nodes, edges } = useMemo(
    () => buildLayout(persons, relationships, isAdmin, handleEdit, handleDelete),
    [persons, relationships, isAdmin, handleEdit, handleDelete],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Árbol genealógico ({persons.length}{' '}
          {persons.length === 1 ? 'persona' : 'personas'})
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
            Aún no hay personas en este árbol. Empieza agregando familiares vivos o fallecidos.
          </p>
        </div>
      ) : (
        <div className="h-[640px] w-full overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={NODE_TYPES}
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
    </div>
  );
}
