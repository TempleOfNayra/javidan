import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { uploadToR2, generateFileKey } from '@/lib/r2';
import { MediaFile } from '@/lib/types/record';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract text fields
    const fullName = formData.get('fullName') as string | null;
    const fullNameEn = formData.get('fullNameEn') as string | null;
    const location = formData.get('location') as string;
    const birthYear = formData.get('birthYear') ? parseInt(formData.get('birthYear') as string) : null;
    const age = formData.get('age') ? parseInt(formData.get('age') as string) : null;
    const incidentDate = formData.get('incidentDate') as string | null;
    const nationalId = formData.get('nationalId') as string | null;
    const fatherName = formData.get('fatherName') as string | null;
    const motherName = formData.get('motherName') as string | null;
    const hashtags = formData.get('hashtags') as string | null;
    const additionalInfo = formData.get('additionalInfo') as string | null;
    const perpetrator = formData.get('perpetrator') as string | null;
    const twitterUrl1 = formData.get('twitterUrl1') as string | null;
    const twitterUrl2 = formData.get('twitterUrl2') as string | null;
    const twitterUrl3 = formData.get('twitterUrl3') as string | null;
    const submitterTwitterId = formData.get('submitterTwitterId') as string | null;
    const victimStatus = formData.get('victimStatus') as string | null;
    const gender = formData.get('gender') as string | null;

    // Split fullName into firstName/lastName for backward compatibility
    let firstName: string | null = null;
    let lastName: string | null = null;
    let firstNameEn: string | null = null;
    let lastNameEn: string | null = null;

    if (fullName) {
      const parts = fullName.trim().split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || parts[0];
    }

    if (fullNameEn) {
      const parts = fullNameEn.trim().split(' ');
      firstNameEn = parts[0];
      lastNameEn = parts.slice(1).join(' ') || parts[0];
    }

    // Debug logging
    console.log('[SUBMIT] fullName:', fullName, '| fullNameEn:', fullNameEn, '| location:', location, '| victimStatus:', victimStatus, '| gender:', gender);

    // Validate required fields - names: at least one full name (Farsi OR English)
    if (!fullName && !fullNameEn) {
      console.log('[VALIDATION FAILED] Neither Farsi nor English full name provided');
      return NextResponse.json(
        { error: 'Missing required fields: Must provide either fullName or fullNameEn' },
        { status: 400 }
      );
    }

    if (!location || !victimStatus || !gender) {
      console.log('[VALIDATION FAILED] location:', !location ? 'MISSING' : 'OK', '| victimStatus:', !victimStatus ? 'MISSING' : 'OK', '| gender:', !gender ? 'MISSING' : 'OK');
      return NextResponse.json(
        { error: 'Missing required fields: location, victimStatus, gender' },
        { status: 400 }
      );
    }

    // Handle media files - new approach with pre-uploaded R2 files
    const mediaFiles: Array<MediaFile & { isPrimary: boolean }> = [];

    // Handle victim picture (primary media - can be image or video)
    const uploadedProfilePictureStr = formData.get('uploadedProfilePicture') as string | null;
    if (uploadedProfilePictureStr) {
      const profilePicture = JSON.parse(uploadedProfilePictureStr);
      mediaFiles.push({
        type: profilePicture.type,
        r2Key: profilePicture.r2Key,
        publicUrl: profilePicture.publicUrl,
        fileName: profilePicture.fileName,
        fileSize: profilePicture.fileSize,
        uploadedAt: new Date(),
        isPrimary: true,
      });
    }

    // Handle supporting files (pre-uploaded to R2)
    const uploadedFilesStr = formData.get('uploadedFiles') as string | null;
    if (uploadedFilesStr) {
      const uploadedFiles = JSON.parse(uploadedFilesStr);
      for (const file of uploadedFiles) {
        mediaFiles.push({
          type: file.type,
          r2Key: file.r2Key,
          publicUrl: file.publicUrl,
          fileName: file.fileName,
          fileSize: file.fileSize,
          uploadedAt: new Date(),
          isPrimary: false,
        });
      }
    }

    // Fallback: Handle old-style direct file uploads (for backwards compatibility)
    const victimPictureFile = formData.get('victimPicture') as File | null;
    if (victimPictureFile && victimPictureFile.size > 0) {
      // Determine file type
      let mediaType: 'image' | 'video' | 'document' = 'image';
      if (victimPictureFile.type.startsWith('video/')) {
        mediaType = 'video';
      }

      const fileKey = generateFileKey(victimPictureFile.name, mediaType);
      const publicUrl = await uploadToR2(victimPictureFile, fileKey, victimPictureFile.type);

      mediaFiles.push({
        type: mediaType,
        r2Key: fileKey,
        publicUrl,
        fileName: victimPictureFile.name,
        fileSize: victimPictureFile.size,
        uploadedAt: new Date(),
        isPrimary: true,
      });
    }

    // Fallback: Handle old-style supporting files
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

    // Insert record into database
    const result = await sql`
      INSERT INTO records (
        full_name, full_name_en, first_name, last_name, first_name_en, last_name_en, location, birth_year, age, incident_date, national_id,
        father_name, mother_name, hashtags, additional_info, perpetrator, submitter_twitter_id,
        victim_status, gender, verified, verification_level, evidence_count
      ) VALUES (
        ${fullName}, ${fullNameEn}, ${firstName}, ${lastName}, ${firstNameEn}, ${lastNameEn}, ${location}, ${birthYear}, ${age}, ${incidentDate}, ${nationalId},
        ${fatherName}, ${motherName}, ${hashtags}, ${additionalInfo}, ${perpetrator}, ${submitterTwitterId},
        ${victimStatus}, ${gender}, false, 'unverified', ${mediaFiles.length}
      )
      RETURNING id
    `;

    const recordId = (result.rows as any)[0].id;

    // Insert Twitter URLs
    const twitterUrls = [twitterUrl1, twitterUrl2, twitterUrl3].filter(url => url && url.trim());
    for (const url of twitterUrls) {
      await sql`
        INSERT INTO twitter_links (record_id, url)
        VALUES (${recordId}, ${url})
      `;
    }

    // Insert media files
    for (const media of mediaFiles) {
      await sql`
        INSERT INTO media (
          record_id, type, r2_key, public_url, file_name, file_size, is_primary
        ) VALUES (
          ${recordId}, ${media.type}, ${media.r2Key}, ${media.publicUrl},
          ${media.fileName}, ${media.fileSize}, ${media.isPrimary}
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
