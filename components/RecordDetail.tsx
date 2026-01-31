'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import AddEvidenceSection from '@/components/AddEvidenceSection';
import Header from '@/components/Header';
import UpdateFieldButton from '@/components/UpdateFieldButton';
import UpdateProfilePictureButton from '@/components/UpdateProfilePictureButton';
import DeleteRecordButton from '@/components/DeleteRecordButton';
import ProfileMediaDisplay from '@/components/ProfileMediaDisplay';

interface RecordDetailProps {
  record: any;
  id: string;
}

export default function RecordDetail({ record, id }: RecordDetailProps) {
  const { t, language } = useLanguage();

  const verificationBadge = () => {
    switch (record.verificationLevel) {
      case 'trusted':
        return (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <span className="text-base">✓✓✓</span>
            {t('record.verified.trusted')}
          </span>
        );
      case 'document':
        return (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <span className="text-base">✓✓</span>
            {t('record.verified.document')}
          </span>
        );
      case 'community':
        return (
          <span className="text-sm text-blue-600 flex items-center gap-1">
            <span className="text-base">✓</span>
            {t('record.verified.community')}
          </span>
        );
      default:
        return (
          <span className="text-sm text-yellow-600 flex items-center gap-1">
            <span className="text-base">⚠</span>
            {t('record.verified.unverified')}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white" dir={language === 'fa' ? 'rtl' : 'ltr'}>
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Back Link */}
        <Link
          href="/search"
          className="inline-flex items-center text-gray-600 hover:text-gold mb-8 transition-colors"
        >
          {language === 'fa' ? '→' : '←'} {t('record.backToSearch')}
        </Link>

        {/* Centered Profile Section */}
        <div className="flex flex-col items-center mb-12">
          {/* Victim Picture/Video - Large and Centered */}
          <ProfileMediaDisplay
            victimPicture={record.victimPicture}
            fullName={record.fullName}
            firstName={record.firstName}
            lastName={record.lastName}
            supportingMedia={record.media}
          />

          {!record.victimPicture && (
            <div className="absolute inset-0 flex items-center justify-center">
              <UpdateProfilePictureButton
                recordType="victim"
                recordId={id}
                hasPicture={!!record.victimPicture}
              />
            </div>
          )}

          {/* Names - Side by Side */}
          <div className="w-full max-w-3xl mb-4">
            <div className="flex justify-between items-baseline mb-2">
              <div className="flex items-baseline gap-2">
                <h1 className="text-5xl font-bold text-navy-dark" dir="rtl">
                  {record.fullName || 'نام نامشخص'}
                </h1>
                <UpdateFieldButton
                  recordType="victim"
                  recordId={id}
                  fieldName="full_name"
                  fieldLabel="Full Name (Farsi)"
                  currentValue={record.fullName}
                />
              </div>
              {record.fullNameEn && (
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-semibold text-gray-600" dir="ltr">
                    {record.fullNameEn}
                  </h2>
                  <UpdateFieldButton
                    recordType="victim"
                    recordId={id}
                    fieldName="full_name_en"
                    fieldLabel="Full Name (English)"
                    currentValue={record.fullNameEn}
                  />
                </div>
              )}
              {!record.fullNameEn && (
                <UpdateFieldButton
                  recordType="victim"
                  recordId={id}
                  fieldName="full_name_en"
                  fieldLabel="Full Name (English)"
                  currentValue={record.fullNameEn}
                />
              )}
            </div>
          </div>

          {/* Verification Badge */}
          <div className="mb-4">
            {verificationBadge()}
          </div>
        </div>

        {/* Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-navy-dark mb-6">
            {t('record.information')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Victim Status */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <span>{t('victimStatus.title')}</span>
                <UpdateFieldButton
                  recordType="victim"
                  recordId={id}
                  fieldName="victim_status"
                  fieldLabel={t('victimStatus.title')}
                  currentValue={record.victimStatus}
                  options={[
                    { value: 'executed', label: t('victimStatus.executed') },
                    { value: 'killed', label: t('victimStatus.killed') },
                    { value: 'incarcerated', label: t('victimStatus.incarcerated') },
                    { value: 'disappeared', label: t('victimStatus.disappeared') },
                    { value: 'injured', label: t('victimStatus.injured') },
                    { value: 'other', label: t('victimStatus.other') },
                  ]}
                />
              </p>
              {record.victimStatus && (
                <p className="text-lg text-gray-900">
                  {t(`victimStatus.${record.victimStatus}`)}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <span>{t('form.gender')}</span>
                <UpdateFieldButton
                  recordType="victim"
                  recordId={id}
                  fieldName="gender"
                  fieldLabel={t('form.gender')}
                  currentValue={record.gender}
                  options={[
                    { value: 'male', label: t('form.male') },
                    { value: 'female', label: t('form.female') },
                    { value: 'other', label: t('form.other') },
                  ]}
                />
              </p>
              {record.gender && (
                <p className="text-lg text-gray-900">
                  {t(`form.${record.gender}`)}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <span>{t('record.locationOfIncident')}</span>
                <UpdateFieldButton
                  recordType="victim"
                  recordId={id}
                  fieldName="location"
                  fieldLabel={t('record.locationOfIncident')}
                  currentValue={record.location}
                />
              </p>
              <p className="text-lg text-gray-900">
                {record.location}
              </p>
            </div>

            {/* Birth Year */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <span>{t('record.birthYear')}</span>
                <UpdateFieldButton
                  recordType="victim"
                  recordId={id}
                  fieldName="birth_year"
                  fieldLabel={t('record.birthYear')}
                  fieldType="number"
                  currentValue={record.birthYear}
                />
              </p>
              {record.birthYear && (
                <p className="text-lg text-gray-900">
                  {record.birthYear}
                </p>
              )}
            </div>

            {/* Age */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <span>{t('form.age')}</span>
                <UpdateFieldButton
                  recordType="victim"
                  recordId={id}
                  fieldName="age"
                  fieldLabel={t('form.age')}
                  fieldType="number"
                  currentValue={record.age}
                />
              </p>
              {record.age && (
                <p className="text-lg text-gray-900">
                  {record.age}
                </p>
              )}
            </div>

            {/* Incident Date */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <span>{t('form.incidentDate')}</span>
                <UpdateFieldButton
                  recordType="victim"
                  recordId={id}
                  fieldName="incident_date"
                  fieldLabel={t('form.incidentDate')}
                  fieldType="date"
                  currentValue={record.incidentDate}
                />
              </p>
              {record.incidentDate && (
                <p className="text-lg text-gray-900">
                  {new Date(record.incidentDate).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US')}
                </p>
              )}
            </div>

            {/* National ID */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <span>{t('record.nationalId')}</span>
                <UpdateFieldButton
                  recordType="victim"
                  recordId={id}
                  fieldName="national_id"
                  fieldLabel={t('record.nationalId')}
                  currentValue={record.nationalId}
                />
              </p>
              {record.nationalId && (
                <p className="text-lg text-gray-900" dir="ltr">
                  {record.nationalId}
                </p>
              )}
            </div>

            {/* Father's Name */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <span>{t('record.fatherName')}</span>
                <UpdateFieldButton
                  recordType="victim"
                  recordId={id}
                  fieldName="father_name"
                  fieldLabel={t('record.fatherName')}
                  currentValue={record.fatherName}
                />
              </p>
              {record.fatherName && (
                <p className="text-lg text-gray-900">
                  {record.fatherName}
                </p>
              )}
            </div>

            {/* Mother's Name */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <span>{t('record.motherName')}</span>
                <UpdateFieldButton
                  recordType="victim"
                  recordId={id}
                  fieldName="mother_name"
                  fieldLabel={t('record.motherName')}
                  currentValue={record.motherName}
                />
              </p>
              {record.motherName && (
                <p className="text-lg text-gray-900">
                  {record.motherName}
                </p>
              )}
            </div>

            {/* Perpetrator */}
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <span>{t('record.perpetrator')}</span>
                <UpdateFieldButton
                  recordType="victim"
                  recordId={id}
                  fieldName="perpetrator"
                  fieldLabel={t('record.perpetrator')}
                  currentValue={record.perpetrator}
                />
              </p>
              {record.perpetrator && (
                <p className="text-lg text-gray-900">
                  {record.perpetrator}
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <span>{t('record.tags')}</span>
                <UpdateFieldButton
                  recordType="victim"
                  recordId={id}
                  fieldName="hashtags"
                  fieldLabel={t('record.tags')}
                  currentValue={record.hashtags}
                />
              </p>
              {record.hashtags && (
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
              )}
            </div>

            {/* External References */}
            {record.twitterLinks && record.twitterLinks.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {t('record.externalReferences')} ({record.twitterLinks.length})
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
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                <span>{t('record.additionalInfo')}</span>
                <UpdateFieldButton
                  recordType="victim"
                  recordId={id}
                  fieldName="additional_info"
                  fieldLabel={t('record.additionalInfo')}
                  fieldType="textarea"
                  currentValue={record.additionalInfo}
                />
              </p>
              {record.additionalInfo && (
                <p className="text-lg text-gray-900 whitespace-pre-wrap">
                  {record.additionalInfo}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Supporting Documents Gallery */}
        {record.media && record.media.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-navy-dark mb-6">
              {t('record.media')} ({record.media.length})
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
                        alt={`${t('record.media')} ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </a>
                  ) : media.type === 'video' ? (
                    <video
                      src={media.publicUrl}
                      controls
                      preload="metadata"
                      className="w-full aspect-square bg-gray-100 rounded-lg"
                    >
                      {language === 'fa' ? 'متصفح شما از پخش ویدیو پشتیبانی نمی‌کند.' : 'Your browser does not support video playback.'}
                      <a href={media.publicUrl} target="_blank" rel="noopener noreferrer">
                        {language === 'fa' ? 'دانلود ویدیو' : 'Download Video'}
                      </a>
                    </video>
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
          <p>{t('record.submittedOn')} {new Date(record.submittedAt).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US')}</p>
          {record.submitterTwitterId && (
            <p>
              {t('record.submittedBy')}:{' '}
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
          <p>{t('record.recordId')}: {record._id}</p>
        </div>
      </main>

      {/* Delete Button - Only visible in development */}
      <DeleteRecordButton recordId={id} recordType="victim" />
    </div>
  );
}
