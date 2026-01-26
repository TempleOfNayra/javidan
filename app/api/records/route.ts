import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get records with media
    const recordsResult = await sql`
      SELECT r.*,
        (SELECT json_agg(json_build_object('url', m.public_url, 'type', m.type))
         FROM media m
         WHERE m.record_id = r.id AND m.is_primary = true
         LIMIT 1) as media
      FROM records r
      ORDER BY r.submitted_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const records = recordsResult.rows.map((row: any) => ({
      id: row.id.toString(),
      firstName: row.first_name,
      lastName: row.last_name,
      firstNameEn: row.first_name_en,
      lastNameEn: row.last_name_en,
      location: row.location,
      birthYear: row.birth_year,
      incidentDate: row.incident_date,
      nationalId: row.national_id,
      fatherName: row.father_name,
      motherName: row.mother_name,
      victimStatus: row.victim_status,
      gender: row.gender,
      perpetrator: row.perpetrator,
      hashtags: row.hashtags,
      additionalInfo: row.additional_info,
      submitterTwitterId: row.submitter_twitter_id,
      verified: row.verified,
      verificationLevel: row.verification_level,
      evidenceCount: row.evidence_count,
      submittedAt: row.submitted_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      media: row.media ? row.media[0] : null,
    }));

    return NextResponse.json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (error) {
    console.error('Error fetching records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch records' },
      { status: 500 }
    );
  }
}
