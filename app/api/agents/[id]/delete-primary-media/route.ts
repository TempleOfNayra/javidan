import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete primary media from all agent tables
    // Try ir_agents first
    let result = await sql`
      DELETE FROM media
      WHERE ir_agent_id = ${parseInt(id)}
      AND is_primary = true
      RETURNING *
    `;

    // If not found, try security_forces
    if (result.rows.length === 0) {
      result = await sql`
        DELETE FROM media
        WHERE security_force_id = ${parseInt(id)}
        AND is_primary = true
        RETURNING *
      `;
    }

    // If not found, try records (victims)
    if (result.rows.length === 0) {
      result = await sql`
        DELETE FROM media
        WHERE record_id = ${parseInt(id)}
        AND is_primary = true
        RETURNING *
      `;
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No primary media found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Primary media deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting primary media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
