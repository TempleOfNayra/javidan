import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { uploadToR2, generateFileKey } from '@/lib/r2';
import { MediaFile } from '@/lib/types/record';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agentId = parseInt(id);

    // Verify agent exists
    const agentCheck = await sql`
      SELECT id FROM ir_agents WHERE id = ${agentId}
    `;

    if (agentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const submitterTwitterId = formData.get('submitterTwitterId') as string | null;

    let uploadedFiles: Array<any> = [];

    // Get pre-uploaded files metadata
    const uploadedFilesStr = formData.get('uploadedFiles') as string | null;
    if (uploadedFilesStr) {
      uploadedFiles = JSON.parse(uploadedFilesStr);
    } else {
      // Fallback: Handle direct file uploads (for backward compatibility)
      const files = formData.getAll('files') as File[];

      for (const file of files) {
        if (file.size > 0) {
          let mediaType: 'image' | 'video' | 'document' = 'document';
          if (file.type.startsWith('image/')) {
            mediaType = 'image';
          } else if (file.type.startsWith('video/')) {
            mediaType = 'video';
          }

          const fileKey = generateFileKey(file.name, mediaType);
          const publicUrl = await uploadToR2(file, fileKey, file.type);

          uploadedFiles.push({
            type: mediaType,
            r2Key: fileKey,
            publicUrl,
            fileName: file.name,
            fileSize: file.size,
          });
        }
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: 'At least one file is required' },
        { status: 400 }
      );
    }

    // Insert all media into database
    for (const fileData of uploadedFiles) {
      await sql`
        INSERT INTO media (
          ir_agent_id, type, r2_key, public_url, file_name, file_size, is_primary
        ) VALUES (
          ${agentId}, ${fileData.type}, ${fileData.r2Key}, ${fileData.publicUrl},
          ${fileData.fileName}, ${fileData.fileSize}, false
        )
      `;
    }

    // Update evidence count
    await sql`
      UPDATE ir_agents
      SET evidence_count = evidence_count + ${uploadedFiles.length},
          updated_at = NOW()
      WHERE id = ${agentId}
    `;

    return NextResponse.json({
      success: true,
      filesUploaded: uploadedFiles.length,
      message: 'Files uploaded successfully',
    });

  } catch (error) {
    console.error('Error adding media to agent:', error);
    return NextResponse.json(
      { error: 'Failed to upload files. Please try again.' },
      { status: 500 }
    );
  }
}
