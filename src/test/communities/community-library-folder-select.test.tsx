import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { expect, it, vi } from 'vitest';
import translations from '../../../messages/es/communities.json';
import { LibraryFolderSelect } from '@/features/communities/components/library/LibraryFolderSelect';
import type { FolderPage } from '@/features/communities/types/communityLibrary.types';

vi.mock('@/features/communities/actions/library/queries.actions', () => ({ loadAssetFolders: vi.fn() }));

const empty: FolderPage = { items: [], nextCursor: null };
const populated: FolderPage = { items: [{
  id: '11111111-1111-4111-8111-111111111111', community_id: '22222222-2222-4222-8222-222222222222',
  kind: 'document', title: 'QA documentos privados', is_visible: false, version: 1,
}], nextCursor: null };

it('shows a newly created folder after the server refreshes the same library view', () => {
  function field(initial: FolderPage) {
    return <NextIntlClientProvider locale="es" messages={{ communities: translations }}>
      <LibraryFolderSelect communityId="22222222-2222-4222-8222-222222222222" kind="document" initial={initial} includeAll />
    </NextIntlClientProvider>;
  }
  const view = render(field(empty));
  expect(screen.queryByRole('option', { name: /QA documentos privados/ })).toBeNull();
  view.rerender(field(populated));
  expect(screen.getByRole('option', { name: /QA documentos privados/ })).toBeTruthy();
});
