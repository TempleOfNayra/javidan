'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';

type SubmissionType = 'victim' | 'security-force' | 'incident' | 'evidence';

export default function SubmitPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submissionType, setSubmissionType] = useState<SubmissionType>('victim');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    firstNameEn: '',
    lastNameEn: '',
    location: '',
    birthYear: '',
    nationalId: '',
    fatherName: '',
    motherName: '',
    gender: '' as '' | 'male' | 'female',
    hashtags: '',
    additionalInfo: '',
    twitterUrl1: '',
    twitterUrl2: '',
    twitterUrl3: '',
    submitterTwitterId: '',
    victimStatus: '' as '' | 'executed' | 'killed' | 'incarcerated' | 'disappeared' | 'injured',
  });

  const [victimPicture, setVictimPicture] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Special handling for submitterTwitterId to ensure @ prefix
    if (name === 'submitterTwitterId') {
      // Remove any @ symbols first
      const cleanValue = value.replace(/@/g, '');
      setFormData({
        ...formData,
        [name]: cleanValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleVictimPictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVictimPicture(e.target.files[0]);
    }
  };

  const removeVictimPicture = () => {
    setVictimPicture(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const submitData = new FormData();

      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          submitData.append(key, value);
        }
      });

      // Add victim picture as primary
      if (victimPicture) {
        submitData.append('victimPicture', victimPicture);
      }

      // Add supporting files
      files.forEach((file) => {
        submitData.append('files', file);
      });

      const response = await fetch('/api/submit', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit record');
      }

      setSuccess(true);

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        firstNameEn: '',
        lastNameEn: '',
        location: '',
        birthYear: '',
        nationalId: '',
        fatherName: '',
        motherName: '',
        gender: '',
        hashtags: '',
        additionalInfo: '',
        twitterUrl1: '',
        twitterUrl2: '',
        twitterUrl3: '',
        submitterTwitterId: '',
        victimStatus: '',
      });
      setVictimPicture(null);
      setFiles([]);

      // Redirect to search page after 2 seconds
      setTimeout(() => {
        router.push('/search');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit record');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-green-100 border border-green-200 rounded-lg p-8">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-[#d4af37] mb-2">
              Submission Successful
            </h2>
            <p className="text-zinc-600 mb-4">
              Thank you for contributing to preserving their memory.
            </p>
            <p className="text-sm text-zinc-500">
              Redirecting to archive...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
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
                className="text-zinc-900 dark:text-white font-semibold"
              >
                Submit
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-navy-dark mb-4">
            {t('form.pageTitle')}
          </h1>
          <p className="text-lg text-gray-700">
            {t('form.pageDescription')}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Submission Type Selector */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">
              {t('submissionType.title')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" dir="ltr">
              <button
                type="button"
                onClick={() => setSubmissionType('victim')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  submissionType === 'victim'
                    ? 'border-gold bg-gold/10 shadow-md'
                    : 'border-gray-200 hover:border-gold/50'
                }`}
              >
                <div className="text-3xl mb-2">🕯️</div>
                <div className="font-semibold text-navy-dark">{t('submissionType.victim')}</div>
                <div className="text-xs text-gray-600 mt-1">{t('submissionType.victimDesc')}</div>
              </button>

              <button
                type="button"
                onClick={() => setSubmissionType('security-force')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  submissionType === 'security-force'
                    ? 'border-gold bg-gold/10 shadow-md'
                    : 'border-gray-200 hover:border-gold/50'
                }`}
              >
                <div className="text-3xl mb-2">⚠️</div>
                <div className="font-semibold text-navy-dark">{t('submissionType.securityForce')}</div>
                <div className="text-xs text-gray-600 mt-1">{t('submissionType.securityForceDesc')}</div>
              </button>

              <button
                type="button"
                onClick={() => setSubmissionType('incident')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  submissionType === 'incident'
                    ? 'border-gold bg-gold/10 shadow-md'
                    : 'border-gray-200 hover:border-gold/50'
                }`}
              >
                <div className="text-3xl mb-2">📍</div>
                <div className="font-semibold text-navy-dark">{t('submissionType.incident')}</div>
                <div className="text-xs text-gray-600 mt-1">{t('submissionType.incidentDesc')}</div>
              </button>

              <button
                type="button"
                onClick={() => setSubmissionType('evidence')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  submissionType === 'evidence'
                    ? 'border-gold bg-gold/10 shadow-md'
                    : 'border-gray-200 hover:border-gold/50'
                }`}
              >
                <div className="text-3xl mb-2">📄</div>
                <div className="font-semibold text-navy-dark">{t('submissionType.evidence')}</div>
                <div className="text-xs text-gray-600 mt-1">{t('submissionType.evidenceDesc')}</div>
              </button>
            </div>
          </div>

          {/* Submitter Info (Optional) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">
              {t('form.submitterInfo')}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {t('form.submitterInfoDesc')}
            </p>
            <div>
              <label htmlFor="submitterTwitterId" className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.twitterHandle')}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">@</span>
                <input
                  type="text"
                  id="submitterTwitterId"
                  name="submitterTwitterId"
                  value={formData.submitterTwitterId}
                  onChange={handleInputChange}
                  placeholder={t('form.twitterPlaceholder')}
                  dir="ltr"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('form.twitterNote')}
              </p>
            </div>
          </div>

          {/* Victim Status - Only show for Victim submission type */}
          {submissionType === 'victim' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-navy-dark mb-4">
                {t('victimStatus.title')} *
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4" dir="ltr">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, victimStatus: 'executed' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.victimStatus === 'executed'
                    ? 'border-gold bg-gold/10 shadow-md'
                    : 'border-gray-200 hover:border-gold/50'
                }`}
              >
                <div className="text-3xl mb-2">⚖️</div>
                <div className="font-semibold text-navy-dark">{t('victimStatus.executed')}</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, victimStatus: 'killed' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.victimStatus === 'killed'
                    ? 'border-gold bg-gold/10 shadow-md'
                    : 'border-gray-200 hover:border-gold/50'
                }`}
              >
                <div className="text-3xl mb-2">💔</div>
                <div className="font-semibold text-navy-dark">{t('victimStatus.killed')}</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, victimStatus: 'incarcerated' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.victimStatus === 'incarcerated'
                    ? 'border-gold bg-gold/10 shadow-md'
                    : 'border-gray-200 hover:border-gold/50'
                }`}
              >
                <div className="text-3xl mb-2">⛓️</div>
                <div className="font-semibold text-navy-dark">{t('victimStatus.incarcerated')}</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, victimStatus: 'disappeared' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.victimStatus === 'disappeared'
                    ? 'border-gold bg-gold/10 shadow-md'
                    : 'border-gray-200 hover:border-gold/50'
                }`}
              >
                <div className="text-3xl mb-2">❓</div>
                <div className="font-semibold text-navy-dark">{t('victimStatus.disappeared')}</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, victimStatus: 'injured' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.victimStatus === 'injured'
                    ? 'border-gold bg-gold/10 shadow-md'
                    : 'border-gray-200 hover:border-gold/50'
                }`}
              >
                <div className="text-3xl mb-2">🩹</div>
                <div className="font-semibold text-navy-dark">{t('victimStatus.injured')}</div>
              </button>
            </div>
          </div>
          )}


          {/* Required Fields */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">
              {t('form.requiredInfo')}
            </h2>
            <div className="space-y-4">
              {/* First and Last Name - on one line */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.firstName')} *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.lastName')} *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
              </div>

              {/* English Names - on one line */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstNameEn" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.firstNameEn')}
                  </label>
                  <input
                    type="text"
                    id="firstNameEn"
                    name="firstNameEn"
                    value={formData.firstNameEn}
                    onChange={handleInputChange}
                    dir="ltr"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="lastNameEn" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.lastNameEn')}
                  </label>
                  <input
                    type="text"
                    id="lastNameEn"
                    name="lastNameEn"
                    value={formData.lastNameEn}
                    onChange={handleInputChange}
                    dir="ltr"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
              </div>

              {/* Gender dropdown */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.gender')} *
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                >
                  <option value="">{t('form.gender')}</option>
                  <option value="male">{t('form.male')}</option>
                  <option value="female">{t('form.female')}</option>
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.locationLabel')} *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder={t('form.locationPlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">
              {t('form.additionalInfoTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="birthYear" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.birthYear')}
                </label>
                <input
                  type="number"
                  id="birthYear"
                  name="birthYear"
                  value={formData.birthYear}
                  onChange={handleInputChange}
                  placeholder={t('form.birthYearPlaceholder')}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.nationalId')}
                </label>
                <input
                  type="text"
                  id="nationalId"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.fatherName')}
                </label>
                <input
                  type="text"
                  id="fatherName"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="motherName" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.motherName')}
                </label>
                <input
                  type="text"
                  id="motherName"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
            </div>

            {/* New fields */}
            <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label htmlFor="hashtags" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.hashtags')}
                </label>
                <input
                  type="text"
                  id="hashtags"
                  name="hashtags"
                  value={formData.hashtags}
                  onChange={handleInputChange}
                  placeholder={t('form.hashtagsPlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.additionalInfo')}
                </label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  placeholder={t('form.additionalInfoPlaceholder')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.externalLinks')}
                </label>
                <div className="space-y-2">
                  <input
                    type="url"
                    id="twitterUrl1"
                    name="twitterUrl1"
                    value={formData.twitterUrl1}
                    onChange={handleInputChange}
                    placeholder={t('form.externalUrlPlaceholder1')}
                    dir="ltr"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                  <input
                    type="url"
                    id="twitterUrl2"
                    name="twitterUrl2"
                    value={formData.twitterUrl2}
                    onChange={handleInputChange}
                    placeholder={t('form.externalUrlPlaceholder2')}
                    dir="ltr"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                  <input
                    type="url"
                    id="twitterUrl3"
                    name="twitterUrl3"
                    value={formData.twitterUrl3}
                    onChange={handleInputChange}
                    placeholder={t('form.externalUrlPlaceholder3')}
                    dir="ltr"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Victim Picture Upload */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">
              {t('form.victimPicture')}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {t('form.victimPictureDesc')}
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                id="victimPictureUpload"
                accept="image/*"
                onChange={handleVictimPictureChange}
                className="hidden"
              />
              <label
                htmlFor="victimPictureUpload"
                className="cursor-pointer text-gray-600 hover:text-navy-dark"
              >
                <div className="text-4xl mb-2">🖼️</div>
                <div className="font-medium">{t('form.victimPictureButton')}</div>
                <div className="text-sm">{t('form.victimPictureDragDrop')}</div>
              </label>
            </div>

            {victimPicture && (
              <div className="mt-4">
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <span className="text-sm text-gray-700 truncate flex-1">
                    {victimPicture.name} ({(victimPicture.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={removeVictimPicture}
                    className="text-red-600 hover:text-red-700 ml-4"
                  >
                    {t('form.removeFile')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Supporting Documents Upload */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">
              {t('form.media')}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {t('form.mediaDesc')}
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                id="fileUpload"
                multiple
                accept="image/*,video/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="fileUpload"
                className="cursor-pointer text-gray-600 hover:text-navy-dark"
              >
                <div className="text-4xl mb-2">📎</div>
                <div className="font-medium">{t('form.mediaButton')}</div>
                <div className="text-sm">{t('form.mediaDragDrop')}</div>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                  >
                    <span className="text-sm text-gray-700 truncate flex-1">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700 ml-4"
                    >
                      {t('form.removeFile')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gold hover:bg-gold-light text-navy-dark px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('form.submitting') : t('form.submitButton')}
            </button>
            <Link
              href="/"
              className="border-2 border-gold hover:bg-gold/10 px-8 py-3 rounded-lg font-semibold transition-colors text-navy-dark text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
