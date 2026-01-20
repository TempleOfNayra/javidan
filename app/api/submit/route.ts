import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { uploadToR2, generateFileKey } from '@/lib/r2';
import { VictimRecord, MediaFile } from '@/lib/types/record';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract text fields
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const location = formData.get('location') as string;
    const birthYear = formData.get('birthYear') ? parseInt(formData.get('birthYear') as string) : undefined;
    const nationalId = formData.get('nationalId') as string | undefined;
    const fatherName = formData.get('fatherName') as string | undefined;
    const motherName = formData.get('motherName') as string | undefined;

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

    // Create record
    const record: Omit<VictimRecord, '_id'> = {
      firstName,
      lastName,
      location,
      birthYear,
      nationalId,
      fatherName,
      motherName,
      media: mediaFiles,
      verified: false,
      verificationLevel: 'unverified',
      evidenceCount: mediaFiles.length,
      submittedAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    const db = await getDatabase();
    const collection = db.collection('records');
    const result = await collection.insertOne(record);

    return NextResponse.json({
      success: true,
      recordId: result.insertedId.toString(),
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
