import 'server-only';
import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let cachedClient: S3Client | null = null;

function creds() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const endpoint = process.env.R2_ENDPOINT;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    throw new Error(
      'R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT.',
    );
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, endpoint };
}

export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;
  const { accessKeyId, secretAccessKey, endpoint } = creds();
  cachedClient = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

export function getR2Bucket(): string {
  return creds().bucket;
}

/** Generate a short-lived presigned PUT URL the browser uploads the file to.
 *
 *  `contentLength` is **required and bound into the signature**, so the client
 *  cannot PUT a bigger object than it declared to the signing endpoint. It used
 *  to be optional, and both audio signers omitted it — which minted credentials
 *  authorising a write of any size, up to R2's per-PUT ceiling, to any caller
 *  who could reach the route. `ttlSeconds` lost its default in the same change:
 *  with two trailing numeric parameters, a default on the third would let a
 *  call site silently skip the fourth again. */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  ttlSeconds: number,
  contentLength: number,
): Promise<{ url: string; key: string }> {
  if (!Number.isInteger(contentLength) || contentLength <= 0) {
    throw new Error('getPresignedUploadUrl requires a positive integer contentLength');
  }
  const client = getR2Client();
  const bucket = getR2Bucket();
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  const url = await getSignedUrl(client, cmd, { expiresIn: ttlSeconds });
  return { url, key };
}

/** Generate a presigned GET URL for any stored object (audio, PDF documents).
 *  TTL 1h covers a long listening/reading session. When a custom public domain
 *  is configured later, this function can switch to returning an unsigned URL. */
export async function getPublicFileUrl(key: string, ttlSeconds = 3600): Promise<string> {
  const client = getR2Client();
  const bucket = getR2Bucket();
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, cmd, { expiresIn: ttlSeconds });
}

/** Alias histórico: los call sites de audio (música, chat) siguen usando el
 *  nombre audio-*; la implementación es genérica por clave R2. */
export const getPublicAudioUrl = getPublicFileUrl;

export async function deleteFile(key: string): Promise<void> {
  const client = getR2Client();
  const bucket = getR2Bucket();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** Alias histórico — ver nota en getPublicAudioUrl. */
export const deleteAudio = deleteFile;

/** Stream a remote audio file directly into R2. Used by the music importer
 *  when bringing in tracks from archive.org / loc.gov / etc. The MP3 never
 *  hits our Next.js server's memory — fetch's response body is piped to S3. */
export async function uploadAudioFromUrl(
  remoteUrl: string,
  key: string,
  contentType: string,
): Promise<{ key: string; sizeBytes: number }> {
  const res = await fetch(remoteUrl, { headers: { 'User-Agent': 'Yebaam-MusicArchive/1.0' } });
  if (!res.ok || !res.body) {
    throw new Error(`fetch ${remoteUrl} → ${res.status}`);
  }
  const sizeHeader = res.headers.get('content-length');
  const contentLength = sizeHeader ? Number(sizeHeader) : undefined;

  // The S3 SDK's PutObjectCommand with a stream Body requires a known
  // content length (it can't chunk-encode by default). For unknown lengths,
  // buffer the body — for tracks under ~50 MB this is acceptable. Larger
  // files (rare for music) would need MultipartUpload.
  let body: Uint8Array | ReadableStream<Uint8Array>;
  let finalLength: number;
  if (contentLength && contentLength > 0) {
    body = res.body;
    finalLength = contentLength;
  } else {
    const buf = new Uint8Array(await res.arrayBuffer());
    body = buf;
    finalLength = buf.byteLength;
  }

  const client = getR2Client();
  const bucket = getR2Bucket();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: finalLength,
    }),
  );
  return { key, sizeBytes: finalLength };
}

/** HEAD an object to confirm it exists and capture size + content-type.
 *  Used by createTrack (audio) and by the professional-services CV patch
 *  (PDF) to validate the upload before persisting the row. */
export async function headFile(
  key: string,
): Promise<{ exists: true; sizeBytes: number; contentType: string | null } | { exists: false }> {
  const client = getR2Client();
  const bucket = getR2Bucket();
  try {
    const res = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return {
      exists: true,
      sizeBytes: typeof res.ContentLength === 'number' ? res.ContentLength : 0,
      contentType: res.ContentType ?? null,
    };
  } catch {
    return { exists: false };
  }
}

/** Alias histórico — ver nota en getPublicAudioUrl. */
export const headAudio = headFile;
