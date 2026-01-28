import { sql } from '@/lib/db';
import HomePage from '@/components/HomePage';
import Footer from '@/components/Footer';

async function getRecentRecords() {
  try {
    console.log('[HOME PAGE] Starting to fetch recent records...');

    // Get recent records with media
    const recordsResult = await sql`
      SELECT r.*,
        (SELECT json_agg(json_build_object('url', m.public_url, 'type', m.type))
         FROM media m
         WHERE m.record_id = r.id AND m.is_primary = true
         LIMIT 1) as media
      FROM records r
      ORDER BY r.submitted_at DESC
      LIMIT 10
    `;

    console.log('[HOME PAGE] Query completed. Rows returned:', recordsResult.rows.length);
    console.log('[HOME PAGE] Raw data:', JSON.stringify(recordsResult.rows, null, 2));

    const mappedRecords = recordsResult.rows.map((row: any) => ({
      id: row.id.toString(),
      firstName: row.first_name,
      lastName: row.last_name,
      fullName: row.full_name,
      fullNameEn: row.full_name_en,
      location: row.location,
      additionalInfo: row.additional_info,
      submitterTwitterId: row.submitter_twitter_id,
      submittedAt: row.submitted_at.toISOString(),
      media: row.media ? row.media[0] : null,
    }));

    console.log('[HOME PAGE] Mapped records:', JSON.stringify(mappedRecords, null, 2));
    return mappedRecords;
  } catch (error) {
    console.error('[HOME PAGE] Error fetching recent records:', error);
    console.error('[HOME PAGE] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return [];
  }
}

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const recentRecords = await getRecentRecords();

  return (
    <div className="min-h-screen bg-white">
      {/* Client Component with Header, Modal, and Content */}
      <HomePage recentRecords={recentRecords} />

      {/* Footer */}
      <Footer />
    </div>
  );
}
