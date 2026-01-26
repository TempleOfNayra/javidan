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
              <Link
                href="/search"
                className="text-white/80 hover:text-gold transition-colors font-semibold"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-navy-dark mb-4">
            Search Archive
          </h1>
          <p className="text-lg text-gray-700">
            {records.length} records found
          </p>
        </div>

        {/* Search Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm">
          <form method="GET" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={params.name}
                placeholder="First or last name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                defaultValue={params.location}
                placeholder="City or province"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Birth Year
              </label>
              <input
                type="number"
                id="year"
                name="year"
                defaultValue={params.year}
                placeholder="e.g., 1995"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>

            <div className="md:col-span-3 flex gap-4">
              <button
                type="submit"
                className="bg-gold hover:bg-gold-light text-navy-dark px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Search
              </button>
              <Link
                href="/search"
                className="border-2 border-gold hover:bg-gold/10 px-6 py-2 rounded-lg font-semibold transition-colors text-navy-dark"
              >
                Clear
              </Link>
            </div>
          </form>
        </div>

        {/* Results */}
        {records.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600 mb-4">
              No records found
            </p>
            <Link
              href="/submit"
              className="text-gold hover:text-gold-light font-semibold hover:underline"
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
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gold transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-navy-dark">
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

                <div className="space-y-2 text-sm text-gray-600">
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
                  <p className="text-xs text-gray-500 pt-2">
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
