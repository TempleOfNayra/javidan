import Link from 'next/link';
import { getDatabase } from '@/lib/mongodb';
import { VictimRecord } from '@/lib/types/record';

async function getRecords(searchParams: { [key: string]: string | undefined }) {
  try {
    const db = await getDatabase();
    const collection = db.collection('records');

    // Build query
    const query: any = {};

    if (searchParams.name) {
      query.$or = [
        { firstName: { $regex: searchParams.name, $options: 'i' } },
        { lastName: { $regex: searchParams.name, $options: 'i' } },
      ];
    }

    if (searchParams.location) {
      query.location = { $regex: searchParams.location, $options: 'i' };
    }

    if (searchParams.year) {
      query.birthYear = parseInt(searchParams.year);
    }

    // Fetch records
    const records = await collection
      .find(query)
      .sort({ submittedAt: -1 })
      .limit(100)
      .toArray();

    return records.map((record) => ({
      ...record,
      _id: record._id.toString(),
      submittedAt: record.submittedAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      media: record.media?.map((m: any) => ({
        ...m,
        uploadedAt: m.uploadedAt?.toISOString() || new Date().toISOString(),
      })) || [],
    }));
  } catch (error) {
    console.error('Error fetching records:', error);
    return [];
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const records = await getRecords(params);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-zinc-900 dark:text-white">
              Javidan
            </Link>
            <nav className="flex gap-6">
              <Link
                href="/search"
                className="text-zinc-900 dark:text-white font-semibold"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            Search Archive
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {records.length} records found
          </p>
        </div>

        {/* Search Filters */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 mb-8">
          <form method="GET" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={params.name}
                placeholder="First or last name"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                defaultValue={params.location}
                placeholder="City or province"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Birth Year
              </label>
              <input
                type="number"
                id="year"
                name="year"
                defaultValue={params.year}
                placeholder="e.g., 1995"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-3 flex gap-4">
              <button
                type="submit"
                className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Search
              </button>
              <Link
                href="/search"
                className="border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 px-6 py-2 rounded-lg font-semibold transition-colors text-zinc-900 dark:text-white"
              >
                Clear
              </Link>
            </div>
          </form>
        </div>

        {/* Results */}
        {records.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-4">
              No records found
            </p>
            <Link
              href="/submit"
              className="text-zinc-900 dark:text-white font-semibold hover:underline"
            >
              Submit the first record
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map((record: any) => (
              <Link
                key={record._id}
                href={`/record/${record._id}`}
                className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                    {record.firstName} {record.lastName}
                  </h3>
                  {record.verified ? (
                    <span className="text-green-600 dark:text-green-500 text-2xl" title="Verified">
                      ✓
                    </span>
                  ) : (
                    <span className="text-yellow-600 dark:text-yellow-500 text-2xl" title="Unverified">
                      ⚠
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <p>
                    <span className="font-medium">Location:</span> {record.location}
                  </p>
                  {record.birthYear && (
                    <p>
                      <span className="font-medium">Birth Year:</span> {record.birthYear}
                    </p>
                  )}
                  {record.media?.length > 0 && (
                    <p>
                      <span className="font-medium">Media:</span> {record.media.length} file(s)
                    </p>
                  )}
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 pt-2">
                    Submitted: {new Date(record.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
