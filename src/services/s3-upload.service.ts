/**
 * S3 Upload Service — STUB
 *
 * The old S3 presigned-URL flow is gone. Media uploads now go through
 * InsForge storage buckets via `@insforge/sdk` (see profile-media.service.ts
 * and story.service.ts for the canonical pattern).
 *
 * This stub is kept so unmigrated callers surface a clear migration error
 * instead of a cryptic network failure. Delete it once every importer has
 * been ported.
 */

export interface S3UploadResult {
  url: string
  s3Key: string
  cloudFrontUrl: string
}

export interface UploadOptions {
  fileName: string
  fileType: string
  fileSize: number
  serviceId: string
}

class S3UploadService {
  async generatePresignedUrl(_opts: UploadOptions): Promise<never> {
    throw new Error(
      'S3 presigned-URL flow has been removed. Use insforge.storage.from(bucket).uploadAuto(file) instead.'
    )
  }

  async uploadToS3(_file: File, _uploadUrl: string): Promise<never> {
    throw new Error(
      'S3 presigned-URL flow has been removed. Use insforge.storage.from(bucket).uploadAuto(file) instead.'
    )
  }

  async uploadFile(_file: File, _serviceId: string): Promise<S3UploadResult> {
    throw new Error(
      'S3 upload not yet migrated. Create an InsForge storage bucket and use insforge.storage.from(bucket).uploadAuto(file).'
    )
  }
}

export const s3UploadService = new S3UploadService()
