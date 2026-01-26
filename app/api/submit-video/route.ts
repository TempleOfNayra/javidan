import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { uploadToR2, generateFileKey } from '@/lib/r2';
import { MediaFile } from '@/lib/types/record';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract text fields
    const location = formData.get('location') as string;
    const description = formData.get('additionalInfo') as string;
    const hashtags = formData.get('hashtags') as string | null;
    const submitterTwitterId = formData.get('submitterTwitterId') as string | null;

    // Validate required fields
    if (!location || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: location, description' },
        { status: 400 }
      );
    }

    // Handle video files
    const files = formData.getAll('files') as File[];
    const videoFiles: Array<MediaFile> = [];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'At least one video file is required' },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (file.size > 0 && file.type.startsWith('video/')) {
        // Generate unique key and upload to R2
        const fileKey = generateFileKey(file.name, 'video');
        const publicUrl = await uploadToR2(file, fileKey, file.type);

        videoFiles.push({
          type: 'video',
          r2Key: fileKey,
          publicUrl,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date(),
        });
      }
    }

    if (videoFiles.length === 0) {
      return NextResponse.json(
        { error: 'No valid video files were uploaded' },
        { status: 400 }
      );
    }

    // Insert video record into database
    const result = await sql`
      INSERT INTO videos (
        location, description, hashtags, submitter_twitter_id, evidence_count
      ) VALUES (
        ${location}, ${description}, ${hashtags}, ${submitterTwitterId}, ${videoFiles.length}
      )
      RETURNING id
    `;

    const videoId = (result.rows as any)[0].id;

    // Insert video files
    for (const video of videoFiles) {
      await sql`
        INSERT INTO media (
          video_id, type, r2_key, public_url, file_name, file_size, is_primary
        ) VALUES (
          ${videoId}, ${video.type}, ${video.r2Key}, ${video.publicUrl},
          ${video.fileName}, ${video.fileSize}, false
        )
      `;
    }

    return NextResponse.json({
      success: true,
      videoId: videoId.toString(),
      message: 'Video submission successful',
    });

  } catch (error) {
    console.error('Error submitting video:', error);
    return NextResponse.json(
      { error: 'Failed to submit videos. Please try again.' },
      { status: 500 }
    );
  }
}
