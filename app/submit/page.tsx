'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SubmissionType = 'victim' | 'security-force' | 'incident' | 'evidence';

export default function SubmitPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submissionType, setSubmissionType] = useState<SubmissionType>('victim');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    location: '',
    birthYear: '',
    nationalId: '',
    fatherName: '',
    motherName: '',
    hashtags: '',
    additionalInfo: '',
    twitterUrl1: '',
    twitterUrl2: '',
    twitterUrl3: '',
    submitterTwitterId: '',
    victimStatus: 'killed' as 'killed' | 'incarcerated' | 'disappeared' | 'injured',
  });

  const [files, setFiles] = useState<File[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

      // Add files
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
        location: '',
        birthYear: '',
        nationalId: '',
        fatherName: '',
        motherName: '',
        hashtags: '',
        additionalInfo: '',
        twitterUrl1: '',
        twitterUrl2: '',
        twitterUrl3: '',
        submitterTwitterId: '',
        victimStatus: 'killed',
      });
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
            Submit a Record
          </h1>
          <p className="text-lg text-gray-700">
            Help preserve their memory. All submissions start as unverified and can be confirmed by the community.
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
              What are you submitting?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <div className="font-semibold text-navy-dark">Victim</div>
                <div className="text-xs text-gray-600 mt-1">Person who lost their life</div>
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
                <div className="font-semibold text-navy-dark">Security Force</div>
                <div className="text-xs text-gray-600 mt-1">Document perpetrators</div>
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
                <div className="font-semibold text-navy-dark">Incident</div>
                <div className="text-xs text-gray-600 mt-1">Specific event or location</div>
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
                <div className="font-semibold text-navy-dark">Evidence</div>
                <div className="text-xs text-gray-600 mt-1">General documentation</div>
              </button>
            </div>
          </div>

          {/* Submitter Info (Optional) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">
              Your Information (Optional)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              If you'd like to identify yourself as the submitter, you can optionally provide your Twitter/X handle.
            </p>
            <div>
              <label htmlFor="submitterTwitterId" className="block text-sm font-medium text-gray-700 mb-2">
                Your Twitter/X Handle (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">@</span>
                <input
                  type="text"
                  id="submitterTwitterId"
                  name="submitterTwitterId"
                  value={formData.submitterTwitterId}
                  onChange={handleInputChange}
                  placeholder="yourusername"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This will be publicly displayed with your submission
              </p>
            </div>
          </div>

          {/* Victim Status - Only show for Victim submission type */}
          {submissionType === 'victim' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-navy-dark mb-4">
                Victim Status *
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <div className="font-semibold text-navy-dark">Killed</div>
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
                <div className="font-semibold text-navy-dark">Incarcerated</div>
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
                <div className="font-semibold text-navy-dark">Disappeared</div>
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
                <div className="font-semibold text-navy-dark">Injured</div>
              </button>
            </div>
          </div>
          )}

          {/* Required Fields */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">
              Required Information
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
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
                  Last Name *
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

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location of Incident (City/Province) *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Tehran, Isfahan, Shiraz"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">
              Additional Information (Optional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="birthYear" className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Year
                </label>
                <input
                  type="number"
                  id="birthYear"
                  name="birthYear"
                  value={formData.birthYear}
                  onChange={handleInputChange}
                  placeholder="e.g., 1995"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-2">
                  National ID
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
                  Father&apos;s Name
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
                  Mother&apos;s Name
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
                  Tags / Hashtags
                </label>
                <input
                  type="text"
                  id="hashtags"
                  name="hashtags"
                  value={formData.hashtags}
                  onChange={handleInputChange}
                  placeholder="e.g., zan, zendegi, azadi (comma-separated)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  placeholder="Any additional details, evidence description, information about security forces involved, etc."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter / X URLs (up to 3)
                </label>
                <div className="space-y-2">
                  <input
                    type="url"
                    id="twitterUrl1"
                    name="twitterUrl1"
                    value={formData.twitterUrl1}
                    onChange={handleInputChange}
                    placeholder="https://twitter.com/... (Link 1)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                  <input
                    type="url"
                    id="twitterUrl2"
                    name="twitterUrl2"
                    value={formData.twitterUrl2}
                    onChange={handleInputChange}
                    placeholder="https://twitter.com/... (Link 2)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                  <input
                    type="url"
                    id="twitterUrl3"
                    name="twitterUrl3"
                    value={formData.twitterUrl3}
                    onChange={handleInputChange}
                    placeholder="https://twitter.com/... (Link 3)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy-dark mb-4">
              Media & Documents (Optional)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload photos, videos, or supporting documents. Accepted formats: JPG, PNG, MP4, PDF
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
                <div className="font-medium">Click to upload files</div>
                <div className="text-sm">or drag and drop</div>
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
                      Remove
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
              {isSubmitting ? 'Submitting...' : 'Submit Record'}
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
