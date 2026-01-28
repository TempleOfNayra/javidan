import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recordId = parseInt(id);

    // Verify record exists
    const recordCheck = await sql`
      SELECT id FROM records WHERE id = ${recordId}
    `;

    if (recordCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();

    let uploadedFiles: Array<any> = [];

    // Get pre-uploaded files metadata
    const uploadedFilesStr = formData.get('uploadedFiles') as string | null;
    if (uploadedFilesStr) {
      uploadedFiles = JSON.parse(uploadedFilesStr);
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: 'At least one file is required' },
        { status: 400 }
      );
    }

    // Check if there's an existing primary image
    const existingPrimary = await sql`
      SELECT id FROM media
      WHERE record_id = ${recordId} AND is_primary = true
      LIMIT 1
    `;

    const hasPrimaryImage = existingPrimary.rows.length > 0;

    // Insert all media into database
    for (let i = 0; i < uploadedFiles.length; i++) {
      const fileData = uploadedFiles[i];
      // Set first image as primary if no primary exists and this is an image
      const isPrimary = !hasPrimaryImage && i === 0 && fileData.type === 'image';

      await sql`
        INSERT INTO media (
          record_id, type, r2_key, public_url, file_name, file_size, is_primary
        ) VALUES (
          ${recordId}, ${fileData.type}, ${fileData.r2Key}, ${fileData.publicUrl},
          ${fileData.fileName}, ${fileData.fileSize}, ${isPrimary}
        )
      `;
    }

    // Update evidence count
    await sql`
      UPDATE records
      SET evidence_count = evidence_count + ${uploadedFiles.length},
          updated_at = NOW()
      WHERE id = ${recordId}
    `;

    return NextResponse.json({
      success: true,
      filesUploaded: uploadedFiles.length,
      message: 'Files uploaded successfully',
    });

  } catch (error) {
    console.error('Error adding media to record:', error);
    return NextResponse.json(
      { error: 'Failed to upload files. Please try again.' },
      { status: 500 }
    );
  }
}
