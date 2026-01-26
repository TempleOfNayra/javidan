import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { uploadToR2, generateFileKey } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const recordId = formData.get('recordId') as string;

    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Verify record exists
    const recordCheck = await sql`
      SELECT id FROM records WHERE id = ${parseInt(recordId)}
    `;

    if (recordCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    // Handle uploaded files
    const files = formData.getAll('files') as File[];
    const uploadedMedia = [];

    for (const file of files) {
      if (file.size > 0) {
        // Determine file type
        let mediaType: 'image' | 'video' | 'document' = 'document';
        if (file.type.startsWith('image/')) {
          mediaType = 'image';
        } else if (file.type.startsWith('video/')) {
          mediaType = 'video';
        }

        // Generate unique key and upload to R2
        const fileKey = generateFileKey(file.name, mediaType);
        const publicUrl = await uploadToR2(file, fileKey, file.type);

        // Insert into media table
        await sql`
          INSERT INTO media (
            record_id, type, r2_key, public_url, file_name, file_size, is_primary
          ) VALUES (
            ${parseInt(recordId)}, ${mediaType}, ${fileKey}, ${publicUrl},
            ${file.name}, ${file.size}, false
          )
        `;

        uploadedMedia.push({
          type: mediaType,
          publicUrl,
          fileName: file.name,
        });
      }
    }

    // Update evidence count
    await sql`
      UPDATE records
      SET evidence_count = evidence_count + ${uploadedMedia.length},
          updated_at = NOW()
      WHERE id = ${parseInt(recordId)}
    `;

    return NextResponse.json({
      success: true,
      uploadedCount: uploadedMedia.length,
      media: uploadedMedia,
    });

  } catch (error) {
    console.error('Error adding evidence:', error);
    return NextResponse.json(
      { error: 'Failed to add evidence. Please try again.' },
      { status: 500 }
    );
  }
}
