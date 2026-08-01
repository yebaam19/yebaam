import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { AlbumsTable } from './AlbumsTable';
import type { AdminAlbumListItem } from '../../../types/music.types';

/**
 * The admin "Descargar" affordance is a real `<a href>` (the response is a
 * streamed .zip attachment, so it must be a browser navigation, not a fetch).
 * This test pins the URL contract with `/api/admin/music/albums/[id]/download`
 * and — by feeding the component the actual `messages/es/musica.json` — fails
 * if the i18n keys behind the button ever go missing.
 */

const messages = { musica: JSON.parse(readFileSync('messages/es/musica.json', 'utf8')) };

const row: AdminAlbumListItem = {
  id: '11111111-2222-3333-4444-555555555555',
  title: 'Duo Los Ahijados',
  slug: 'duo-los-ahijados-1966',
  year: 1966,
  country: null,
  format: 'lp',
  cover_cf_image_id: null,
  catalog_number: 'mt 139',
  condition: null,
  for_trade: false,
  artist_id: 'aaaa',
  artist_name: 'Duo Los Ahijados',
  track_count: 12,
};

function renderTable() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AlbumsTable
        rows={[row]}
        selected={new Set()}
        allOnPageSelected={false}
        pending={false}
        onToggleSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    </NextIntlClientProvider>,
  );
}

describe('AlbumsTable', () => {
  it('links each album to its admin-only .zip export', () => {
    renderTable();
    const link = screen.getByRole('link', { name: 'Descargar' });
    expect(link).toHaveAttribute('href', `/api/admin/music/albums/${row.id}/download`);
    expect(link).toHaveAttribute('title', expect.stringContaining('.zip'));
  });

  it('keeps edit and delete alongside it', () => {
    renderTable();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
  });
});
