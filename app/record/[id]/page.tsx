import Link from 'next/link';
import { sql } from '@/lib/db';
import { notFound } from 'next/navigation';
import AddEvidenceSection from '@/components/AddEvidenceSection';
import Header from '@/components/Header';

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

    // Get victim picture (primary image)
    const victimPictureResult = await sql`
      SELECT * FROM media WHERE record_id = ${parseInt(id)} AND is_primary = true LIMIT 1
    `;

    // Get supporting media (non-primary)
    const mediaResult = await sql`
      SELECT * FROM media WHERE record_id = ${parseInt(id)} AND (is_primary = false OR is_primary IS NULL)
    `;

    // Get Twitter links for this record
    const twitterResult = await sql`
      SELECT * FROM twitter_links WHERE record_id = ${parseInt(id)} ORDER BY created_at
    `;

    return {
      _id: record.id.toString(),
      firstName: record.first_name,
      lastName: record.last_name,
      firstNameEn: record.first_name_en,
      lastNameEn: record.last_name_en,
      location: record.location,
      birthYear: record.birth_year,
      incidentDate: record.incident_date ? new Date(record.incident_date).toISOString().split('T')[0] : null,
      nationalId: record.national_id,
      fatherName: record.father_name,
      motherName: record.mother_name,
      gender: record.gender,
      victimStatus: record.victim_status,
      hashtags: record.hashtags,
      additionalInfo: record.additional_info,
      perpetrator: record.perpetrator,
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
      victimPicture: victimPictureResult.rows.length > 0 ? {
        type: victimPictureResult.rows[0].type,
        r2Key: victimPictureResult.rows[0].r2_key,
        publicUrl: victimPictureResult.rows[0].public_url,
        fileName: victimPictureResult.rows[0].file_name,
        fileSize: victimPictureResult.rows[0].file_size,
        uploadedAt: victimPictureResult.rows[0].uploaded_at.toISOString(),
      } : null,
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

const victimStatusLabels: Record<string, string> = {
  executed: 'اعدام شده',
  killed: 'کشته شده',
  incarcerated: 'زندانی',
  disappeared: 'ناپدید شده',
  injured: 'مجروح',
  other: 'سایر',
};

const genderLabels: Record<string, string> = {
  male: 'مرد',
  female: 'زن',
};

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
            تأیید شده توسط منبع موثق
          </span>
        );
      case 'document':
        return (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <span className="text-base">✓✓</span>
            تأیید شده با مدرک
          </span>
        );
      case 'community':
        return (
          <span className="text-sm text-blue-600 flex items-center gap-1">
            <span className="text-base">✓</span>
            تأیید شده توسط جامعه
          </span>
        );
      default:
        return (
          <span className="text-sm text-yellow-600 flex items-center gap-1">
            <span className="text-base">⚠</span>
            تأیید نشده
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Back Link */}
        <Link
          href="/search"
          className="inline-flex items-center text-gray-600 hover:text-gold mb-8 transition-colors"
        >
          → بازگشت به جستجو
        </Link>

        {/* Centered Profile Section */}
        <div className="flex flex-col items-center mb-12">
          {/* Victim Picture - Large and Centered */}
          {record.victimPicture ? (
            <div className="mb-6">
              <img
                src={record.victimPicture.publicUrl}
                alt={`${record.firstName} ${record.lastName}`}
                className="w-80 h-80 object-cover rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="w-80 h-80 bg-gray-100 rounded-lg flex items-center justify-center mb-6 shadow-lg">
              <span className="text-gray-400 text-9xl">👤</span>
            </div>
          )}

          {/* Names - Side by Side */}
          <div className="flex justify-between items-baseline w-full max-w-3xl mb-4">
            <h1 className="text-5xl font-bold text-navy-dark" dir="rtl">
              {record.firstName} {record.lastName}
            </h1>
            {(record.firstNameEn || record.lastNameEn) && (
              <h2 className="text-3xl font-semibold text-gray-600" dir="ltr">
                {record.firstNameEn} {record.lastNameEn}
              </h2>
            )}
          </div>

          {/* Verification Badge */}
          <div className="mb-4">
            {verificationBadge()}
          </div>
        </div>

        {/* Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-navy-dark mb-6">
            اطلاعات
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Victim Status */}
            {record.victimStatus && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  وضعیت قربانی
                </p>
                <p className="text-lg text-gray-900">
                  {victimStatusLabels[record.victimStatus] || record.victimStatus}
                </p>
              </div>
            )}

            {/* Gender */}
            {record.gender && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  جنسیت
                </p>
                <p className="text-lg text-gray-900">
                  {genderLabels[record.gender] || record.gender}
                </p>
              </div>
            )}

            {/* Location */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                محل حادثه
              </p>
              <p className="text-lg text-gray-900">
                {record.location}
              </p>
            </div>

            {/* Birth Year */}
            {record.birthYear && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  سال تولد
                </p>
                <p className="text-lg text-gray-900">
                  {record.birthYear}
                </p>
              </div>
            )}

            {/* Incident Date */}
            {record.incidentDate && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  تاریخ حادثه
                </p>
                <p className="text-lg text-gray-900">
                  {new Date(record.incidentDate).toLocaleDateString('fa-IR')}
                </p>
              </div>
            )}

            {/* National ID */}
            {record.nationalId && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  کد ملی
                </p>
                <p className="text-lg text-gray-900" dir="ltr">
                  {record.nationalId}
                </p>
              </div>
            )}

            {/* Father's Name */}
            {record.fatherName && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  نام پدر
                </p>
                <p className="text-lg text-gray-900">
                  {record.fatherName}
                </p>
              </div>
            )}

            {/* Mother's Name */}
            {record.motherName && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  نام مادر
                </p>
                <p className="text-lg text-gray-900">
                  {record.motherName}
                </p>
              </div>
            )}

            {/* Perpetrator */}
            {record.perpetrator && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  عامل جنایت
                </p>
                <p className="text-lg text-gray-900">
                  {record.perpetrator}
                </p>
              </div>
            )}

            {/* Tags */}
            {record.hashtags && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  برچسب‌ها
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

            {/* External References */}
            {record.twitterLinks && record.twitterLinks.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  منابع خارجی ({record.twitterLinks.length})
                </p>
                <div className="space-y-1">
                  {record.twitterLinks.map((link: any, index: number) => (
                    <div key={link.id}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg text-blue-600 hover:underline break-all"
                        dir="ltr"
                      >
                        {link.url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Information */}
            {record.additionalInfo && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  اطلاعات تکمیلی
                </p>
                <p className="text-lg text-gray-900 whitespace-pre-wrap">
                  {record.additionalInfo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Supporting Documents Gallery */}
        {record.media && record.media.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-navy-dark mb-6">
              مدارک پشتیبان ({record.media.length})
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
                        alt={`مدرک ${index + 1}`}
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

        {/* Add Evidence Section */}
        <AddEvidenceSection recordId={id} />

        {/* Metadata */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>ثبت شده در {new Date(record.submittedAt).toLocaleDateString('fa-IR')}</p>
          {record.submitterTwitterId && (
            <p>
              ثبت شده توسط:{' '}
              <a
                href={`https://twitter.com/${record.submitterTwitterId.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
                dir="ltr"
              >
                {record.submitterTwitterId.startsWith('@') ? record.submitterTwitterId : `@${record.submitterTwitterId}`}
              </a>
            </p>
          )}
          <p>شناسه رکورد: {record._id}</p>
        </div>
      </main>
    </div>
  );
}
