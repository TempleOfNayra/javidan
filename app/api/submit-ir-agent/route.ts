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
    const agentType = formData.get('agentType') as string;
    const city = formData.get('city') as string | null;
    const country = formData.get('country') as string | null;
    const address = formData.get('address') as string | null;
    const residenceAddress = formData.get('residenceAddress') as string | null;
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null;
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null;
    const affiliation = formData.get('affiliation') as string | null;
    const role = formData.get('role') as string | null;
    const twitterHandle = formData.get('twitterHandle') as string | null;
    const instagramHandle = formData.get('instagramHandle') as string | null;
    const hashtags = formData.get('hashtags') as string | null;
    const additionalInfo = formData.get('additionalInfo') as string | null;
    const externalUrl1 = formData.get('twitterUrl1') as string | null;
    const externalUrl2 = formData.get('twitterUrl2') as string | null;
    const externalUrl3 = formData.get('twitterUrl3') as string | null;
    const submitterTwitterId = formData.get('submitterTwitterId') as string | null;

    // Validate required fields
    if (!firstName || !lastName || !agentType) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, agentType' },
        { status: 400 }
      );
    }

    // Validate location based on agent type
    if (agentType === 'internal' && !city) {
      return NextResponse.json(
        { error: 'City is required for internal agents' },
        { status: 400 }
      );
    }

    if (agentType === 'foreign' && !country) {
      return NextResponse.json(
        { error: 'Country is required for foreign agents' },
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

    // Insert IR agent record into database
    const result = await sql`
      INSERT INTO ir_agents (
        first_name, last_name, first_name_en, last_name_en, agent_type, city, country,
        address, residence_address, latitude, longitude, affiliation, role,
        twitter_handle, instagram_handle, hashtags, additional_info,
        submitter_twitter_id, evidence_count
      ) VALUES (
        ${firstName}, ${lastName}, ${firstNameEn}, ${lastNameEn}, ${agentType}, ${city}, ${country},
        ${address}, ${residenceAddress}, ${latitude}, ${longitude}, ${affiliation}, ${role},
        ${twitterHandle}, ${instagramHandle}, ${hashtags}, ${additionalInfo},
        ${submitterTwitterId}, ${mediaFiles.length}
      )
      RETURNING id
    `;

    const irAgentId = (result.rows as any)[0].id;

    // Insert external URLs (we'll create a similar table for ir_agents or reuse external_links)
    const externalUrls = [externalUrl1, externalUrl2, externalUrl3].filter(url => url && url.trim());
    for (const url of externalUrls) {
      await sql`
        INSERT INTO external_links (ir_agent_id, url)
        VALUES (${irAgentId}, ${url})
      `;
    }

    // Insert media files
    for (const media of mediaFiles) {
      await sql`
        INSERT INTO media (
          ir_agent_id, type, r2_key, public_url, file_name, file_size, is_primary
        ) VALUES (
          ${irAgentId}, ${media.type}, ${media.r2Key}, ${media.publicUrl},
          ${media.fileName}, ${media.fileSize}, ${media.isPrimary}
        )
      `;
    }

    return NextResponse.json({
      success: true,
      irAgentId: irAgentId.toString(),
      message: 'IR agent record submitted successfully',
    });

  } catch (error) {
    console.error('Error submitting IR agent record:', error);
    return NextResponse.json(
      { error: 'Failed to submit record. Please try again.' },
      { status: 500 }
    );
  }
}
