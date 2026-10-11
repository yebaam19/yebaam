import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { Session } from '@/features/families/actions/families-helpers';
import { canUploadFamilyDocument } from '@/features/families/server/document-upload.server';
import { addDocument, getDocumentSignedUrl } from '@/features/families/actions/families-documents.actions';
import { POST } from '@/app/api/families/[familyId]/documents/upload-url/route';

const { requireSession, getPresignedUploadUrl, getPublicFileUrl, headFile } = vi.hoisted(() => ({
  requireSession: vi.fn(), getPresignedUploadUrl: vi.fn(), getPublicFileUrl: vi.fn(), headFile: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/features/families/actions/families-helpers', () => ({ requireSession, revalidateFamilyPaths: vi.fn() }));
vi.mock('@/lib/cloudflare/r2', () => ({ getPresignedUploadUrl, getPublicFileUrl, headFile }));
vi.mock('@/lib/api/rate-limit', () => ({ checkRateLimit: () => ({ ok: true }) }));

const familyId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
function session(family: unknown, member: unknown, error: unknown = null): Session {
  const client = { from: (table: string) => {
    const query = {
      select: () => query,
      eq: () => query,
      maybeSingle: async () => ({ data: table === 'families' ? family : member, error }),
    };
    return query;
  } };
  return { userId, client } as unknown as Session;
}
function request(body: unknown = { contentType: 'application/pdf', sizeBytes: 123 }) {
  return new NextRequest('http://localhost/api/upload', { method: 'POST', body: JSON.stringify(body) });
}
const context = { params: Promise.resolve({ familyId }) };
beforeEach(() => {
  vi.clearAllMocks();
  getPresignedUploadUrl.mockResolvedValue({ url: 'https://r2.test/upload' });
});

describe('family document upload authorization', () => {
  it('requires membership and honors the member upload switch', async () => {
    const family = { owner_id: 'owner', member_can_add_documents: false };
    expect(await canUploadFamilyDocument(session(family, null), familyId)).toBe(false);
    expect(await canUploadFamilyDocument(session(family, { role: 'member' }), familyId)).toBe(false);
    expect(await canUploadFamilyDocument(session(family, { role: 'admin' }), familyId)).toBe(true);
    expect(await canUploadFamilyDocument(session({ ...family, member_can_add_documents: true }, { role: 'member' }), familyId)).toBe(true);
    expect(await canUploadFamilyDocument(session({ ...family, owner_id: userId }, null), familyId)).toBe(true);
    expect(await canUploadFamilyDocument(session(family, { role: 'admin' }, { message: 'offline' }), familyId)).toBe(false);
  });
  it('never signs for anonymous users or non-members', async () => {
    requireSession.mockResolvedValue(null);
    expect((await POST(request(), context)).status).toBe(401);
    requireSession.mockResolvedValue(session({ owner_id: 'other', member_can_add_documents: true }, null));
    expect((await POST(request(), context)).status).toBe(403);
    expect(getPresignedUploadUrl).not.toHaveBeenCalled();
  });
  it('rejects spoofed MIME, fractional sizes, empty and oversized uploads before signing', async () => {
    requireSession.mockResolvedValue(session({ owner_id: userId }, null));
    for (const sizeBytes of [0, -1, 1.5, 10_485_761]) {
      expect((await POST(request({ contentType: 'application/pdf', sizeBytes }), context)).status).toBe(400);
    }
    expect((await POST(request({ contentType: 'text/html', sizeBytes: 1 }), context)).status).toBe(400);
    expect(getPresignedUploadUrl).not.toHaveBeenCalled();
  });
  it('binds the declared size, short expiry and server-owned path into the signature', async () => {
    requireSession.mockResolvedValue(session({ owner_id: userId }, null));
    const response = await POST(request({ contentType: 'application/pdf', sizeBytes: 123, key: 'victim/file.pdf' }), context);
    expect(response.status).toBe(200);
    expect(getPresignedUploadUrl).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`^${userId}/families/${familyId}/[0-9a-f-]+\\.pdf$`)),
      'application/pdf', 300, 123,
    );
  });
});

describe('family document references', () => {
  it('rejects another user’s or family’s R2 key before checking the object', async () => {
    requireSession.mockResolvedValue(session({ owner_id: userId }, null));
    const result = await addDocument({ familyId, kind: 'other', title: 'PDF',
      storagePath: `r2:victim/families/${familyId}/33333333-3333-4333-8333-333333333333.pdf`,
    });
    expect(result.ok).toBe(false);
    expect(headFile).not.toHaveBeenCalled();
  });
  it('does not issue R2 URLs for invisible rows or references outside the recorded uploader/family', async () => {
    const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    requireSession.mockResolvedValue({ userId, client: { from: () => query } });
    query.maybeSingle.mockResolvedValueOnce({ data: null });
    expect((await getDocumentSignedUrl('missing')).ok).toBe(false);
    query.maybeSingle.mockResolvedValueOnce({ data: {
      uploaded_by: userId, family_id: familyId,
      storage_path: 'r2:victim/families/other/document.pdf',
    } });
    expect((await getDocumentSignedUrl('forged')).ok).toBe(false);
    expect(getPublicFileUrl).not.toHaveBeenCalled();
  });
});
