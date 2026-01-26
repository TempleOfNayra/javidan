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

    // Get Twitter links for this record
    const twitterResult = await sql`
      SELECT * FROM twitter_links WHERE record_id = ${parseInt(id)} ORDER BY created_at
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
      hashtags: record.hashtags,
      additionalInfo: record.additional_info,
      submitterTwitterId: record.submitter_twitter_id,
      twitterLinks: twitterResult.rows.map((t: any) => ({
        id: t.id,
        url: t.url,
        createdAt: t.created_at.toISOString(),
      })),
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
          <span className="text-sm text-green-600 flex items-center gap-1">
            <span className="text-base">✓✓✓</span>
            Trusted Verified
          </span>
        );
      case 'document':
        return (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <span className="text-base">✓✓</span>
            Document Verified
          </span>
        );
      case 'community':
        return (
          <span className="text-sm text-blue-600 flex items-center gap-1">
            <span className="text-base">✓</span>
            Community Verified
          </span>
        );
      default:
        return (
          <span className="text-sm text-yellow-600 flex items-center gap-1">
            <span className="text-base">⚠</span>
            Unverified
          </span>
        );
    }
  };

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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Back Link */}
        <Link
          href="/search"
          className="inline-flex items-center text-gray-600 hover:text-gold mb-8 transition-colors"
        >
          ← Back to Search
        </Link>

        {/* Name and Verification */}
        <div className="mb-8 flex gap-6 items-start">
          {/* Profile Picture */}
          {record.media && record.media.length > 0 && record.media[0].type === 'image' ? (
            <img
              src={record.media[0].publicUrl}
              alt={`${record.firstName} ${record.lastName}`}
              className="w-32 h-32 object-cover rounded-lg shadow-md flex-shrink-0"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-gray-400 text-5xl">👤</span>
            </div>
          )}

          {/* Name and Badge */}
          <div className="flex-1">
            <h1 className="text-5xl font-bold text-navy-dark mb-2">
              {record.firstName} {record.lastName}
            </h1>
            {verificationBadge()}
          </div>
        </div>

        {/* Main Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-navy-dark mb-6">
            Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Location of Incident
              </p>
              <p className="text-lg text-gray-900">
                {record.location}
              </p>
            </div>

            {record.birthYear && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Birth Year
                </p>
                <p className="text-lg text-gray-900">
                  {record.birthYear}
                </p>
              </div>
            )}

            {record.nationalId && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  National ID
                </p>
                <p className="text-lg text-gray-900">
                  {record.nationalId}
                </p>
              </div>
            )}

            {record.fatherName && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Father&apos;s Name
                </p>
                <p className="text-lg text-gray-900">
                  {record.fatherName}
                </p>
              </div>
            )}

            {record.motherName && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Mother&apos;s Name
                </p>
                <p className="text-lg text-gray-900">
                  {record.motherName}
                </p>
              </div>
            )}

            {record.hashtags && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {record.hashtags.split(',').map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {record.twitterLinks && record.twitterLinks.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Twitter / X References ({record.twitterLinks.length})
                </p>
                <div className="space-y-1">
                  {record.twitterLinks.map((link: any, index: number) => (
                    <div key={link.id}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg text-blue-600 hover:underline break-all"
                      >
                        {link.url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {record.additionalInfo && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Additional Information
                </p>
                <p className="text-lg text-gray-900 whitespace-pre-wrap">
                  {record.additionalInfo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Media Gallery */}
        {record.media && record.media.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-navy-dark mb-6">
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
                      className="block aspect-square bg-gray-100 rounded-lg overflow-hidden"
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
                      className="w-full aspect-square bg-gray-100 rounded-lg"
                    />
                  ) : (
                    <a
                      href={media.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center aspect-square bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2">📄</div>
                        <p className="text-sm text-gray-600">
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
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center shadow-sm">
          <h3 className="text-xl font-semibold text-navy-dark mb-2">
            Have additional information?
          </h3>
          <p className="text-gray-600 mb-4">
            Help verify this record by adding evidence, documents, or additional details.
          </p>
          <button className="bg-gold hover:bg-gold-light text-navy-dark px-6 py-3 rounded-lg font-semibold transition-colors">
            Add Evidence (Coming Soon)
          </button>
        </div>

        {/* Metadata */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Submitted on {new Date(record.submittedAt).toLocaleDateString()}</p>
          {record.submitterTwitterId && (
            <p>
              Submitted by:{' '}
              <a
                href={`https://twitter.com/${record.submitterTwitterId.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {record.submitterTwitterId.startsWith('@') ? record.submitterTwitterId : `@${record.submitterTwitterId}`}
              </a>
            </p>
          )}
          <p>Record ID: {record._id}</p>
        </div>
      </main>
    </div>
  );
}
