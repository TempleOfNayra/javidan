import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { uploadToR2, generateFileKey } from '@/lib/r2';
import { MediaFile } from '@/lib/types/record';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract text fields
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const location = formData.get('location') as string;
    const birthYear = formData.get('birthYear') ? parseInt(formData.get('birthYear') as string) : null;
    const nationalId = formData.get('nationalId') as string | null;
    const fatherName = formData.get('fatherName') as string | null;
    const motherName = formData.get('motherName') as string | null;

    // Validate required fields
    if (!firstName || !lastName || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, location' },
        { status: 400 }
      );
    }

    // Handle file uploads
    const files = formData.getAll('files') as File[];
    const mediaFiles: MediaFile[] = [];

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

        mediaFiles.push({
          type: mediaType,
          r2Key: fileKey,
          publicUrl,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date(),
        });
      }
    }

    // Insert record into database
    const result = await sql`
      INSERT INTO records (
        first_name, last_name, location, birth_year, national_id,
        father_name, mother_name, verified, verification_level, evidence_count
      ) VALUES (
        ${firstName}, ${lastName}, ${location}, ${birthYear}, ${nationalId},
        ${fatherName}, ${motherName}, false, 'unverified', ${mediaFiles.length}
      )
      RETURNING id
    `;

    const recordId = result.rows[0].id;

    // Insert media files
    for (const media of mediaFiles) {
      await sql`
        INSERT INTO media (
          record_id, type, r2_key, public_url, file_name, file_size
        ) VALUES (
          ${recordId}, ${media.type}, ${media.r2Key}, ${media.publicUrl},
          ${media.fileName}, ${media.fileSize}
        )
      `;
    }

    return NextResponse.json({
      success: true,
      recordId: recordId.toString(),
      message: 'Record submitted successfully',
    });

  } catch (error) {
    console.error('Error submitting record:', error);
    return NextResponse.json(
      { error: 'Failed to submit record. Please try again.' },
      { status: 500 }
    );
  }
}
