import { sql } from '@/lib/db';
import { notFound } from 'next/navigation';
import RecordDetail from '@/components/RecordDetail';

async function getRecord(id: string) {
  try {
    // Get record
    const recordResult = await sql`
      SELECT * FROM records WHERE id = ${parseInt(id)}
    `;

    if (recordResult.rows.length === 0) {
      return null;
    }

    const record = recordResult.rows[0];

    // Get victim picture (primary image)
    const victimPictureResult = await sql`
      SELECT * FROM media WHERE record_id = ${parseInt(id)} AND is_primary = true LIMIT 1
    `;

    // Get supporting media (non-primary)
    const mediaResult = await sql`
      SELECT * FROM media WHERE record_id = ${parseInt(id)} AND (is_primary = false OR is_primary IS NULL)
    `;

    // Get Twitter links for this record
    const twitterResult = await sql`
      SELECT * FROM twitter_links WHERE record_id = ${parseInt(id)} ORDER BY created_at
    `;

    return {
      _id: record.id.toString(),
      firstName: record.first_name,
      lastName: record.last_name,
      firstNameEn: record.first_name_en,
      lastNameEn: record.last_name_en,
      fullName: record.full_name,
      fullNameEn: record.full_name_en,
      location: record.location,
      birthYear: record.birth_year,
      age: record.age,
      incidentDate: record.incident_date ? new Date(record.incident_date).toISOString().split('T')[0] : null,
      nationalId: record.national_id,
      fatherName: record.father_name,
      motherName: record.mother_name,
      gender: record.gender,
      victimStatus: record.victim_status,
      hashtags: record.hashtags,
      additionalInfo: record.additional_info,
      perpetrator: record.perpetrator,
      submitterTwitterId: record.submitter_twitter_id,
      twitterLinks: twitterResult.rows.map((t: any) => ({
        id: t.id,
        url: t.url,
        createdAt: t.created_at.toISOString(),
      })),
      verified: record.verified,
      verificationLevel: record.verification_level || 'unverified',
      evidenceCount: record.evidence_count || 0,
      submittedAt: record.submitted_at.toISOString(),
      updatedAt: record.updated_at.toISOString(),
      victimPicture: victimPictureResult.rows.length > 0 ? {
        type: victimPictureResult.rows[0].type,
        r2Key: victimPictureResult.rows[0].r2_key,
        publicUrl: victimPictureResult.rows[0].public_url,
        fileName: victimPictureResult.rows[0].file_name,
        fileSize: victimPictureResult.rows[0].file_size,
        uploadedAt: victimPictureResult.rows[0].uploaded_at.toISOString(),
      } : null,
      media: mediaResult.rows.map((m: any) => ({
        type: m.type,
        r2Key: m.r2_key,
        publicUrl: m.public_url,
        fileName: m.file_name,
        fileSize: m.file_size,
        uploadedAt: m.uploaded_at.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error fetching record:', error);
    return null;
  }
}

export default async function RecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getRecord(id);

  if (!record) {
    notFound();
  }

  return <RecordDetail record={record} id={id} />;
}
