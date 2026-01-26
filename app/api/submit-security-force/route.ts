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
    const firstNameEn = formData.get('firstNameEn') as string | null;
    const lastNameEn = formData.get('lastNameEn') as string | null;
    const city = formData.get('city') as string;
    const address = formData.get('address') as string | null;
    const residenceAddress = formData.get('residenceAddress') as string | null;
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null;
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null;
    const organization = formData.get('organization') as string | null;
    const rankPosition = formData.get('rankPosition') as string | null;
    const twitterHandle = formData.get('twitterHandle') as string | null;
    const instagramHandle = formData.get('instagramHandle') as string | null;
    const hashtags = formData.get('hashtags') as string | null;
    const additionalInfo = formData.get('additionalInfo') as string | null;
    const externalUrl1 = formData.get('externalUrl1') as string | null;
    const externalUrl2 = formData.get('externalUrl2') as string | null;
    const externalUrl3 = formData.get('externalUrl3') as string | null;
    const submitterTwitterId = formData.get('submitterTwitterId') as string | null;

    // Validate required fields
    if (!firstName || !lastName || !city) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, city' },
        { status: 400 }
      );
    }

    // Handle profile picture (primary image)
    const profilePictureFile = formData.get('profilePicture') as File | null;
    const mediaFiles: Array<MediaFile & { isPrimary: boolean }> = [];

    if (profilePictureFile && profilePictureFile.size > 0) {
      const fileKey = generateFileKey(profilePictureFile.name, 'image');
      const publicUrl = await uploadToR2(profilePictureFile, fileKey, profilePictureFile.type);

      mediaFiles.push({
        type: 'image',
        r2Key: fileKey,
        publicUrl,
        fileName: profilePictureFile.name,
        fileSize: profilePictureFile.size,
        uploadedAt: new Date(),
        isPrimary: true,
      });
    }

    // Handle supporting files
    const files = formData.getAll('files') as File[];

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
          isPrimary: false,
        });
      }
    }

    // Insert security force record into database
    const result = await sql`
      INSERT INTO security_forces (
        first_name, last_name, first_name_en, last_name_en, city, address,
        residence_address, latitude, longitude, organization, rank_position,
        twitter_handle, instagram_handle, hashtags, additional_info,
        submitter_twitter_id, evidence_count
      ) VALUES (
        ${firstName}, ${lastName}, ${firstNameEn}, ${lastNameEn}, ${city}, ${address},
        ${residenceAddress}, ${latitude}, ${longitude}, ${organization}, ${rankPosition},
        ${twitterHandle}, ${instagramHandle}, ${hashtags}, ${additionalInfo},
        ${submitterTwitterId}, ${mediaFiles.length}
      )
      RETURNING id
    `;

    const securityForceId = (result.rows as any)[0].id;

    // Insert external URLs
    const externalUrls = [externalUrl1, externalUrl2, externalUrl3].filter(url => url && url.trim());
    for (const url of externalUrls) {
      await sql`
        INSERT INTO external_links (security_force_id, url)
        VALUES (${securityForceId}, ${url})
      `;
    }

    // Insert media files
    for (const media of mediaFiles) {
      await sql`
        INSERT INTO media (
          security_force_id, type, r2_key, public_url, file_name, file_size, is_primary
        ) VALUES (
          ${securityForceId}, ${media.type}, ${media.r2Key}, ${media.publicUrl},
          ${media.fileName}, ${media.fileSize}, ${media.isPrimary}
        )
      `;
    }

    return NextResponse.json({
      success: true,
      securityForceId: securityForceId.toString(),
      message: 'Security force record submitted successfully',
    });

  } catch (error) {
    console.error('Error submitting security force record:', error);
    return NextResponse.json(
      { error: 'Failed to submit record. Please try again.' },
      { status: 500 }
    );
  }
}
