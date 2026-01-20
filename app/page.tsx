import Link from 'next/link';
import { getDatabase } from '@/lib/mongodb';

async function getStats() {
  try {
    const db = await getDatabase();
    const collection = db.collection('records');

    const totalRecords = await collection.countDocuments();
    const verifiedRecords = await collection.countDocuments({ verified: true });

    // Get count by cities (top 5)
    const cityCounts = await collection.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).toArray();

    return {
      total: totalRecords,
      verified: verifiedRecords,
      cities: cityCounts
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Javidan
            </h1>
            <nav className="flex gap-6">
              <Link
                href="/search"
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                Search
              </Link>
              <Link
                href="/submit"
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
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
          <h2 className="text-5xl font-bold text-zinc-900 dark:text-white mb-6">
            In Memory of Those We Lost
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto mb-8">
            A public memorial and archive documenting the lives lost during Iran&apos;s revolution.
            Community-driven, open-source, and dedicated to preserving the truth.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/submit"
              className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Submit a Record
            </Link>
            <Link
              href="/search"
              className="border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 px-8 py-3 rounded-lg font-semibold transition-colors text-zinc-900 dark:text-white"
            >
              Search Archive
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 text-center">
            <div className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
              {stats.total.toLocaleString()}
            </div>
            <div className="text-zinc-600 dark:text-zinc-400">
              Total Records
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 text-center">
            <div className="text-4xl font-bold text-green-600 dark:text-green-500 mb-2">
              {stats.verified.toLocaleString()}
            </div>
            <div className="text-zinc-600 dark:text-zinc-400">
              Verified Records
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 text-center">
            <div className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
              {stats.cities.length}
            </div>
            <div className="text-zinc-600 dark:text-zinc-400">
              Cities Documented
            </div>
          </div>
        </div>

        {/* Top Cities */}
        {stats.cities.length > 0 && (
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-8">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
              Most Documented Cities
            </h3>
            <div className="space-y-4">
              {stats.cities.map((city: any) => (
                <div key={city._id} className="flex justify-between items-center">
                  <span className="text-lg text-zinc-700 dark:text-zinc-300">
                    {city._id}
                  </span>
                  <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {city.count.toLocaleString()} records
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mission Statement */}
        <div className="mt-16 text-center max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            Why Javidan?
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Javidan (جاویدان - eternal) is an open-source, crowd-sourced memorial dedicated to
            documenting and honoring those who lost their lives during Iran&apos;s ongoing revolution.
            We believe in transparency, community verification, and preserving the truth for future generations.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-zinc-600 dark:text-zinc-400">
          <p>Open-source and community-driven. In memory of those we lost.</p>
        </div>
      </footer>
    </div>
  );
}
