import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import translations from '../../../messages/es/communities.json';
import { ShowcasePlayer } from '@/features/communities/components/showcase/ShowcasePlayer';
import { ShowcaseEditor } from '@/features/communities/components/showcase/ShowcaseEditor';
import { CommunityProfileHeader } from '@/features/communities/components/showcase/CommunityProfileHeader';
import type { LibraryAsset } from '@/features/communities/types/communityLibrary.types';
import type { Community } from '@/features/communities/types/community.types';
import type { ReactNode } from 'react';
const mocks = vi.hoisted(() => ({ save: vi.fn(), refresh: vi.fn(), assets: vi.fn(),
  player: { play: vi.fn(), muted: false, volume: 1 } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('@/features/communities/actions/showcase.actions', () => ({ saveCommunityShowcase: mocks.save }));
vi.mock('next/dynamic', () => ({ default: () => function Player(props: { src: string; onEnded: () => void; onError: () => void;
  onLoadedMetaData: () => void; streamRef: { current: typeof mocks.player | undefined } }) {
  props.streamRef.current = mocks.player;
  return <div data-testid="stream" data-uid={props.src}><button onClick={props.onEnded}>End video</button>
    <button onClick={props.onError}>Video error</button><button onClick={props.onLoadedMetaData}>Video ready</button></div>;
} }));
vi.mock('@/features/communities/components/showcase/CommunityIdentity', () => ({ CommunityIdentity: () => <h1>Community</h1> }));
vi.mock('@/features/communities/actions/library/queries.actions', () => ({ loadLibraryAssets: mocks.assets }));
const communityId = '11111111-1111-4111-8111-111111111111';
const videos = Array.from({ length: 4 }, (_, index) => ({ id: `22222222-2222-4222-8222-22222222222${index}`,
  community_id: communityId, kind: 'video', title: `Video ${index + 1}`, media_id: `stream-${index}`, duration_seconds: 90,
  visibility: 'public', is_published: true } as LibraryAsset));
function view(node: ReactNode) {
  return render(<NextIntlClientProvider locale="es" messages={{ communities: translations }}>{node}</NextIntlClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); mocks.player.muted = false; mocks.player.play.mockReset().mockResolvedValue(undefined);
  mocks.assets.mockResolvedValue({ ok: true, data: { items: videos, nextCursor: null } });
  mocks.save.mockResolvedValue({ ok: false, error: 'Conflicto: vuelve a intentarlo' }); });
describe('Showcase playback', () => {
  it('loads no player until a viewer clicks and does not advance without opt-in', () => {
    view(<ShowcasePlayer videos={videos} />);
    expect(screen.queryByTestId('stream')).toBeNull();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Reproducir Video 1' }));
    expect(screen.getByTestId('stream')).toHaveAttribute('data-uid', 'stream-0');
    fireEvent.click(screen.getByRole('button', { name: 'End video' }));
    expect(screen.getByTestId('stream')).toHaveAttribute('data-uid', 'stream-0');
  });
  it('selects thumbnails in the main player and advances in configured order without looping', () => {
    view(<ShowcasePlayer videos={videos} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reproducir Video 3' }));
    expect(screen.getByTestId('stream')).toHaveAttribute('data-uid', 'stream-2');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'End video' }));
    expect(screen.getByTestId('stream')).toHaveAttribute('data-uid', 'stream-3');
    fireEvent.click(screen.getByRole('button', { name: 'End video' }));
    expect(screen.getByTestId('stream')).toHaveAttribute('data-uid', 'stream-3');
  });
  it('provides a retry for player failures', () => {
    view(<ShowcasePlayer videos={videos} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reproducir Video 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Video error' }));
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo reproducir');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('retries muted when the browser blocks autoplay with sound', async () => {
    view(<ShowcasePlayer videos={videos} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reproducir Video 1' }));
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'End video' }));
    expect(screen.getByTestId('stream')).toHaveAttribute('data-uid', 'stream-1');
    mocks.player.play.mockRejectedValueOnce(new DOMException('Blocked', 'NotAllowedError'));
    fireEvent.click(screen.getByRole('button', { name: 'Video ready' }));
    await waitFor(() => expect(mocks.player.play).toHaveBeenCalledTimes(2));
    expect(mocks.player.muted).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('silenció este video');
  });
});
describe('Showcase editing', () => {
  it('labels selected draft videos as invisible to visitors', () => {
    const draft = { ...videos[0], is_published: false };
    const initial = { id: communityId, community_id: communityId, version: 1, introduction: '', is_published: false,
      videos: [{ id: draft.id, asset_id: draft.id, community_id: communityId, position: 0, asset: draft }] };
    view(<ShowcaseEditor communityId={communityId} slug="test" initial={initial} onClose={vi.fn()} />);
    expect(screen.getByText('No visible para visitantes')).toBeTruthy();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
  it('stages selected videos locally and preserves text, order and publication after failed save', async () => {
    view(<ShowcaseEditor communityId={communityId} slug="test" initial={null} onClose={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Draft introduction' } });
    fireEvent.click(screen.getByRole('button', { name: 'Elegir video' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Adjuntar Video 2' }));
    expect(mocks.save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar presentación' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('textbox')).toHaveValue('Draft introduction');
    expect(screen.getAllByText('Video 2').length).toBeGreaterThan(0);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ videoAssetIds: [videos[1].id], expectedVersion: 0, isPublished: false }));
  });
  it('returns focus to the picker opener when keyboard users cancel', async () => {
    view(<ShowcaseEditor communityId={communityId} slug="test" initial={null} onClose={vi.fn()} />);
    const opener = screen.getByRole('button', { name: 'Elegir video' });
    fireEvent.click(opener);
    await screen.findByRole('button', { name: 'Adjuntar Video 2' });
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[0]);
    await waitFor(() => expect(opener).toHaveFocus());
  });
  it('requires removal confirmation and keeps the library link separate from the staged selection', async () => {
    const initial = { id: communityId, community_id: communityId, version: 3, introduction: 'Hello', is_published: true,
      videos: videos.slice(0, 2).map((asset, position) => ({ id: asset.id, asset_id: asset.id, community_id: communityId, position, asset })) };
    view(<ShowcaseEditor communityId={communityId} slug="test" initial={initial} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bajar Video 1' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Quitar' })[0]);
    expect(screen.getAllByText('Video 2').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(screen.queryByText('Video 2')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar presentación' }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ expectedVersion: 3, videoAssetIds: [videos[0].id] })));
    expect(screen.getByRole('link', { name: /Subir o editar videos/ })).toHaveAttribute('target', '_blank');
  });
  it('hides controls from readers and restores editor focus after cancellation', async () => {
    const community = { id: communityId, slug: 'test', description: 'Description' } as Community;
    const page = view(<CommunityProfileHeader community={community} canManageHeader={false} canEdit={false} showcase={null} />);
    expect(screen.queryByRole('button', { name: 'Editar presentación' })).toBeNull();
    page.unmount();
    view(<CommunityProfileHeader community={community} canManageHeader canEdit showcase={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar presentación' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar presentación' })).toHaveFocus());
  });
});
