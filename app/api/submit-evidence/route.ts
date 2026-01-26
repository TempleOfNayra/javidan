import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { uploadToR2, generateFileKey } from '@/lib/r2';
import { MediaFile } from '@/lib/types/record';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract text fields
    const title = formData.get('title') as string;
    const description = formData.get('additionalInfo') as string;
    const hashtags = formData.get('hashtags') as string | null;
    const submitterTwitterId = formData.get('submitterTwitterId') as string | null;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description' },
        { status: 400 }
      );
    }

    // Handle document files
    const files = formData.getAll('files') as File[];
    const documentFiles: Array<MediaFile> = [];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'At least one document/file is required' },
        { status: 400 }
      );
    }

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

        documentFiles.push({
          type: mediaType,
          r2Key: fileKey,
          publicUrl,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date(),
        });
      }
    }

    if (documentFiles.length === 0) {
      return NextResponse.json(
        { error: 'No valid files were uploaded' },
        { status: 400 }
      );
    }

    // Insert evidence record into database
    const result = await sql`
      INSERT INTO evidence (
        title, description, hashtags, submitter_twitter_id, evidence_count
      ) VALUES (
        ${title}, ${description}, ${hashtags}, ${submitterTwitterId}, ${documentFiles.length}
      )
      RETURNING id
    `;

    const evidenceId = (result.rows as any)[0].id;

    // Insert document files
    for (const doc of documentFiles) {
      await sql`
        INSERT INTO media (
          evidence_id, type, r2_key, public_url, file_name, file_size, is_primary
        ) VALUES (
          ${evidenceId}, ${doc.type}, ${doc.r2Key}, ${doc.publicUrl},
          ${doc.fileName}, ${doc.fileSize}, false
        )
      `;
    }

    return NextResponse.json({
      success: true,
      evidenceId: evidenceId.toString(),
      message: 'Evidence submission successful',
    });

  } catch (error) {
    console.error('Error submitting evidence:', error);
    return NextResponse.json(
      { error: 'Failed to submit evidence. Please try again.' },
      { status: 500 }
    );
  }
}
