import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import messages from '../../../messages/es/communities.json';
import { CommunityInstitutionalNav } from '@/features/communities/components/CommunityInstitutionalNav';
import { PlanItemActions } from '@/features/communities/components/plans/PlanItemActions';
import { PlanAxes } from '@/features/communities/components/plans/PlanAxes';
import type { CommunitySection, PlanAxis } from '@/features/communities/types/communityPlan.types';

const mocks = vi.hoisted(() => ({ save: vi.fn(), remove: vi.fn(), move: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/feed/comunidades/test/planes/government', useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('@/features/communities/actions/plans/content.actions', () => ({ savePlanItem: mocks.save, deletePlanItem: mocks.remove, movePlanItem: mocks.move }));
vi.mock('@/features/communities/actions/plans/queries.actions', () => ({ loadPlanAxes: vi.fn() }));

const section: CommunitySection = {
  id: 'section', community_id: 'community', kind: 'government', title: 'Nuestro programa',
  position: 2, is_visible: true, version: 1,
};
const axis: PlanAxis = {
  id: 'axis', community_id: 'community', section_id: 'section', title: 'Trabajo',
  description: '', position: 0, is_published: false, version: 4,
};
function mount(children: ReactNode) {
  return render(<NextIntlClientProvider locale="es" timeZone="America/Bogota" messages={{ communities: messages }}>{children}</NextIntlClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.save.mockResolvedValue({ ok: true, data: { id: axis.id } });
  mocks.remove.mockResolvedValue({ ok: true, data: { id: axis.id } });
  mocks.move.mockResolvedValue({ ok: true, data: { id: axis.id } });
});

describe('institutional plans controls', () => {
  it('shows stored titles in organization-specific order', () => {
    mount(<CommunityInstitutionalNav slug="test" sections={[section, { ...section, id: 'rules', kind: 'rules', title: 'Estatutos', position: 0 }]}
      canManage={false} legacyRules={false} />);
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Estatutos', 'Nuestro programa']);
    expect(links[1]).toHaveAttribute('aria-current', 'page');
  });
  it('does not expose setup links or legacy fallback to a reader with no visible section', () => {
    mount(<CommunityInstitutionalNav slug="test" sections={[]} canManage={false} legacyRules={false} />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
  it('confirms deletion before executing a versioned mutation', async () => {
    mount(<PlanItemActions item={axis} kind="axis" onEdit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Trabajo' }));
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(screen.getByText(/todos sus puntos/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith(expect.objectContaining({ id: 'axis', expectedVersion: 4, confirmed: true })));
  });
  it('keeps data intact when deletion is cancelled', () => {
    mount(<PlanItemActions item={axis} kind="axis" onEdit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Trabajo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Sí, eliminar' })).not.toBeInTheDocument();
  });
  it('publishes the current revision and announces a failed write', async () => {
    mocks.save.mockResolvedValueOnce({ ok: false, error: 'El contenido cambió.' });
    mount(<PlanItemActions item={axis} kind="axis" onEdit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('El contenido cambió.'));
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ isPublished: true, expectedVersion: 4 }));
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it('does not offer edit or reorder controls to readers', () => {
    mount(<PlanAxes section={section} initial={{ items: [axis], nextCursor: null }} basePath="/test" canEdit={false} onCreate={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Ordenar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nuevo eje' })).not.toBeInTheDocument();
  });
  it('prevents down-one from sending an item to the end of unloaded pages', () => {
    const axes = Array.from({ length: 30 }, (_, i) => ({ ...axis, id: `axis-${i}`, title: `Eje ${i}`, position: i }));
    mount(<PlanAxes section={section} initial={{ items: axes, nextCursor: { id: 'axis-29', position: 29 } }}
      basePath="/test" canEdit onCreate={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ordenar' }));
    expect(screen.getByRole('button', { name: 'Bajar Eje 28' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bajar Eje 27' })).toBeEnabled();
  });
  it('moves an item using the next sibling after its destination', async () => {
    const axes = [axis, { ...axis, id: 'second', title: 'Salud' }, { ...axis, id: 'third', title: 'Educación' }];
    mount(<PlanAxes section={section} initial={{ items: axes, nextCursor: null }} basePath="/test" canEdit onCreate={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ordenar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bajar Trabajo' }));
    await waitFor(() => expect(mocks.move).toHaveBeenCalledWith(expect.objectContaining({ id: axis.id, beforeId: 'third', expectedVersion: 4 })));
  });
});
