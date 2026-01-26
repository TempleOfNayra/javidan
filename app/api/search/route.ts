import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      // No search query - return all records
      const result = await sql`
        SELECT
          r.id, r.first_name, r.last_name, r.first_name_en, r.last_name_en,
          r.location, r.birth_year, r.national_id, r.father_name, r.mother_name,
          r.verified, r.verification_level, r.evidence_count, r.victim_status,
          r.submitted_at, r.updated_at,
          m.public_url as victim_picture_url
        FROM records r
        LEFT JOIN media m ON r.id = m.record_id AND m.is_primary = true
        GROUP BY r.id, m.public_url
        ORDER BY r.submitted_at DESC
        LIMIT 100
      `;

      return NextResponse.json({
        success: true,
        records: result.rows,
        count: result.rows.length,
      });
    }

    // Search using the search_text field
    const searchPattern = `%${query.toLowerCase()}%`;

    const result = await sql`
      SELECT
        r.id, r.first_name, r.last_name, r.first_name_en, r.last_name_en,
        r.location, r.birth_year, r.national_id, r.father_name, r.mother_name,
        r.verified, r.verification_level, r.evidence_count, r.victim_status,
        r.submitted_at, r.updated_at,
        m.public_url as victim_picture_url
      FROM records r
      LEFT JOIN media m ON r.id = m.record_id AND m.is_primary = true
      WHERE r.search_text LIKE ${searchPattern}
      GROUP BY r.id, m.public_url
      ORDER BY r.submitted_at DESC
      LIMIT 100
    `;

    return NextResponse.json({
      success: true,
      records: result.rows,
      count: result.rows.length,
    });

  } catch (error) {
    console.error('Error searching records:', error);
    return NextResponse.json(
      { error: 'Failed to search records' },
      { status: 500 }
    );
  }
}
