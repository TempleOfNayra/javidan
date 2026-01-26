import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const isR2Configured = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY
);

if (!isR2Configured) {
  console.warn('Cloudflare R2 credentials not configured. Media uploads will not work.');
}

// Cloudflare R2 uses S3-compatible API
const r2Client = isR2Configured ? new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
}) : null;

export async function uploadToR2(
  file: File | Buffer,
  key: string,
  contentType: string
): Promise<string> {
  if (!isR2Configured || !r2Client) {
    throw new Error('R2 is not configured. Please add R2 credentials to environment variables.');
  }

  const bucketName = process.env.R2_BUCKET_NAME || 'javidan-media';

  let buffer: Buffer;
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    buffer = file;
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client.send(command);

  // Return public URL
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
  return publicUrl;
}

export function generateFileKey(fileName: string, type: 'image' | 'video' | 'document'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `uploads/${type}/${timestamp}-${random}-${sanitizedName}`;
}

export async function generatePresignedUrl(
  fileName: string,
  fileType: string,
  contentType: string
): Promise<{ presignedUrl: string; publicUrl: string; r2Key: string }> {
  if (!isR2Configured || !r2Client) {
    throw new Error('R2 is not configured. Please add R2 credentials to environment variables.');
  }

  const bucketName = process.env.R2_BUCKET_NAME || 'javidan-media';

  // Determine media type from content type
  let mediaType: 'image' | 'video' | 'document' = 'document';
  if (contentType.startsWith('image/')) {
    mediaType = 'image';
  } else if (contentType.startsWith('video/')) {
    mediaType = 'video';
  }

  const r2Key = generateFileKey(fileName, mediaType);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: r2Key,
    ContentType: contentType,
  });

  // Generate presigned URL valid for 1 hour
  const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

  // Generate public URL
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${r2Key}`;

  return { presignedUrl, publicUrl, r2Key };
}

export { r2Client };
