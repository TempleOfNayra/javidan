import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  throw new Error('Please add your Cloudflare R2 credentials to .env.local');
}

// Cloudflare R2 uses S3-compatible API
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(
  file: File | Buffer,
  key: string,
  contentType: string
): Promise<string> {
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

export { r2Client };
