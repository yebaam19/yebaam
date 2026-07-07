import { describe, expect, it, vi } from 'vitest';

const { revalidatePathMock } = vi.hoisted(() => ({ revalidatePathMock: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }));

import { revalidateBusinessAdmin } from './revalidate-admin';

/**
 * PRA-001 regression guard: cada mutación de productos/promociones/media
 * dejó de reflejarse en el panel admin porque ninguna acción invalidaba la
 * ruta admin (solo la pública). Este test fija el contrato del helper para
 * que un futuro cambio no rompa silenciosamente la ruta exacta esperada.
 */
describe('revalidateBusinessAdmin', () => {
  it('invalida la ruta admin concreta para el negocio y sección dados', () => {
    revalidatePathMock.mockClear();
    revalidateBusinessAdmin('biz-123', 'productos');
    expect(revalidatePathMock).toHaveBeenCalledWith('/negocios/admin/biz-123/productos');
  });

  it('usa el businessId real, no el template [businessId]', () => {
    revalidatePathMock.mockClear();
    revalidateBusinessAdmin('biz-456', 'media');
    const calledPath = revalidatePathMock.mock.calls[0]?.[0];
    expect(calledPath).not.toContain('[businessId]');
    expect(calledPath).toBe('/negocios/admin/biz-456/media');
  });
});
