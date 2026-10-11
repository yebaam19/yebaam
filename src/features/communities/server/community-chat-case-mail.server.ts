import 'server-only';
import { z } from 'zod';
import { getServiceClient } from '@/utils/supabase/server';

const jobSchema = z.object({
  case_id: z.uuid(), recipient_email: z.email(), reason: z.string().min(10).max(500),
  lease_token: z.uuid(), first_attempt_at: z.iso.datetime({ offset: true }),
});
type Job = z.infer<typeof jobSchema>;
const MAX_IDEMPOTENT_AGE_MS = 23 * 60 * 60 * 1000;

async function sendNotice(job: Job, apiKey: string): Promise<'sent' | 'retry' | 'permanent_failure'> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `community-chat-case/${job.case_id}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? 'Yebaam <noreply@yebaam.com>',
        to: [job.recipient_email],
        subject: '[Yebaam] Apertura de revisión del chat comunitario',
        text: `Se abrió una revisión de tu participación en un chat comunitario. Todavía no se aplicó una restricción.\n\nMotivo: ${job.reason}\n\nExpediente: ${job.case_id}\n\nPuedes presentar tus descargos durante 48 horas desde este aviso en el chat de la comunidad, desde tus notificaciones de Yebaam.`,
      }),
    });
    if (response.ok) return 'sent';
    return response.status >= 400 && response.status < 500
      && response.status !== 408 && response.status !== 409 && response.status !== 429
      ? 'permanent_failure' : 'retry';
  } catch { return 'retry'; }
  finally { clearTimeout(timeout); }
}

/** Internal worker: claims only DB-owned targets and never logs recipient data. */
export async function processCommunityChatCaseMail() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('mail_not_configured');
  const client = getServiceClient();
  const { data, error } = await client.rpc('claim_community_chat_case_mail', { batch_size: 3 });
  if (error) throw new Error('mail_claim_failed');
  const jobs = z.array(jobSchema).max(3).parse(data);
  const outcomes = await Promise.all(jobs.map(async (job) => {
    const expired = Date.now() - Date.parse(job.first_attempt_at) > MAX_IDEMPOTENT_AGE_MS;
    const outcome = expired ? 'permanent_failure' : await sendNotice(job, apiKey);
    const ack = await client.rpc('finish_community_chat_case_mail', {
      target_case: job.case_id, claimed_lease: job.lease_token,
      succeeded: outcome === 'sent',
      failure_code: outcome === 'sent' ? null : outcome,
    });
    return outcome === 'sent' && !ack.error && ack.data === true;
  }));
  return { claimed: jobs.length, delivered: outcomes.filter(Boolean).length,
    pending: outcomes.filter((done) => !done).length };
}
