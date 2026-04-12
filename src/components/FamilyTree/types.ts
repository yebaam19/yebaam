export interface FamilyMember {
  id: string;
  name: string;
  photo?: string;
  birthYear?: number;
  deathYear?: number;
  gender: 'male' | 'female' | 'other';
  relationship: 'self' | 'parent' | 'grandparent' | 'child' | 'grandchild' | 'sibling' | 'spouse';
  parents?: string[]; // IDs of parents
  spouse?: string; // ID of spouse
  generation: number; // 0 for self, -1 for parents, -2 for grandparents, 1 for children, etc.
}

export interface FamilyTreeData {
  members: FamilyMember[];
  rootMemberId: string; // The person whose tree this is
}
