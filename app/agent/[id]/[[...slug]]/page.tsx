import Link from 'next/link';
import { sql } from '@/lib/db';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import AddMediaForm from '@/components/AddMediaForm';
import AddProfilePicture from '@/components/AddProfilePicture';

async function getAgent(id: string) {
  try {
    // Get agent
    const agentResult = await sql`
      SELECT * FROM ir_agents WHERE id = ${parseInt(id)}
    `;

    if (agentResult.rows.length === 0) {
      return null;
    }

    const agent = agentResult.rows[0];

    // Get media for this agent
    const mediaResult = await sql`
      SELECT * FROM media WHERE ir_agent_id = ${parseInt(id)}
    `;

    // Get external links for this agent
    const linksResult = await sql`
      SELECT * FROM external_links WHERE ir_agent_id = ${parseInt(id)} ORDER BY created_at
    `;

    return {
      _id: agent.id.toString(),
      firstName: agent.first_name,
      lastName: agent.last_name,
      firstNameEn: agent.first_name_en,
      lastNameEn: agent.last_name_en,
      fullName: agent.full_name,
      fullNameEn: agent.full_name_en,
      agentType: agent.agent_type,
      city: agent.city,
      country: agent.country,
      address: agent.address,
      residenceAddress: agent.residence_address,
      latitude: agent.latitude,
      longitude: agent.longitude,
      affiliation: agent.affiliation,
      role: agent.role,
      twitterHandle: agent.twitter_handle,
      instagramHandle: agent.instagram_handle,
      hashtags: agent.hashtags,
      additionalInfo: agent.additional_info,
      submitterTwitterId: agent.submitter_twitter_id,
      externalLinks: linksResult.rows.map((link: any) => ({
        id: link.id,
        url: link.url,
        createdAt: link.created_at.toISOString(),
      })),
      verified: agent.verified,
      verificationLevel: agent.verification_level || 'unverified',
      evidenceCount: agent.evidence_count || 0,
      submittedAt: agent.submitted_at.toISOString(),
      updatedAt: agent.updated_at.toISOString(),
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
    console.error('Error fetching agent:', error);
    return null;
  }
}

const agentTypeLabels: Record<string, string> = {
  internal: 'داخلی',
  external: 'خارجی',
};

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string; slug?: string[] }>;
}) {
  const resolvedParams = await params;
  // ID is used for lookup, slug is optional and ignored (for SEO only)
  const agent = await getAgent(resolvedParams.id);

  if (!agent) {
    notFound();
  }

  const primaryImage = agent.media.find((m) => m.isPrimary)?.publicUrl || agent.media.find((m) => m.type === 'image')?.publicUrl;

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
          {/* Agent Info */}
          <div className="p-8">
            {/* Names with Profile Picture */}
            <div className="flex items-start gap-6 mb-6">
              {/* Left side: Profile Picture */}
              <div className="flex-shrink-0">
                {primaryImage ? (
                  <div>
                    <img
                      src={primaryImage}
                      alt={agent.fullName || `${agent.firstName} ${agent.lastName}`}
                      className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <AddProfilePicture agentId={agent._id} hasExistingPhoto={true} />
                  </div>
                ) : (
                  <div>
                    <div className="w-48 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                      <span className="text-gray-400 text-5xl mb-2">👤</span>
                      <p className="text-sm text-gray-500 text-center px-2" dir="rtl">
                        بدون تصویر
                      </p>
                    </div>
                    <AddProfilePicture agentId={agent._id} hasExistingPhoto={false} />
                  </div>
                )}
              </div>

              {/* Right side: Names */}
              <div className="flex-1 flex justify-between items-baseline">
                <h1 className="text-4xl font-bold text-navy-dark" dir="rtl">
                  {agent.fullName || `${agent.firstName} ${agent.lastName}`}
                </h1>
                {(agent.fullNameEn || agent.firstNameEn || agent.lastNameEn) && (
                  <p className="text-2xl text-gray-600" dir="ltr">
                    {agent.fullNameEn || `${agent.firstNameEn} ${agent.lastNameEn}`}
                  </p>
                )}
              </div>
            </div>

            {/* Agent Type */}
            <div className="mb-4">
              <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                {agentTypeLabels[agent.agentType] || agent.agentType}
              </span>
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6" dir="rtl">
              {agent.city && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">شهر</h3>
                  <p className="text-lg text-navy-dark">{agent.city}</p>
                </div>
              )}

              {agent.country && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">کشور</h3>
                  <p className="text-lg text-navy-dark">{agent.country}</p>
                </div>
              )}

              {agent.affiliation && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">وابستگی</h3>
                  <p className="text-lg text-navy-dark">{agent.affiliation}</p>
                </div>
              )}

              {agent.role && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">نقش</h3>
                  <p className="text-lg text-navy-dark">{agent.role}</p>
                </div>
              )}
            </div>

            {/* Address */}
            {agent.address && (
              <div className="mb-6" dir="rtl">
                <h3 className="text-sm font-semibold text-gray-500 mb-1">آدرس</h3>
                <p className="text-lg text-navy-dark">{agent.address}</p>
              </div>
            )}

            {/* Residence Address */}
            {agent.residenceAddress && (
              <div className="mb-6" dir="rtl">
                <h3 className="text-sm font-semibold text-gray-500 mb-1">آدرس محل سکونت</h3>
                <p className="text-lg text-navy-dark">{agent.residenceAddress}</p>
              </div>
            )}

            {/* Social Media */}
            {(agent.twitterHandle || agent.instagramHandle) && (
              <div className="mb-6" dir="rtl">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">شبکه‌های اجتماعی</h3>
                <div className="space-y-2">
                  {agent.twitterHandle && (
                    <p className="text-lg text-navy-dark">
                      <span className="text-gray-500">توییتر:</span> {agent.twitterHandle}
                    </p>
                  )}
                  {agent.instagramHandle && (
                    <p className="text-lg text-navy-dark">
                      <span className="text-gray-500">اینستاگرام:</span>{' '}
                      <a
                        href={agent.instagramHandle.startsWith('http') ? agent.instagramHandle : `https://instagram.com/${agent.instagramHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:text-gold-light"
                      >
                        {agent.instagramHandle}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Additional Info */}
            {agent.additionalInfo && (
              <div className="mb-6" dir="rtl">
                <h3 className="text-sm font-semibold text-gray-500 mb-1">اطلاعات تکمیلی</h3>
                <p className="text-lg text-navy-dark whitespace-pre-wrap">{agent.additionalInfo}</p>
              </div>
            )}

            {/* Hashtags */}
            {agent.hashtags && (
              <div className="mb-6" dir="rtl">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">هشتگ‌ها</h3>
                <p className="text-lg text-navy-dark">{agent.hashtags}</p>
              </div>
            )}

            {/* External Links */}
            {agent.externalLinks.length > 0 && (
              <div className="mb-6" dir="rtl">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">لینک‌های مرتبط</h3>
                <ul className="space-y-2">
                  {agent.externalLinks.map((link: any) => (
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
                {agent.verificationLevel === 'trusted' && (
                  <span className="text-green-600 flex items-center gap-1">
                    <span>✓✓✓</span> تأیید شده
                  </span>
                )}
                {agent.verificationLevel === 'document' && (
                  <span className="text-green-600 flex items-center gap-1">
                    <span>✓✓</span> تأیید شده
                  </span>
                )}
                {agent.verificationLevel === 'community' && (
                  <span className="text-blue-600 flex items-center gap-1">
                    <span>✓</span> تأیید شده
                  </span>
                )}
                {agent.verificationLevel === 'unverified' && (
                  <span className="text-yellow-600 flex items-center gap-1">
                    <span>⚠</span> تأیید نشده
                  </span>
                )}
              </div>

              {/* Submitter Info */}
              <div className="flex items-center gap-4" dir="rtl">
                <span className="text-sm text-gray-500">ارسال شده توسط:</span>
                {agent.submitterTwitterId ? (
                  <a
                    href={`https://twitter.com/${agent.submitterTwitterId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:text-gold-light"
                  >
                    @{agent.submitterTwitterId}
                  </a>
                ) : (
                  <span className="text-gray-600">ناشناس</span>
                )}
              </div>
            </div>

            {/* Supporting Media */}
            {agent.media.length > 1 && (
              <div className="border-t pt-6 mt-6">
                <h3 className="text-xl font-bold text-navy-dark mb-4" dir="rtl">
                  مدارک و تصاویر ({agent.media.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {agent.media.map((media: any, idx: number) => (
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
            <AddMediaForm agentId={agent._id} />
          </div>
        </div>
      </main>
    </div>
  );
}
