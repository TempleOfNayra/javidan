import Link from 'next/link';
import { sql } from '@/lib/db';

async function getRecords(searchParams: { [key: string]: string | undefined }) {
  try {
    // Build query based on search params
    let result;

    if (!searchParams.name && !searchParams.location && !searchParams.year) {
      // No filters - get all records
      result = await sql`
        SELECT
          r.id, r.first_name, r.last_name, r.location, r.birth_year, r.national_id,
          r.father_name, r.mother_name, r.verified, r.verification_level, r.evidence_count,
          r.submitted_at, r.updated_at,
          COUNT(m.id) as media_count
        FROM records r
        LEFT JOIN media m ON r.id = m.record_id
        GROUP BY r.id
        ORDER BY r.submitted_at DESC
        LIMIT 100
      `;
    } else if (searchParams.name && !searchParams.location && !searchParams.year) {
      // Search by name only
      const namePattern = `%${searchParams.name}%`;
      result = await sql`
        SELECT
          r.id, r.first_name, r.last_name, r.location, r.birth_year, r.national_id,
          r.father_name, r.mother_name, r.verified, r.verification_level, r.evidence_count,
          r.submitted_at, r.updated_at,
          COUNT(m.id) as media_count
        FROM records r
        LEFT JOIN media m ON r.id = m.record_id
        WHERE LOWER(r.first_name) LIKE LOWER(${namePattern}) OR LOWER(r.last_name) LIKE LOWER(${namePattern})
        GROUP BY r.id
        ORDER BY r.submitted_at DESC
        LIMIT 100
      `;
    } else if (searchParams.location && !searchParams.name && !searchParams.year) {
      // Search by location only
      const locationPattern = `%${searchParams.location}%`;
      result = await sql`
        SELECT
          r.id, r.first_name, r.last_name, r.location, r.birth_year, r.national_id,
          r.father_name, r.mother_name, r.verified, r.verification_level, r.evidence_count,
          r.submitted_at, r.updated_at,
          COUNT(m.id) as media_count
        FROM records r
        LEFT JOIN media m ON r.id = m.record_id
        WHERE LOWER(r.location) LIKE LOWER(${locationPattern})
        GROUP BY r.id
        ORDER BY r.submitted_at DESC
        LIMIT 100
      `;
    } else if (searchParams.year && !searchParams.name && !searchParams.location) {
      // Search by year only
      const year = parseInt(searchParams.year);
      result = await sql`
        SELECT
          r.id, r.first_name, r.last_name, r.location, r.birth_year, r.national_id,
          r.father_name, r.mother_name, r.verified, r.verification_level, r.evidence_count,
          r.submitted_at, r.updated_at,
          COUNT(m.id) as media_count
        FROM records r
        LEFT JOIN media m ON r.id = m.record_id
        WHERE r.birth_year = ${year}
        GROUP BY r.id
        ORDER BY r.submitted_at DESC
        LIMIT 100
      `;
    } else if (searchParams.name && searchParams.location && !searchParams.year) {
      // Search by name and location
      const namePattern = `%${searchParams.name}%`;
      const locationPattern = `%${searchParams.location}%`;
      result = await sql`
        SELECT
          r.id, r.first_name, r.last_name, r.location, r.birth_year, r.national_id,
          r.father_name, r.mother_name, r.verified, r.verification_level, r.evidence_count,
          r.submitted_at, r.updated_at,
          COUNT(m.id) as media_count
        FROM records r
        LEFT JOIN media m ON r.id = m.record_id
        WHERE (LOWER(r.first_name) LIKE LOWER(${namePattern}) OR LOWER(r.last_name) LIKE LOWER(${namePattern}))
          AND LOWER(r.location) LIKE LOWER(${locationPattern})
        GROUP BY r.id
        ORDER BY r.submitted_at DESC
        LIMIT 100
      `;
    } else if (searchParams.name && searchParams.year && !searchParams.location) {
      // Search by name and year
      const namePattern = `%${searchParams.name}%`;
      const year = parseInt(searchParams.year || '0');
      result = await sql`
        SELECT
          r.id, r.first_name, r.last_name, r.location, r.birth_year, r.national_id,
          r.father_name, r.mother_name, r.verified, r.verification_level, r.evidence_count,
          r.submitted_at, r.updated_at,
          COUNT(m.id) as media_count
        FROM records r
        LEFT JOIN media m ON r.id = m.record_id
        WHERE (LOWER(r.first_name) LIKE LOWER(${namePattern}) OR LOWER(r.last_name) LIKE LOWER(${namePattern}))
          AND r.birth_year = ${year}
        GROUP BY r.id
        ORDER BY r.submitted_at DESC
        LIMIT 100
      `;
    } else if (searchParams.location && searchParams.year && !searchParams.name) {
      // Search by location and year
      const locationPattern = `%${searchParams.location}%`;
      const year = parseInt(searchParams.year || '0');
      result = await sql`
        SELECT
          r.id, r.first_name, r.last_name, r.location, r.birth_year, r.national_id,
          r.father_name, r.mother_name, r.verified, r.verification_level, r.evidence_count,
          r.submitted_at, r.updated_at,
          COUNT(m.id) as media_count
        FROM records r
        LEFT JOIN media m ON r.id = m.record_id
        WHERE LOWER(r.location) LIKE LOWER(${locationPattern})
          AND r.birth_year = ${year}
        GROUP BY r.id
        ORDER BY r.submitted_at DESC
        LIMIT 100
      `;
    } else {
      // All three filters
      const namePattern = `%${searchParams.name}%`;
      const locationPattern = `%${searchParams.location}%`;
      const year = parseInt(searchParams.year || '0');
      result = await sql`
        SELECT
          r.id, r.first_name, r.last_name, r.location, r.birth_year, r.national_id,
          r.father_name, r.mother_name, r.verified, r.verification_level, r.evidence_count,
          r.submitted_at, r.updated_at,
          COUNT(m.id) as media_count
        FROM records r
        LEFT JOIN media m ON r.id = m.record_id
        WHERE (LOWER(r.first_name) LIKE LOWER(${namePattern}) OR LOWER(r.last_name) LIKE LOWER(${namePattern}))
          AND LOWER(r.location) LIKE LOWER(${locationPattern})
          AND r.birth_year = ${year}
        GROUP BY r.id
        ORDER BY r.submitted_at DESC
        LIMIT 100
      `;
    }

    return result.rows.map((record: any) => ({
      _id: record.id.toString(),
      firstName: record.first_name,
      lastName: record.last_name,
      location: record.location,
      birthYear: record.birth_year,
      nationalId: record.national_id,
      fatherName: record.father_name,
      motherName: record.mother_name,
      verified: record.verified,
      verificationLevel: record.verification_level || 'unverified',
      evidenceCount: parseInt(record.evidence_count) || 0,
      submittedAt: record.submitted_at.toISOString(),
      updatedAt: record.updated_at.toISOString(),
      media: [],
      mediaCount: parseInt(record.media_count) || 0
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
    <div className="min-h-screen bg-[#0f2537]">
      {/* Header */}
      <header className="border-b border-[#1a3a52]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-[#d4af37]">
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
                  {record.mediaCount > 0 && (
                    <p>
                      <span className="font-medium">Media:</span> {record.mediaCount} file(s)
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
