import { sql } from '@/lib/db';
import HomePage from '@/components/HomePage';

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
      <header className="bg-navy-dark border-b border-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            {/* Version */}
            <div className="text-white/60 text-sm">
              v1.0.1
            </div>
            {/* Logo - Center */}
            <a href="/" className="absolute left-1/2 transform -translate-x-1/2">
              <img
                src="/lion-sun.svg"
                alt="Lion and Sun - Emblem of Iran"
                className="h-20 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              />
            </a>
            <nav className="ml-auto flex gap-6">
              <a
                href="/search"
                className="text-white/80 hover:text-gold transition-colors"
              >
                Search
              </a>
              <a
                href="/submit"
                className="text-white/80 hover:text-gold transition-colors"
              >
                Submit
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Client Component with Modal */}
      <HomePage recentRecords={recentRecords} />

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-24 bg-navy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-white/60">
          <p>Open-source and community-driven. In memory of those we lost.</p>
        </div>
      </footer>
    </div>
  );
}
