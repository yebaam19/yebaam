import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import messages from '../../../messages/es/communities.json';
import { PlanItemForm } from '@/features/communities/components/plans/PlanItemForm';
import { PlanSectionSettings } from '@/features/communities/components/plans/PlanSectionSettings';
import { PlanWorkspace } from '@/features/communities/components/plans/PlanWorkspace';
import type { CommunitySection, PlanAxis, PlanPoint } from '@/features/communities/types/communityPlan.types';

const mocks = vi.hoisted(() => ({ save: vi.fn(), section: vi.fn(), refresh: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }) }));
vi.mock('next/dynamic', () => ({ default: () => function Editor() { return null; } }));
vi.mock('@/features/communities/actions/plans/content.actions', () => ({ savePlanItem: mocks.save, movePlanItem: vi.fn(), deletePlanItem: vi.fn() }));
vi.mock('@/features/communities/actions/plans/queries.actions', () => ({ loadPlanAxes: vi.fn(), loadPlanPoints: vi.fn() }));
vi.mock('@/features/communities/actions/plans/sections.actions', () => ({ saveCommunitySection: mocks.section, importCommunityRules: vi.fn() }));

function mount(children: ReactNode) {
  return render(<NextIntlClientProvider locale="es" timeZone="America/Bogota" messages={{ communities: messages }}>{children}</NextIntlClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.save.mockResolvedValue({ ok: false, error: 'No se pudo guardar. Inténtalo de nuevo.' });
  mocks.section.mockResolvedValue({ ok: false, error: 'No se pudo guardar. Inténtalo de nuevo.' });
});

const section: CommunitySection = { id: 'section', community_id: 'community', kind: 'government', title: 'Programa', position: 0, is_visible: true, version: 1 };
const axis: PlanAxis = { id: 'axis', community_id: 'community', section_id: 'section', title: 'Trabajo', description: '', position: 0, is_published: true, version: 1 };
const points: PlanPoint[] = ['Primero', 'Segundo'].map((title, position) => ({ ...axis, id: title, axis_id: axis.id, title, position, content: '<p>Propuesta.</p>' }));
function workspace() {
  return <PlanWorkspace section={section} axes={{ items: [axis], nextCursor: null }} selectedAxis={axis}
    points={{ items: points, nextCursor: null }} capabilities={{ settings: true, plans: true, content: true, moderation: true }} basePath="/test" />;
}

describe('failed plan writes preserve user input', () => {
  it('retains the item fields and stable creation ID when retrying', async () => {
    const onClose = vi.fn();
    mount(<PlanItemForm communityId="community" sectionId="section" kind="axis" basePath="/test" onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Economía local' } });
    fireEvent.change(screen.getByLabelText('Descripción breve'), { target: { value: 'Propuesta en revisión.' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar'));
    expect(screen.getByLabelText('Título')).toHaveValue('Economía local');
    expect(screen.getByLabelText('Descripción breve')).toHaveValue('Propuesta en revisión.');
    expect(screen.getByRole('checkbox')).toBeChecked();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
    expect(mocks.save.mock.calls[1][0]).toEqual(mocks.save.mock.calls[0][0]);
    expect(onClose).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it('retains custom section title, position, and visibility on failure', async () => {
    mount(<PlanSectionSettings communityId="community" kind="government" />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Nuestro programa' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Crear sección' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar'));
    expect(screen.getByRole('textbox')).toHaveValue('Nuestro programa');
    expect(screen.getByRole('spinbutton')).toHaveValue(7);
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it('blocks unrelated writes and axis navigation until the editor is saved or cancelled', async () => {
    mount(workspace());
    fireEvent.click(screen.getByRole('button', { name: 'Agregar punto' }));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Borrador sin guardar' } });
    const second = screen.getByText('2. Segundo').closest('article')!;
    fireEvent.click(within(second).getByText('Acciones del punto'));
    expect(within(second).getByRole('button', { name: 'Ocultar' })).toBeDisabled();
    expect(within(second).getByRole('button', { name: 'Subir Segundo' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Trabajo' })).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(within(second).getByRole('button', { name: 'Ocultar' }));
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Título')).toHaveValue('Borrador sin guardar');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(within(second).getByRole('button', { name: 'Ocultar' })).toBeEnabled();
    mocks.save.mockResolvedValueOnce({ ok: true, data: { id: 'Segundo' } });
    fireEvent.click(within(second).getByRole('button', { name: 'Ocultar' }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
  });
  it('protects unsaved section settings from other mutations', () => {
    mount(workspace());
    fireEvent.click(screen.getByText('Configurar título y visibilidad'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Título en edición' } });
    expect(screen.getByRole('button', { name: 'Agregar punto' })).toBeDisabled();
    for (const button of screen.getAllByRole('button', { name: 'Ocultar' })) expect(button).toBeDisabled();
    expect(screen.getByRole('textbox')).toHaveValue('Título en edición');
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
