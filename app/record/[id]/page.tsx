import Link from 'next/link';
import { sql } from '@/lib/db';
import { notFound } from 'next/navigation';

async function getRecord(id: string) {
  try {
    // Get record
    const recordResult = await sql`
      SELECT * FROM records WHERE id = ${parseInt(id)}
    `;

    if (recordResult.rows.length === 0) {
      return null;
    }

    const record = recordResult.rows[0];

    // Get media for this record
    const mediaResult = await sql`
      SELECT * FROM media WHERE record_id = ${parseInt(id)}
    `;

    return {
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
      evidenceCount: record.evidence_count || 0,
      submittedAt: record.submitted_at.toISOString(),
      updatedAt: record.updated_at.toISOString(),
      media: mediaResult.rows.map((m: any) => ({
        type: m.type,
        r2Key: m.r2_key,
        publicUrl: m.public_url,
        fileName: m.file_name,
        fileSize: m.file_size,
        uploadedAt: m.uploaded_at.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error fetching record:', error);
    return null;
  }
}

export default async function RecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getRecord(id);

  if (!record) {
    notFound();
  }

  const verificationBadge = () => {
    switch (record.verificationLevel) {
      case 'trusted':
        return (
          <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
            <span className="text-green-600 dark:text-green-400 text-2xl">✓✓✓</span>
            <span className="text-green-700 dark:text-green-300 font-semibold">
              Trusted Verified
            </span>
          </div>
        );
      case 'document':
        return (
          <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
            <span className="text-green-600 dark:text-green-400 text-2xl">✓✓</span>
            <span className="text-green-700 dark:text-green-300 font-semibold">
              Document Verified
            </span>
          </div>
        );
      case 'community':
        return (
          <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
            <span className="text-blue-600 dark:text-blue-400 text-2xl">✓</span>
            <span className="text-blue-700 dark:text-blue-300 font-semibold">
              Community Verified
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-2">
            <span className="text-yellow-600 dark:text-yellow-400 text-2xl">⚠</span>
            <span className="text-yellow-700 dark:text-yellow-300 font-semibold">
              Unverified
            </span>
          </div>
        );
    }
  };

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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Back Link */}
        <Link
          href="/search"
          className="inline-flex items-center text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white mb-8"
        >
          ← Back to Search
        </Link>

        {/* Name and Verification */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-zinc-900 dark:text-white mb-4">
            {record.firstName} {record.lastName}
          </h1>
          {verificationBadge()}
        </div>

        {/* Main Information */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6">
            Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Location of Incident
              </p>
              <p className="text-lg text-zinc-900 dark:text-white">
                {record.location}
              </p>
            </div>

            {record.birthYear && (
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Birth Year
                </p>
                <p className="text-lg text-zinc-900 dark:text-white">
                  {record.birthYear}
                </p>
              </div>
            )}

            {record.nationalId && (
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  National ID
                </p>
                <p className="text-lg text-zinc-900 dark:text-white">
                  {record.nationalId}
                </p>
              </div>
            )}

            {record.fatherName && (
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Father&apos;s Name
                </p>
                <p className="text-lg text-zinc-900 dark:text-white">
                  {record.fatherName}
                </p>
              </div>
            )}

            {record.motherName && (
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Mother&apos;s Name
                </p>
                <p className="text-lg text-zinc-900 dark:text-white">
                  {record.motherName}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Media Gallery */}
        {record.media && record.media.length > 0 && (
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-8 mb-8">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6">
              Media ({record.media.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {record.media.map((media: any, index: number) => (
                <div key={index} className="group relative">
                  {media.type === 'image' ? (
                    <a
                      href={media.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden"
                    >
                      <img
                        src={media.publicUrl}
                        alt={`Media ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </a>
                  ) : media.type === 'video' ? (
                    <video
                      src={media.publicUrl}
                      controls
                      className="w-full aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-lg"
                    />
                  ) : (
                    <a
                      href={media.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2">📄</div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {media.fileName}
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Evidence Button */}
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-8 text-center">
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Have additional information?
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Help verify this record by adding evidence, documents, or additional details.
          </p>
          <button className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-lg font-semibold transition-colors">
            Add Evidence (Coming Soon)
          </button>
        </div>

        {/* Metadata */}
        <div className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-500">
          <p>Submitted on {new Date(record.submittedAt).toLocaleDateString()}</p>
          <p>Record ID: {record._id}</p>
        </div>
      </main>
    </div>
  );
}
