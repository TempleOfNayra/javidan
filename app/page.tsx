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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-navy-dark border-b border-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo - Center */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img
                src="/lion-sun.svg"
                alt="Lion and Sun - Emblem of Iran"
                className="h-14 w-auto"
              />
            </div>
            <nav className="ml-auto flex gap-6">
              <Link
                href="/search"
                className="text-white/80 hover:text-gold transition-colors"
              >
                Search
              </Link>
              <Link
                href="/submit"
                className="text-white/80 hover:text-gold transition-colors"
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
          <h2 className="text-5xl font-bold text-navy-dark mb-6">
            In Memory of Those We Lost
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            A public memorial and archive documenting the lives lost during Iran&apos;s revolution.
            Community-driven, open-source, and dedicated to preserving the truth.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/submit"
              className="bg-gold hover:bg-gold-light text-navy-dark px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Submit a Record
            </Link>
            <Link
              href="/search"
              className="border-2 border-gold hover:bg-gold/10 px-8 py-3 rounded-lg font-semibold transition-colors text-navy-dark"
            >
              Search Archive
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-navy rounded-lg border border-gold/20 p-6 text-center">
            <div className="text-4xl font-bold text-gold mb-2">
              {stats.total.toLocaleString()}
            </div>
            <div className="text-white/80">
              Total Records
            </div>
          </div>
          <div className="bg-navy rounded-lg border border-gold/20 p-6 text-center">
            <div className="text-4xl font-bold text-gold mb-2">
              {stats.verified.toLocaleString()}
            </div>
            <div className="text-white/80">
              Verified Records
            </div>
          </div>
          <div className="bg-navy rounded-lg border border-gold/20 p-6 text-center">
            <div className="text-4xl font-bold text-gold mb-2">
              {stats.cities.length}
            </div>
            <div className="text-white/80">
              Cities Documented
            </div>
          </div>
        </div>

        {/* Top Cities */}
        {stats.cities.length > 0 && (
          <div className="bg-navy rounded-lg border border-gold/20 p-8">
            <h3 className="text-2xl font-bold text-white mb-6">
              Most Documented Cities
            </h3>
            <div className="space-y-4">
              {stats.cities.map((city: any) => (
                <div key={city._id} className="flex justify-between items-center">
                  <span className="text-lg text-white/80">
                    {city._id}
                  </span>
                  <span className="text-lg font-semibold text-gold">
                    {city.count.toLocaleString()} records
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mission Statement */}
        <div className="mt-16 text-center max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-navy-dark mb-4">
            Why Javidan?
          </h3>
          <p className="text-gray-700 leading-relaxed">
            Javidan (جاویدان - eternal) is an open-source, crowd-sourced memorial dedicated to
            documenting and honoring those who lost their lives during Iran&apos;s ongoing revolution.
            We believe in transparency, community verification, and preserving the truth for future generations.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-24 bg-navy-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-white/60">
          <p>Open-source and community-driven. In memory of those we lost.</p>
        </div>
      </footer>
    </div>
  );
}
