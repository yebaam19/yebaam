import 'server-only';
import { z } from 'zod';
import { getServiceClient } from '@/utils/supabase/server';
import { deleteImage, isCloudflareImageId } from '@/lib/cloudflare/images';
import { deleteStreamVideo, isStreamUid } from '@/lib/cloudflare/stream';
import { deleteLibraryDocument } from '@/lib/cloudflare/community-documents';

const jobSchema = z.object({
  id: z.string().regex(/^\d+$/), kind: z.enum(['image', 'video', 'document']),
  media_id: z.string(), lease_token: z.uuid(), attempts: z.number().int().positive(),
});
type Job = z.infer<typeof jobSchema>;
const documentKey = /^[a-f0-9-]{36}\/communities\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.(pdf|docx?|xlsx?|pptx?|txt|zip)$/i;

async function removeRemote(job: Job) {
  if (job.kind === 'image') {
    if (!isCloudflareImageId(job.media_id)) throw new Error('invalid_identifier');
    await deleteImage(job.media_id);
  } else if (job.kind === 'video') {
    if (!isStreamUid(job.media_id)) throw new Error('invalid_identifier');
    await deleteStreamVideo(job.media_id);
  } else {
    if (!documentKey.test(job.media_id)) throw new Error('invalid_identifier');
    await deleteLibraryDocument(job.media_id);
  }
}

/** Internal only: caller must be a verified mutation or secret-authenticated job.
 * No request-supplied identifiers are accepted; only the DB outbox owns targets. */
export async function processAssetCleanup() {
  const client = getServiceClient();
  const retired = await client.rpc('queue_abandoned_community_documents', { batch_size: 20 });
  if (retired.error) throw new Error('cleanup_abandoned_uploads_failed');
  const { data, error } = await client.rpc('claim_community_asset_deletions', { batch_size: 5 });
  if (error) throw new Error('cleanup_claim_failed');
  const jobs = z.array(jobSchema).max(5).parse(data);
  const outcomes = await Promise.all(jobs.map(async (job) => {
    let failure: string | null = null;
    try {
      const active = await client.from('community_library_assets').select('id')
        .eq('kind', job.kind).eq('media_id', job.media_id).is('deleted_at', null).limit(1);
      if (active.error || !active.data) failure = 'reference_check_failed';
      else if (active.data?.length) failure = 'active_reference';
      else if (job.kind === 'image' && !isCloudflareImageId(job.media_id)) failure = 'invalid_identifier';
      else if (job.kind === 'image') {
        const header = await client.from('communities').select('id')
          .or(`cover_image.eq.${job.media_id},profile_image.eq.${job.media_id}`).limit(1);
        if (header.error || !header.data) failure = 'reference_check_failed';
        else if (header.data.length) failure = 'active_reference';
        else await removeRemote(job);
      } else await removeRemote(job);
    } catch { failure = 'remote_delete_failed'; }
    // If acknowledgement is lost, the lease expires and the idempotent delete
    // runs again. Never erase the tombstone or log raw provider error/secrets.
    const ack = await client.rpc('finish_community_asset_deletion', {
      job_id: job.id, claimed_lease: job.lease_token, succeeded: failure === null, failure_code: failure,
    });
    return failure === null && !ack.error && ack.data === true;
  }));
  return { claimed: jobs.length, completed: outcomes.filter(Boolean).length, retrying: outcomes.filter((done) => !done).length };
}
