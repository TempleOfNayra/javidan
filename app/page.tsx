import { sql } from '@/lib/db';
import HomePage from '@/components/HomePage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

async function getRecentRecords() {
  try {
    // Get recent records with media
    const recordsResult = await sql`
      SELECT r.*,
        (SELECT json_agg(json_build_object('url', m.public_url, 'type', m.type))
         FROM media m
         WHERE m.record_id = r.id
         LIMIT 1) as media
      FROM records r
      ORDER BY r.submitted_at DESC
      LIMIT 10
    `;

    return recordsResult.rows.map((row: any) => ({
      id: row.id.toString(),
      firstName: row.first_name,
      lastName: row.last_name,
      location: row.location,
      additionalInfo: row.additional_info,
      submitterTwitterId: row.submitter_twitter_id,
      submittedAt: row.submitted_at.toISOString(),
      media: row.media ? row.media[0] : null,
    }));
  } catch (error) {
    console.error('Error fetching recent records:', error);
    return [];
  }
}

export default async function Home() {
  const recentRecords = await getRecentRecords();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Client Component with Modal */}
      <HomePage recentRecords={recentRecords} />

      {/* Footer */}
      <Footer />
    </div>
  );
}
