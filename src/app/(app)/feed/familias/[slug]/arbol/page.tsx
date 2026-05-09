import { notFound } from 'next/navigation';
import {
  getFamilyBySlug,
  getFamilyPersons,
  getFamilyRelationships,
} from '@/features/families/server/families.server';
import { FamilyTreeView } from '@/features/families/components/FamilyTreeView';

export const metadata = { title: 'Árbol genealógico' };

export default async function FamilyTreePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const family = await getFamilyBySlug(slug);
  if (!family) notFound();
  if (!family.viewer_role) return null;

  const [persons, relationships] = await Promise.all([
    getFamilyPersons(family.id),
    getFamilyRelationships(family.id),
  ]);

  return (
    <FamilyTreeView
      familyId={family.id}
      persons={persons}
      relationships={relationships}
      viewerRole={family.viewer_role}
    />
  );
}
