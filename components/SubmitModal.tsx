'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type SubmissionType = 'victim' | 'security-force' | 'incident' | 'evidence';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubmitModal({ isOpen, onClose }: SubmitModalProps) {
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

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

      // Close modal and refresh after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
        router.refresh();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit record');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gold mb-2">
            Submission Successful
          </h2>
          <p className="text-gray-600 mb-4">
            Thank you for contributing to preserving their memory.
          </p>
          <p className="text-sm text-gray-500">
            Closing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full my-8 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold z-10"
        >
          ×
        </button>

        {/* Modal content */}
        <div className="p-8">
          <h1 className="text-3xl font-bold text-navy-dark mb-2">
            Submit a Record
          </h1>
          <p className="text-gray-700 mb-8">
            Help preserve their memory. All submissions start as unverified.
          </p>

          {error && (
            <div className="mb-6 bg-red-100 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Submission Type Selector */}
            <div>
              <h2 className="text-lg font-semibold text-navy-dark mb-3">
                What are you submitting?
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setSubmissionType('victim')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    submissionType === 'victim'
                      ? 'border-gold bg-gold/10'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">🕯️</div>
                  <div className="font-semibold text-sm text-navy-dark">Victim</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionType('security-force')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    submissionType === 'security-force'
                      ? 'border-gold bg-gold/10'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">⚠️</div>
                  <div className="font-semibold text-sm text-navy-dark">Security Force</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionType('incident')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    submissionType === 'incident'
                      ? 'border-gold bg-gold/10'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">📍</div>
                  <div className="font-semibold text-sm text-navy-dark">Incident</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionType('evidence')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    submissionType === 'evidence'
                      ? 'border-gold bg-gold/10'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">📄</div>
                  <div className="font-semibold text-sm text-navy-dark">Evidence</div>
                </button>
              </div>
            </div>

            {/* Victim Status - Only show for Victim submission type */}
            {submissionType === 'victim' && (
              <div>
                <h2 className="text-lg font-semibold text-navy-dark mb-2">
                  Victim Status *
                </h2>
                <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, victimStatus: 'killed' })}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    formData.victimStatus === 'killed'
                      ? 'border-gold bg-gold/10 shadow-md'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">💔</div>
                  <div className="font-semibold text-sm text-navy-dark">Killed</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, victimStatus: 'incarcerated' })}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    formData.victimStatus === 'incarcerated'
                      ? 'border-gold bg-gold/10 shadow-md'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">⛓️</div>
                  <div className="font-semibold text-sm text-navy-dark">Incarcerated</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, victimStatus: 'disappeared' })}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    formData.victimStatus === 'disappeared'
                      ? 'border-gold bg-gold/10 shadow-md'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">❓</div>
                  <div className="font-semibold text-sm text-navy-dark">Disappeared</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, victimStatus: 'injured' })}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    formData.victimStatus === 'injured'
                      ? 'border-gold bg-gold/10 shadow-md'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">🩹</div>
                  <div className="font-semibold text-sm text-navy-dark">Injured</div>
                </button>
              </div>
            </div>
            )}

            {/* Submitter Info (Optional) */}
            <div>
              <h2 className="text-lg font-semibold text-navy-dark mb-2">
                Your Information (Optional)
              </h2>
              <p className="text-xs text-gray-600 mb-3">
                Optionally identify yourself as the submitter
              </p>
              <div>
                <label htmlFor="submitterTwitterId" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Twitter/X Handle (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">@</span>
                  <input
                    type="text"
                    id="submitterTwitterId"
                    name="submitterTwitterId"
                    value={formData.submitterTwitterId}
                    onChange={handleInputChange}
                    placeholder="yourusername"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This will be publicly displayed with your submission
                </p>
              </div>
            </div>

            {/* Victim Form (show only when victim is selected) */}
            {submissionType === 'victim' && (
              <>
                {/* Required Fields */}
                <div>
                  <h2 className="text-lg font-semibold text-navy-dark mb-3">
                    Required Information *
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                        Location (City/Province) *
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        required
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., Tehran, Isfahan"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Fields */}
                <div>
                  <h2 className="text-lg font-semibold text-navy-dark mb-3">
                    Additional Information (Optional)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="birthYear" className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-1">
                        National ID
                      </label>
                      <input
                        type="text"
                        id="nationalId"
                        name="nationalId"
                        value={formData.nationalId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700 mb-1">
                        Father's Name
                      </label>
                      <input
                        type="text"
                        id="fatherName"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="motherName" className="block text-sm font-medium text-gray-700 mb-1">
                        Mother's Name
                      </label>
                      <input
                        type="text"
                        id="motherName"
                        name="motherName"
                        value={formData.motherName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 mt-4">
                    <div>
                      <label htmlFor="hashtags" className="block text-sm font-medium text-gray-700 mb-1">
                        Tags / Hashtags
                      </label>
                      <input
                        type="text"
                        id="hashtags"
                        name="hashtags"
                        value={formData.hashtags}
                        onChange={handleInputChange}
                        placeholder="e.g., zan, zendegi, azadi"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Information
                      </label>
                      <textarea
                        id="additionalInfo"
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleInputChange}
                        placeholder="Any additional details, evidence description, etc."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent resize-y"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                        />
                        <input
                          type="url"
                          id="twitterUrl2"
                          name="twitterUrl2"
                          value={formData.twitterUrl2}
                          onChange={handleInputChange}
                          placeholder="https://twitter.com/... (Link 2)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                        />
                        <input
                          type="url"
                          id="twitterUrl3"
                          name="twitterUrl3"
                          value={formData.twitterUrl3}
                          onChange={handleInputChange}
                          placeholder="https://twitter.com/... (Link 3)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Media Upload */}
                <div>
                  <h2 className="text-lg font-semibold text-navy-dark mb-3">
                    Media & Documents (Optional)
                  </h2>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                      <div className="text-3xl mb-2">📎</div>
                      <div className="font-medium">Click to upload files</div>
                      <div className="text-sm">JPG, PNG, MP4, PDF</div>
                    </label>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-2"
                        >
                          <span className="text-sm text-gray-700 truncate flex-1">
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700 ml-2 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Other submission types - placeholder */}
            {submissionType !== 'victim' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-600">
                  {submissionType === 'security-force' && 'Security Force documentation form coming soon...'}
                  {submissionType === 'incident' && 'Incident reporting form coming soon...'}
                  {submissionType === 'evidence' && 'General evidence submission form coming soon...'}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4 border-t">
              <button
                type="submit"
                disabled={isSubmitting || submissionType !== 'victim'}
                className="flex-1 bg-gold hover:bg-gold-light text-navy-dark px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Record'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="border-2 border-gold hover:bg-gold/10 px-6 py-3 rounded-lg font-semibold transition-colors text-navy-dark"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
