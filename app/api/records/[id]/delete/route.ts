import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // SECURITY: Only allow deletion in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Delete operation is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const recordId = parseInt(id);

    // Verify record exists
    const recordCheck = await sql`
      SELECT id FROM records WHERE id = ${recordId}
    `;

    if (recordCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    // Delete associated media first (foreign key constraint)
    await sql`
      DELETE FROM media WHERE record_id = ${recordId}
    `;

    // Delete associated twitter links
    await sql`
      DELETE FROM twitter_links WHERE record_id = ${recordId}
    `;

    // Delete the record
    await sql`
      DELETE FROM records WHERE id = ${recordId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting record:', error);
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 }
    );
  }
}
