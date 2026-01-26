import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await sql`
      SELECT r.*,
        (SELECT json_agg(json_build_object('url', m.public_url, 'type', m.type))
         FROM media m
         WHERE m.record_id = r.id
        ) as media
      FROM records r
      ORDER BY r.submitted_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching victims:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch victims' },
      { status: 500 }
    );
  }
}
