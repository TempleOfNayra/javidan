import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { put } from '@vercel/blob';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const forceId = parseInt(id);

    if (isNaN(forceId)) {
      return NextResponse.json(
        { error: 'Invalid force ID' },
        { status: 400 }
      );
    }

    // Verify force exists
    const forceCheck = await sql`
      SELECT id FROM security_forces WHERE id = ${forceId}
    `;

    if (forceCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Security force not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    // Upload files to R2
    for (const file of files) {
      if (!(file instanceof File)) {
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const extension = file.name.split('.').pop();
      const fileName = `force-${forceId}-${timestamp}-${randomString}.${extension}`;

      // Upload to R2
      const blob = await put(fileName, buffer, {
        access: 'public',
        contentType: file.type,
      });

      const fileData = {
        publicUrl: blob.url,
        r2Key: fileName,
        fileName: file.name,
        fileSize: file.size,
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
      };

      uploadedFiles.push(fileData);
    }

    // Check if there's already a primary image
    const existingPrimary = await sql`
      SELECT id FROM media
      WHERE security_force_id = ${forceId} AND is_primary = true
      LIMIT 1
    `;

    const hasPrimaryImage = existingPrimary.rows.length > 0;

    // Insert media records - first image becomes primary if no primary exists
    for (let i = 0; i < uploadedFiles.length; i++) {
      const fileData = uploadedFiles[i];
      const isPrimary = i === 0 && fileData.type === 'image' && !hasPrimaryImage;

      // If this is going to be primary, remove primary flag from existing media
      if (isPrimary && hasPrimaryImage) {
        await sql`
          UPDATE media SET is_primary = false
          WHERE security_force_id = ${forceId} AND is_primary = true
        `;
      }

      await sql`
        INSERT INTO media (
          security_force_id,
          type,
          r2_key,
          public_url,
          file_name,
          file_size,
          is_primary
        ) VALUES (
          ${forceId},
          ${fileData.type},
          ${fileData.r2Key},
          ${fileData.publicUrl},
          ${fileData.fileName},
          ${fileData.fileSize},
          ${isPrimary}
        )
      `;
    }

    // Update evidence count
    const mediaCount = await sql`
      SELECT COUNT(*) as count FROM media
      WHERE security_force_id = ${forceId}
    `;

    await sql`
      UPDATE security_forces
      SET evidence_count = ${Number(mediaCount.rows[0]?.count || 0)}
      WHERE id = ${forceId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Media uploaded successfully',
      files: uploadedFiles,
    });

  } catch (error) {
    console.error('[FORCE ADD MEDIA] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  }
}
