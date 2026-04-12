'use client';

import { useState, useMemo } from 'react';
import { FamilyMember, FamilyTreeData } from './types';
import { mockFamilyTree } from './mockData';
import { FamilyMemberCard } from './FamilyMemberCard';

import { PlusIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { AddMemberModal } from './AddMemberModal';

interface TreeNode {
  member: FamilyMember;
  spouse?: FamilyMember;
  children: TreeNode[];
}

export function FamilyTree() {
  const [treeData, setTreeData] = useState<FamilyTreeData>(mockFamilyTree);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addRelativeToId, setAddRelativeToId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.8);

  // Build hierarchical tree structure
  const treeStructure = useMemo(() => {
    const buildTree = (memberId: string, visited = new Set<string>()): TreeNode | null => {
      if (visited.has(memberId)) return null;
      visited.add(memberId);

      const member = treeData.members.find(m => m.id === memberId);
      if (!member) return null;

      const spouse = member.spouse ? treeData.members.find(m => m.id === member.spouse) : undefined;
      
      // Find children
      const children = treeData.members
        .filter(m => m.parents?.includes(memberId))
        .map(child => buildTree(child.id, visited))
        .filter((node): node is TreeNode => node !== null);

      return { member, spouse, children };
    };

    // Start from the root member
    return buildTree(treeData.rootMemberId);
  }, [treeData]);

  const handleAddMember = (newMember: Omit<FamilyMember, 'id'>) => {
    const id = `member-${Date.now()}`;
    const member: FamilyMember = {
      ...newMember,
      id,
    };

    setTreeData((prev) => ({
      ...prev,
      members: [...prev.members, member],
    }));
    setIsAddModalOpen(false);
    setAddRelativeToId(null);
  };

  const handleEditMember = (member: FamilyMember) => {
    setSelectedMember(member);
    setIsAddModalOpen(true);
  };

  const handleAddRelative = (memberId: string) => {
    setAddRelativeToId(memberId);
    setIsAddModalOpen(true);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.4));
  const handleResetZoom = () => setZoom(0.8);

  // Recursive component to render tree nodes
  const TreeNode = ({ node, isRoot = false }: { node: TreeNode; isRoot?: boolean }) => {
    const hasChildren = node.children.length > 0;
    const hasSpouse = !!node.spouse;

    return (
      <div className="flex flex-col items-center">
        {/* Current node (member + spouse if exists) */}
        <div className="relative">
          <div className="flex items-center gap-4">
            <FamilyMemberCard
              member={node.member}
              onEdit={handleEditMember}
              onAddRelative={handleAddRelative}
              isHighlighted={node.member.id === treeData.rootMemberId}
            />
            
            {hasSpouse && node.spouse && (
              <>
                {/* Marriage line */}
                <div className="relative flex items-center">
                  <div className="w-12 h-1 bg-red-400 rounded"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                      ❤️
                    </div>
                  </div>
                </div>
                <FamilyMemberCard
                  member={node.spouse}
                  onEdit={handleEditMember}
                  onAddRelative={handleAddRelative}
                />
              </>
            )}
          </div>

          {/* Vertical line down to children */}
          {hasChildren && (
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-12 bg-green-600 dark:bg-green-500" 
                 style={{ top: '100%' }}></div>
          )}
        </div>

        {/* Children section */}
        {hasChildren && (
          <div className="relative mt-12">
            {/* Horizontal line connecting all children */}
            {node.children.length > 1 && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-600 dark:bg-green-500" 
                   style={{ 
                     width: `calc(100% - ${240}px)`,
                     left: '50%',
                     transform: 'translateX(-50%)'
                   }}></div>
            )}

            {/* Children nodes */}
            <div className="flex gap-16 pt-1">
              {node.children.map((child, index) => (
                <div key={child.member.id} className="relative">
                  {/* Vertical line from horizontal bar to child */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-1 h-12 bg-green-600 dark:bg-green-500"></div>
                  <TreeNode node={child} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render parents above root
  const renderAncestors = () => {
    const rootMember = treeData.members.find(m => m.id === treeData.rootMemberId);
    if (!rootMember || !rootMember.parents || rootMember.parents.length === 0) return null;

    const parents = rootMember.parents
      .map(id => treeData.members.find(m => m.id === id))
      .filter((m): m is FamilyMember => m !== undefined);

    if (parents.length === 0) return null;

    // Build parent couples
    const parentCouples: Array<{ p1: FamilyMember; p2?: FamilyMember }> = [];
    const processed = new Set<string>();

    parents.forEach(parent => {
      if (processed.has(parent.id)) return;
      processed.add(parent.id);

      const spouse = parent.spouse ? parents.find(p => p.id === parent.spouse) : undefined;
      if (spouse) processed.add(spouse.id);

      parentCouples.push({ p1: parent, p2: spouse });
    });

    // Get grandparents
    const grandparents = parents.flatMap(p => p.parents || [])
      .map(id => treeData.members.find(m => m.id === id))
      .filter((m): m is FamilyMember => m !== undefined);

    const grandparentCouples: Array<{ p1: FamilyMember; p2?: FamilyMember }> = [];
    const processedGP = new Set<string>();

    grandparents.forEach(gp => {
      if (processedGP.has(gp.id)) return;
      processedGP.add(gp.id);

      const spouse = gp.spouse ? grandparents.find(g => g.id === gp.spouse) : undefined;
      if (spouse) processedGP.add(spouse.id);

      grandparentCouples.push({ p1: gp, p2: spouse });
    });

    return (
      <div className="flex flex-col items-center mb-12">
        {/* Grandparents */}
        {grandparentCouples.length > 0 && (
          <div className="mb-12">
            <div className="flex gap-24 mb-8">
              {grandparentCouples.map((couple, idx) => (
                <div key={couple.p1.id} className="relative flex items-center gap-4">
                  <FamilyMemberCard member={couple.p1} onEdit={handleEditMember} onAddRelative={handleAddRelative} />
                  {couple.p2 && (
                    <>
                      <div className="relative flex items-center">
                        <div className="w-12 h-1 bg-red-400 rounded"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">❤️</div>
                        </div>
                      </div>
                      <FamilyMemberCard member={couple.p2} onEdit={handleEditMember} onAddRelative={handleAddRelative} />
                    </>
                  )}
                  {/* Line down to parents */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-12 bg-green-600 dark:bg-green-500" 
                       style={{ top: '100%' }}></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parents */}
        <div className="relative">
          <div className="flex gap-24">
            {parentCouples.map(couple => (
              <div key={couple.p1.id} className="relative flex items-center gap-4">
                <FamilyMemberCard member={couple.p1} onEdit={handleEditMember} onAddRelative={handleAddRelative} />
                {couple.p2 && (
                  <>
                    <div className="relative flex items-center">
                      <div className="w-12 h-1 bg-red-400 rounded"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">❤️</div>
                      </div>
                    </div>
                    <FamilyMemberCard member={couple.p2} onEdit={handleEditMember} onAddRelative={handleAddRelative} />
                  </>
                )}
              </div>
            ))}
          </div>
          {/* Line down to root */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-12 bg-green-600 dark:bg-green-500" 
               style={{ top: '100%' }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
      {/* Controls */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              Agregar Familiar
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
              Zoom: {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Alejar"
            >
              <MagnifyingGlassMinusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Restablecer zoom"
            >
              <ArrowsPointingOutIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Acercar"
            >
              <MagnifyingGlassPlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tree Container */}
      <div className="overflow-auto p-16 bg-linear-to-b from-amber-50 to-green-50 dark:from-gray-900 dark:to-gray-800 min-h-[600px]">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.3s ease',
          }}
          className="inline-block min-w-full"
        >
          <div className="flex flex-col items-center">
            {/* Ancestors (parents and grandparents) */}
            {renderAncestors()}

            {/* Root and descendants */}
            {treeStructure && <TreeNode node={treeStructure} isRoot={true} />}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <AddMemberModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedMember(null);
            setAddRelativeToId(null);
          }}
          onSave={handleAddMember}
          existingMember={selectedMember}
          relativeToId={addRelativeToId}
        />
      )}
    </div>
  );
}
