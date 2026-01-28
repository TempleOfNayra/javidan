import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Define valid fields for each record type
const VALID_FIELDS: Record<string, string[]> = {
  victim: [
    'first_name_en', 'last_name_en', 'birth_year', 'age', 'incident_date',
    'national_id', 'father_name', 'mother_name', 'perpetrator', 'hashtags', 'additional_info'
  ],
  agent: [
    'first_name_en', 'last_name_en', 'city', 'country', 'address', 'residence_address',
    'latitude', 'longitude', 'affiliation', 'role', 'twitter_handle', 'instagram_handle',
    'hashtags', 'additional_info'
  ],
  force: [
    'first_name_en', 'last_name_en', 'address', 'residence_address', 'latitude', 'longitude',
    'organization', 'rank_position', 'twitter_handle', 'instagram_handle', 'hashtags', 'additional_info'
  ],
  video: ['hashtags', 'additional_info'],
  document: ['hashtags', 'additional_info'],
};

// Map record types to table names
const TABLE_NAMES: Record<string, string> = {
  victim: 'records',
  agent: 'ir_agents',
  force: 'security_forces',
  video: 'videos',
  document: 'evidence',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      recordType,
      recordId,
      fieldName,
      value,
      submitterTwitterId,
    } = body;

    // Validation
    if (!recordType || !recordId || !fieldName || value === undefined || value === null) {
      return NextResponse.json(
        { error: 'Missing required fields: recordType, recordId, fieldName, value' },
        { status: 400 }
      );
    }

    // Check if record type is valid
    if (!VALID_FIELDS[recordType]) {
      return NextResponse.json(
        { error: `Invalid record type: ${recordType}` },
        { status: 400 }
      );
    }

    // Check if field is valid for this record type
    if (!VALID_FIELDS[recordType].includes(fieldName)) {
      return NextResponse.json(
        { error: `Invalid field '${fieldName}' for record type '${recordType}'` },
        { status: 400 }
      );
    }

    const tableName = TABLE_NAMES[recordType];
    const submitterIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Check rate limiting: max 10 updates per IP per day
    const today = new Date().toISOString().split('T')[0];
    const rateLimitCheck = await sql`
      SELECT COUNT(*) as count
      FROM field_updates
      WHERE submitter_ip = ${submitterIp}
        AND created_at >= ${today}::date
    `;

    const updateCount = parseInt(rateLimitCheck.rows[0].count);
    if (updateCount >= 10) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 updates per day.' },
        { status: 429 }
      );
    }

    // Check if the field is currently empty
    const checkQuery = `SELECT ${fieldName} FROM ${tableName} WHERE id = $1`;
    const currentValueResult = await sql.unsafe(checkQuery, [recordId]);

    if (currentValueResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    const currentValue = currentValueResult.rows[0][fieldName];

    // Only allow update if field is currently null/empty
    if (currentValue !== null && currentValue !== '' && currentValue !== undefined) {
      return NextResponse.json(
        { error: 'Field already has a value. Cannot overwrite existing data.' },
        { status: 403 }
      );
    }

    // Update the field
    const updateQuery = `UPDATE ${tableName} SET ${fieldName} = $1, updated_at = NOW() WHERE id = $2`;
    await sql.unsafe(updateQuery, [value, recordId]);

    // Log the update in audit table
    await sql`
      INSERT INTO field_updates (
        record_type, record_id, field_name, old_value, new_value,
        submitter_twitter_id, submitter_ip
      ) VALUES (
        ${recordType}, ${recordId}, ${fieldName}, ${currentValue}, ${value},
        ${submitterTwitterId || null}, ${submitterIp}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Field updated successfully',
    });

  } catch (error) {
    console.error('Error updating field:', error);
    return NextResponse.json(
      { error: 'Failed to update field. Please try again.' },
      { status: 500 }
    );
  }
}
