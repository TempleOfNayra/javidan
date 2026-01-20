import Link from 'next/link';
import { sql } from '@/lib/db';

async function getStats() {
  try {
    // Get total records
    const totalResult = await sql`SELECT COUNT(*) as count FROM records`;
    const total = parseInt(totalResult.rows[0].count);

    // Get verified records
    const verifiedResult = await sql`SELECT COUNT(*) as count FROM records WHERE verified = true`;
    const verified = parseInt(verifiedResult.rows[0].count);

    // Get count by cities (top 5)
    const citiesResult = await sql`
      SELECT location, COUNT(*) as count
      FROM records
      GROUP BY location
      ORDER BY count DESC
      LIMIT 5
    `;

    return {
      total,
      verified,
      cities: citiesResult.rows.map(row => ({
        _id: row.location,
        count: parseInt(row.count)
      }))
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      total: 0,
      verified: 0,
      cities: []
    };
  }
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-[#0f2537]">
      {/* Header */}
      <header className="border-b border-[#1a3a52]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-[#d4af37]">
              Javidan
            </h1>
            <nav className="flex gap-6">
              <Link
                href="/search"
                className="text-white/80 hover:text-[#d4af37] transition-colors"
              >
                Search
              </Link>
              <Link
                href="/submit"
                className="text-white/80 hover:text-[#d4af37] transition-colors"
              >
                Submit
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            In Memory of Those We Lost
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
            A public memorial and archive documenting the lives lost during Iran&apos;s revolution.
            Community-driven, open-source, and dedicated to preserving the truth.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/submit"
              className="bg-[#d4af37] hover:bg-[#e5c158] text-[#0f2537] px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Submit a Record
            </Link>
            <Link
              href="/search"
              className="border-2 border-[#d4af37] hover:bg-[#d4af37]/10 px-8 py-3 rounded-lg font-semibold transition-colors text-white"
            >
              Search Archive
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-[#1a3a52] rounded-lg border border-[#d4af37]/20 p-6 text-center">
            <div className="text-4xl font-bold text-[#d4af37] mb-2">
              {stats.total.toLocaleString()}
            </div>
            <div className="text-white/80">
              Total Records
            </div>
          </div>
          <div className="bg-[#1a3a52] rounded-lg border border-[#d4af37]/20 p-6 text-center">
            <div className="text-4xl font-bold text-[#d4af37] mb-2">
              {stats.verified.toLocaleString()}
            </div>
            <div className="text-white/80">
              Verified Records
            </div>
          </div>
          <div className="bg-[#1a3a52] rounded-lg border border-[#d4af37]/20 p-6 text-center">
            <div className="text-4xl font-bold text-[#d4af37] mb-2">
              {stats.cities.length}
            </div>
            <div className="text-white/80">
              Cities Documented
            </div>
          </div>
        </div>

        {/* Top Cities */}
        {stats.cities.length > 0 && (
          <div className="bg-[#1a3a52] rounded-lg border border-[#d4af37]/20 p-8">
            <h3 className="text-2xl font-bold text-white mb-6">
              Most Documented Cities
            </h3>
            <div className="space-y-4">
              {stats.cities.map((city: any) => (
                <div key={city._id} className="flex justify-between items-center">
                  <span className="text-lg text-white/80">
                    {city._id}
                  </span>
                  <span className="text-lg font-semibold text-[#d4af37]">
                    {city.count.toLocaleString()} records
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mission Statement */}
        <div className="mt-16 text-center max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-4">
            Why Javidan?
          </h3>
          <p className="text-white/80 leading-relaxed">
            Javidan (جاویدان - eternal) is an open-source, crowd-sourced memorial dedicated to
            documenting and honoring those who lost their lives during Iran&apos;s ongoing revolution.
            We believe in transparency, community verification, and preserving the truth for future generations.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a3a52] mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-white/60">
          <p>Open-source and community-driven. In memory of those we lost.</p>
        </div>
      </footer>
    </div>
  );
}
