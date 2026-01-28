import Link from 'next/link';
import { sql } from '@/lib/db';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import AddMediaForm from '@/components/AddMediaForm';
import AddProfilePicture from '@/components/AddProfilePicture';

async function getSecurityForce(id: string) {
  try {
    // Get security force
    const forceResult = await sql`
      SELECT * FROM security_forces WHERE id = ${parseInt(id)}
    `;

    if (forceResult.rows.length === 0) {
      return null;
    }

    const force = forceResult.rows[0];

    // Get media for this security force
    const mediaResult = await sql`
      SELECT * FROM media WHERE security_force_id = ${parseInt(id)}
    `;

    // Get external links for this security force
    const linksResult = await sql`
      SELECT * FROM external_links WHERE security_force_id = ${parseInt(id)} ORDER BY created_at
    `;

    return {
      _id: force.id.toString(),
      firstName: force.first_name,
      lastName: force.last_name,
      firstNameEn: force.first_name_en,
      lastNameEn: force.last_name_en,
      fullName: force.full_name,
      fullNameEn: force.full_name_en,
      city: force.city,
      address: force.address,
      residenceAddress: force.residence_address,
      latitude: force.latitude,
      longitude: force.longitude,
      organization: force.organization,
      rankPosition: force.rank_position,
      twitterHandle: force.twitter_handle,
      instagramHandle: force.instagram_handle,
      hashtags: force.hashtags,
      additionalInfo: force.additional_info,
      submitterTwitterId: force.submitter_twitter_id,
      externalLinks: linksResult.rows.map((link: any) => ({
        id: link.id,
        url: link.url,
        createdAt: link.created_at.toISOString(),
      })),
      verified: force.verified,
      verificationLevel: force.verification_level || 'unverified',
      evidenceCount: force.evidence_count || 0,
      submittedAt: force.submitted_at.toISOString(),
      updatedAt: force.updated_at.toISOString(),
      media: mediaResult.rows.map((m: any) => ({
        type: m.type,
        r2Key: m.r2_key,
        publicUrl: m.public_url,
        fileName: m.file_name,
        fileSize: m.file_size,
        isPrimary: m.is_primary,
        uploadedAt: m.uploaded_at.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error fetching security force:', error);
    return null;
  }
}

export default async function SecurityForcePage({
  params,
}: {
  params: Promise<{ id: string; slug?: string[] }>;
}) {
  const resolvedParams = await params;
  // ID is used for lookup, slug is optional and ignored (for SEO only)
  const force = await getSecurityForce(resolvedParams.id);

  if (!force) {
    notFound();
  }

  const primaryImage = force.media.find((m) => m.isPrimary)?.publicUrl || force.media.find((m) => m.type === 'image')?.publicUrl;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Back link */}
        <Link
          href="/search"
          className="text-gold hover:text-gold-light mb-6 inline-block"
        >
          ← بازگشت به جستجو
        </Link>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Security Force Info */}
          <div className="p-8">
            {/* Names with Profile Picture */}
            <div className="flex items-start gap-6 mb-6">
              {/* Left side: Profile Picture */}
              <div className="flex-shrink-0">
                {primaryImage ? (
                  <img
                    src={primaryImage}
                    alt={force.fullName || `${force.firstName} ${force.lastName}`}
                    className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200"
                  />
                ) : (
                  <div>
                    <div className="w-48 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                      <span className="text-gray-400 text-5xl mb-2">👤</span>
                      <p className="text-sm text-gray-500 text-center px-2" dir="rtl">
                        بدون تصویر
                      </p>
                    </div>
                    <AddProfilePicture agentId={force._id} />
                  </div>
                )}
              </div>

              {/* Right side: Names */}
              <div className="flex-1 flex justify-between items-baseline">
                <h1 className="text-4xl font-bold text-navy-dark" dir="rtl">
                  {force.fullName || `${force.firstName} ${force.lastName}`}
                </h1>
                {(force.fullNameEn || force.firstNameEn || force.lastNameEn) && (
                  <p className="text-2xl text-gray-600" dir="ltr">
                    {force.fullNameEn || `${force.firstNameEn} ${force.lastNameEn}`}
                  </p>
                )}
              </div>
            </div>

            {/* Force Type Badge */}
            <div className="mb-4">
              <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                نیروهای سرکوب
              </span>
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6" dir="rtl">
              {force.city && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">شهر</h3>
                  <p className="text-lg text-navy-dark">{force.city}</p>
                </div>
              )}

              {force.organization && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">سازمان/نیرو</h3>
                  <p className="text-lg text-navy-dark">{force.organization}</p>
                </div>
              )}

              {force.rankPosition && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">رتبه/سمت</h3>
                  <p className="text-lg text-navy-dark">{force.rankPosition}</p>
                </div>
              )}
            </div>

            {/* Address */}
            {force.address && (
              <div className="mb-6" dir="rtl">
                <h3 className="text-sm font-semibold text-gray-500 mb-1">آدرس</h3>
                <p className="text-lg text-navy-dark">{force.address}</p>
              </div>
            )}

            {/* Residence Address */}
            {force.residenceAddress && (
              <div className="mb-6" dir="rtl">
                <h3 className="text-sm font-semibold text-gray-500 mb-1">آدرس محل سکونت</h3>
                <p className="text-lg text-navy-dark">{force.residenceAddress}</p>
              </div>
            )}

            {/* Social Media */}
            {(force.twitterHandle || force.instagramHandle) && (
              <div className="mb-6" dir="rtl">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">شبکه‌های اجتماعی</h3>
                <div className="space-y-2">
                  {force.twitterHandle && (
                    <p className="text-lg text-navy-dark">
                      <span className="text-gray-500">توییتر:</span> {force.twitterHandle}
                    </p>
                  )}
                  {force.instagramHandle && (
                    <p className="text-lg text-navy-dark">
                      <span className="text-gray-500">اینستاگرام:</span>{' '}
                      <a
                        href={force.instagramHandle.startsWith('http') ? force.instagramHandle : `https://instagram.com/${force.instagramHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:text-gold-light"
                      >
                        {force.instagramHandle}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Additional Info */}
            {force.additionalInfo && (
              <div className="mb-6" dir="rtl">
                <h3 className="text-sm font-semibold text-gray-500 mb-1">اطلاعات تکمیلی</h3>
                <p className="text-lg text-navy-dark whitespace-pre-wrap">{force.additionalInfo}</p>
              </div>
            )}

            {/* Hashtags */}
            {force.hashtags && (
              <div className="mb-6" dir="rtl">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">هشتگ‌ها</h3>
                <p className="text-lg text-navy-dark">{force.hashtags}</p>
              </div>
            )}

            {/* External Links */}
            {force.externalLinks.length > 0 && (
              <div className="mb-6" dir="rtl">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">لینک‌های مرتبط</h3>
                <ul className="space-y-2">
                  {force.externalLinks.map((link: any) => (
                    <li key={link.id}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:text-gold-light break-all"
                      >
                        {link.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verification Status */}
            <div className="border-t pt-6 mt-6">
              <div className="flex items-center gap-4 mb-4" dir="rtl">
                <span className="text-sm text-gray-500">وضعیت تأیید:</span>
                {force.verificationLevel === 'trusted' && (
                  <span className="text-green-600 flex items-center gap-1">
                    <span>✓✓✓</span> تأیید شده
                  </span>
                )}
                {force.verificationLevel === 'document' && (
                  <span className="text-green-600 flex items-center gap-1">
                    <span>✓✓</span> تأیید شده
                  </span>
                )}
                {force.verificationLevel === 'community' && (
                  <span className="text-blue-600 flex items-center gap-1">
                    <span>✓</span> تأیید شده
                  </span>
                )}
                {force.verificationLevel === 'unverified' && (
                  <span className="text-yellow-600 flex items-center gap-1">
                    <span>⚠</span> تأیید نشده
                  </span>
                )}
              </div>

              {/* Submitter Info */}
              <div className="flex items-center gap-4" dir="rtl">
                <span className="text-sm text-gray-500">ارسال شده توسط:</span>
                {force.submitterTwitterId ? (
                  <a
                    href={`https://twitter.com/${force.submitterTwitterId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:text-gold-light"
                  >
                    @{force.submitterTwitterId}
                  </a>
                ) : (
                  <span className="text-gray-600">ناشناس</span>
                )}
              </div>
            </div>

            {/* Supporting Media */}
            {force.media.length > 1 && (
              <div className="border-t pt-6 mt-6">
                <h3 className="text-xl font-bold text-navy-dark mb-4" dir="rtl">
                  مدارک و تصاویر ({force.media.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {force.media.map((media: any, idx: number) => (
                    <a
                      key={idx}
                      href={media.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {media.type === 'image' ? (
                        <img
                          src={media.publicUrl}
                          alt={`Evidence ${idx + 1}`}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                          <span className="text-4xl">
                            {media.type === 'video' ? '📹' : '📄'}
                          </span>
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Add Additional Media Form */}
            <AddMediaForm agentId={force._id} />
          </div>
        </div>
      </main>
    </div>
  );
}
