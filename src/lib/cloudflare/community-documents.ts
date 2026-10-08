import 'server-only';
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Bucket, getR2Client } from './r2';
import { attachmentDisposition } from '@/lib/http/content-disposition';

export async function signLibraryDocument(key: string, filename: string, contentType: string, preview: boolean) {
  const inline = preview && ['application/pdf', 'text/plain'].includes(contentType);
  const disposition = attachmentDisposition(filename);
  const command = new GetObjectCommand({
    Bucket: getR2Bucket(), Key: key,
    ResponseContentType: contentType,
    ResponseContentDisposition: inline ? disposition.replace(/^attachment/, 'inline') : disposition,
    ResponseCacheControl: 'private, no-store',
  });
  return getSignedUrl(getR2Client(), command, { expiresIn: 60 });
}

export async function deleteLibraryDocument(key: string) {
  await getR2Client().send(new DeleteObjectCommand({ Bucket: getR2Bucket(), Key: key }),
    { abortSignal: AbortSignal.timeout(15000) });
}
