import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // Check environment - only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'This endpoint is disabled in production' },
        { status: 403 }
      );
    }

    // Require an admin secret key
    const { secret } = await request.json();
    const ADMIN_SECRET = process.env.ADMIN_SECRET || 'change-me-in-production';

    if (secret !== ADMIN_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete all media records
    await sql`DELETE FROM media`;

    // Delete all twitter links
    await sql`DELETE FROM twitter_links`;

    // Delete all records
    await sql`DELETE FROM records`;

    // Reset sequences (optional - this resets the auto-increment IDs)
    await sql`ALTER SEQUENCE records_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE media_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE twitter_links_id_seq RESTART WITH 1`;

    return NextResponse.json({
      success: true,
      message: 'Database cleaned successfully. All records, media, and twitter links have been deleted.'
    });
  } catch (error) {
    console.error('Error cleaning database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clean database' },
      { status: 500 }
    );
  }
}
