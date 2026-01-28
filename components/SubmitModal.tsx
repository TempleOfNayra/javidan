'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import TwitterExtractor from '@/components/TwitterExtractor';

type SubmissionType = 'victim' | 'security-force' | 'ir-agent' | 'video' | 'evidence';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubmitModal({ isOpen, onClose }: SubmitModalProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submissionType, setSubmissionType] = useState<SubmissionType>('victim');

  const [formData, setFormData] = useState({
    fullName: '',
    fullNameEn: '',
    location: '',
    city: '',
    birthYear: '',
    age: '',
    incidentDate: '',
    nationalId: '',
    fatherName: '',
    motherName: '',
    gender: '' as '' | 'male' | 'female',
    address: '',
    residenceAddress: '',
    latitude: '',
    longitude: '',
    organization: '',
    rankPosition: '',
    twitterHandle: '',
    instagramHandle: '',
    hashtags: '',
    additionalInfo: '',
    twitterUrl1: '',
    twitterUrl2: '',
    twitterUrl3: '',
    submitterTwitterId: '',
    victimStatus: '' as '' | 'executed' | 'killed' | 'incarcerated' | 'disappeared' | 'injured' | 'other',
    perpetrator: '',
    agentType: '' as '' | 'internal' | 'foreign',
    country: '',
    affiliation: '',
    role: '',
    title: '',
  });

  const [victimPicture, setVictimPicture] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [twitterExtractUrl, setTwitterExtractUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractMessage, setExtractMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [extractedMedia, setExtractedMedia] = useState<{ url: string; type: 'image' | 'video'; isProfile: boolean; poster?: string }[]>([]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scroll when modal is open and reset all states on close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      // Reset all states when modal closes
      setExtractedMedia([]);
      setExtractMessage(null);
      setTwitterExtractUrl('');
      setVictimPicture(null);
      setFiles([]);
      setError('');
      setSuccess(false);
      setIsSubmitting(false);
      setUploadProgress({});
      // Reset form data
      setFormData({
        fullName: '',
        fullNameEn: '',
        location: '',
        city: '',
        birthYear: '',
        age: '',
        incidentDate: '',
        nationalId: '',
        fatherName: '',
        motherName: '',
        gender: '',
        address: '',
        residenceAddress: '',
        latitude: '',
        longitude: '',
        organization: '',
        rankPosition: '',
        twitterHandle: '',
        instagramHandle: '',
        hashtags: '',
        additionalInfo: '',
        twitterUrl1: '',
        twitterUrl2: '',
        twitterUrl3: '',
        submitterTwitterId: '',
        victimStatus: '',
        perpetrator: '',
        agentType: '',
        country: '',
        affiliation: '',
        role: '',
        title: '',
      });
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

  const handleExtractFromTwitter = async () => {
    if (!twitterExtractUrl.trim()) {
      setExtractMessage({ type: 'error', text: 'لطفاً لینک توییتر را وارد کنید' });
      return;
    }

    setIsExtracting(true);
    setExtractMessage(null);

    try {
      const response = await fetch('/api/extract-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: twitterExtractUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to extract tweet');
      }

      const { data } = result;

      let mediaCount = 0;
      const mediaPreviews: { url: string; type: 'image' | 'video'; isProfile: boolean; poster?: string }[] = [];

      // Download and set images (using server-side proxy to avoid CORS)
      if (data.images && data.images.length > 0) {
        const downloadedFiles: File[] = [];

        for (let i = 0; i < data.images.length; i++) {
          const imageUrl = data.images[i];

          try {
            // Use server-side download to avoid CORS issues
            const downloadResponse = await fetch('/api/download-media', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: imageUrl, type: 'image' }),
            });

            if (!downloadResponse.ok) {
              throw new Error(`Failed to download image: ${downloadResponse.status}`);
            }

            const { data: base64Data, size, type } = await downloadResponse.json();

            // Convert base64 back to blob
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
              bytes[j] = binaryString.charCodeAt(j);
            }
            const blob = new Blob([bytes], { type });
            const file = new File([blob], `tweet-image-${i + 1}.jpg`, { type: 'image/jpeg' });

            console.log(`Downloaded image ${i + 1}: ${size} bytes`);

            if (i === 0 && !victimPicture) {
              // First image is profile picture (if not already set)
              setVictimPicture(file);
              mediaPreviews.push({ url: imageUrl, type: 'image', isProfile: data.isProfile || false });
            } else {
              // Rest are supporting documents
              downloadedFiles.push(file);
              mediaPreviews.push({ url: imageUrl, type: 'image', isProfile: false });
            }
            mediaCount++;
          } catch (err) {
            console.error('Failed to download image:', imageUrl, err);
            // Continue with other images even if one fails
          }
        }

        if (downloadedFiles.length > 0) {
          setFiles((prev) => [...prev, ...downloadedFiles]);
        }
      }

      // Download and set videos
      if (data.videos && data.videos.length > 0) {
        const downloadedFiles: File[] = [];

        for (let i = 0; i < data.videos.length; i++) {
          const video = data.videos[i];
          const videoUrl = typeof video === 'string' ? video : video.url;
          let posterUrl = typeof video === 'object' ? video.poster : undefined;

          try {
            // Download the video poster as profile picture if no images exist
            if (posterUrl && i === 0 && data.images?.length === 0 && !victimPicture) {
              try {
                const posterResponse = await fetch('/api/download-media', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: posterUrl, type: 'image' }),
                });

                if (posterResponse.ok) {
                  const { data: posterBase64, size: posterSize } = await posterResponse.json();
                  const binaryString = atob(posterBase64);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let j = 0; j < binaryString.length; j++) {
                    bytes[j] = binaryString.charCodeAt(j);
                  }
                  const posterBlob = new Blob([bytes], { type: 'image/jpeg' });
                  const posterFile = new File([posterBlob], `video-poster-${i + 1}.jpg`, { type: 'image/jpeg' });

                  console.log(`Downloaded video poster as profile picture: ${posterSize} bytes`);
                  setVictimPicture(posterFile);
                  mediaCount++;
                }
              } catch (posterErr) {
                console.error('Failed to download video poster:', posterErr);
              }
            }

            // Download the actual video file
            const downloadResponse = await fetch('/api/download-media', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: videoUrl, type: 'video' }),
            });

            if (!downloadResponse.ok) {
              throw new Error(`Failed to download video: ${downloadResponse.status}`);
            }

            const { data: base64Data, size, type } = await downloadResponse.json();

            // Validate size
            if (size === 0) {
              throw new Error('Downloaded video is empty (0 bytes)');
            }

            console.log(`Downloaded video ${i + 1}: ${size} bytes`);

            // Convert base64 back to blob
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
              bytes[j] = binaryString.charCodeAt(j);
            }
            const blob = new Blob([bytes], { type });
            const file = new File([blob], `tweet-video-${i + 1}.mp4`, { type: 'video/mp4' });
            downloadedFiles.push(file);

            // If no poster, use video URL
            if (!posterUrl) {
              posterUrl = videoUrl;
            }

            mediaPreviews.push({
              url: videoUrl,
              type: 'video',
              isProfile: i === 0 && data.images?.length === 0 && data.isProfile || false,
              poster: posterUrl
            });
            mediaCount++;
          } catch (err) {
            console.error('Failed to download video:', videoUrl, err);
            // Continue with other videos even if one fails
          }
        }

        if (downloadedFiles.length > 0) {
          setFiles((prev) => [...prev, ...downloadedFiles]);
        }
      }

      // Store media previews
      setExtractedMedia(mediaPreviews);

      // Set tweet text as additional info (prepend to existing text if any)
      if (data.text) {
        setFormData((prev) => ({
          ...prev,
          additionalInfo: prev.additionalInfo
            ? `${data.text}\n\n${prev.additionalInfo}`
            : data.text,
        }));
      }

      // Set hashtags (prepend to existing hashtags if any)
      if (data.hashtags && data.hashtags.length > 0) {
        const newHashtags = data.hashtags.map((tag: string) => `#${tag}`).join(' ');
        setFormData((prev) => ({
          ...prev,
          hashtags: prev.hashtags
            ? `${newHashtags} ${prev.hashtags}`
            : newHashtags,
        }));
      }

      // If this is a profile extraction, populate the fullNameEn from authorName
      // (Twitter names are typically in English)
      if (data.isProfile && data.authorName) {
        setFormData((prev) => ({
          ...prev,
          fullNameEn: data.authorName,
        }));
      }

      // Set Twitter URL as first external link
      setFormData((prev) => ({
        ...prev,
        twitterUrl1: twitterExtractUrl,
      }));

      const isProfile = data.isProfile;
      const textExtracted = data.text ? (isProfile ? 'بیو' : 'متن توییت') : '';
      const mediaText = mediaCount > 0 ? `${mediaCount} فایل` : '';
      const hashtagText = data.hashtags?.length > 0 ? `${data.hashtags.length} هشتگ` : '';
      const nameText = isProfile && data.authorName ? 'نام' : '';
      const parts = [nameText, mediaText, textExtracted, hashtagText].filter(Boolean).join(' و ');

      setExtractMessage({
        type: 'success',
        text: `✅ استخراج ${isProfile ? 'پروفایل' : 'توییت'} موفق! ${parts || 'اطلاعات'} دریافت شد.`,
      });

      // Scroll to victim info section after a short delay
      setTimeout(() => {
        const victimInfoSection = document.getElementById('victim-info-section');
        if (victimInfoSection) {
          victimInfoSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 800);

      // Clear the extract URL
      setTwitterExtractUrl('');

    } catch (error) {
      console.error('Extract error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در استخراج اطلاعات';
      setExtractMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsExtracting(false);
    }
  };

  const uploadFileToR2 = async (file: File): Promise<{ r2Key: string; publicUrl: string; fileName: string; fileSize: number; type: string }> => {
    // Get presigned URL
    const urlResponse = await fetch('/api/get-presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
      }),
    });

    if (!urlResponse.ok) {
      throw new Error(`Failed to get upload URL for ${file.name}`);
    }

    const { presignedUrl, publicUrl, r2Key } = await urlResponse.json();

    // Upload file directly to R2
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }

    // Determine media type
    let mediaType: 'image' | 'video' | 'document' = 'document';
    if (file.type.startsWith('image/')) {
      mediaType = 'image';
    } else if (file.type.startsWith('video/')) {
      mediaType = 'video';
    }

    return {
      r2Key,
      publicUrl,
      fileName: file.name,
      fileSize: file.size,
      type: mediaType,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation for required fields
    const missingFields: string[] = [];

    // Check if at least one full name exists (Farsi OR English)
    const hasFarsiName = formData.fullName?.trim();
    const hasEnglishName = formData.fullNameEn?.trim();

    if (!hasFarsiName && !hasEnglishName) {
      missingFields.push('نام کامل (فارسی یا انگلیسی) - Full Name (Farsi or English)');
    }

    // Type-specific validation
    if (submissionType === 'victim') {
      if (!formData.location?.trim()) {
        missingFields.push('محل رویداد (Location)');
      }
      if (!formData.victimStatus) {
        missingFields.push('وضعیت قربانی (Victim Status)');
      }
      if (!formData.gender) {
        missingFields.push('جنسیت (Gender)');
      }
    } else if (submissionType === 'security-force') {
      if (!formData.city?.trim()) {
        missingFields.push('شهر (City)');
      }
    } else if (submissionType === 'ir-agent') {
      if (formData.agentType === 'internal' && !formData.city?.trim()) {
        missingFields.push('شهر (City)');
      }
      if (formData.agentType === 'foreign' && !formData.country?.trim()) {
        missingFields.push('کشور (Country)');
      }
    } else if (submissionType === 'video') {
      if (!formData.title?.trim()) {
        missingFields.push('عنوان (Title)');
      }
    } else if (submissionType === 'evidence') {
      if (!formData.title?.trim()) {
        missingFields.push('عنوان (Title)');
      }
    }

    if (missingFields.length > 0) {
      const errorMsg = `لطفاً فیلدهای الزامی را تکمیل کنید:\n${missingFields.join('\n• ')}`;
      setError(errorMsg);

      // Scroll to the first missing required field
      setTimeout(() => {
        if (!formData.victimStatus) {
          document.getElementById('victim-status-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (!hasFarsiName && !hasEnglishName || !formData.location || !formData.gender) {
          document.getElementById('victim-info-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      return;
    }

    setIsSubmitting(true);
    setUploadProgress({});

    try {
      const submitData = new FormData();

      // Determine API endpoint based on submission type
      const apiEndpoint =
        submissionType === 'security-force' ? '/api/submit-security-force' :
        submissionType === 'ir-agent' ? '/api/submit-ir-agent' :
        submissionType === 'video' ? '/api/submit-video' :
        submissionType === 'evidence' ? '/api/submit-evidence' :
        '/api/submit';

      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          submitData.append(key, value);
        }
      });

      // Debug: Log what's being sent
      console.log('Form data being submitted:', Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v)
      ));

      // Upload profile picture directly to R2 if present
      if (victimPicture) {
        setUploadProgress({ profilePicture: 0 });
        const pictureMetadata = await uploadFileToR2(victimPicture);
        setUploadProgress({ profilePicture: 100 });
        submitData.append('uploadedProfilePicture', JSON.stringify(pictureMetadata));
      }

      // Upload supporting files directly to R2
      if (files.length > 0) {
        const uploadedFiles = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
          const fileMetadata = await uploadFileToR2(file);
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
          uploadedFiles.push(fileMetadata);
        }
        submitData.append('uploadedFiles', JSON.stringify(uploadedFiles));
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit record');
      }

      setSuccess(true);
      setUploadProgress({});

      // Reset form
      setFormData({
        fullName: '',
        fullNameEn: '',
        location: '',
        city: '',
        birthYear: '',
        age: '',
        incidentDate: '',
        nationalId: '',
        fatherName: '',
        motherName: '',
        gender: '',
        address: '',
        residenceAddress: '',
        latitude: '',
        longitude: '',
        organization: '',
        rankPosition: '',
        twitterHandle: '',
        instagramHandle: '',
        hashtags: '',
        additionalInfo: '',
        twitterUrl1: '',
        twitterUrl2: '',
        twitterUrl3: '',
        submitterTwitterId: '',
        victimStatus: '',
        perpetrator: '',
        agentType: '',
        country: '',
        affiliation: '',
        role: '',
        title: '',
      });
      setVictimPicture(null);
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
            {t('form.successTitle')}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('form.successMessage')}
          </p>
          <p className="text-sm text-gray-500">
            {t('form.successRedirect')}
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
            {t('form.pageTitle')}
          </h1>
          <p className="text-gray-700 mb-8">
            {t('form.pageDescription')}
          </p>

          {error && (
            <div className="mb-6 bg-red-100 border border-red-200 rounded-lg p-4 text-red-700" dir="rtl">
              <div className="whitespace-pre-line">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Submission Type Selector */}
            <div>
              <h2 className="text-lg font-semibold text-navy-dark mb-3">
                {t('submissionType.title')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3" dir="ltr">
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
                  <div className="font-semibold text-sm text-navy-dark">{t('submissionType.victim')}</div>
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
                  <div className="font-semibold text-sm text-navy-dark">{t('submissionType.securityForce')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionType('ir-agent')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    submissionType === 'ir-agent'
                      ? 'border-gold bg-gold/10'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">🥷</div>
                  <div className="font-semibold text-sm text-navy-dark">{t('submissionType.irAgent')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionType('video')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    submissionType === 'video'
                      ? 'border-gold bg-gold/10'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">🎥</div>
                  <div className="font-semibold text-sm text-navy-dark">{t('submissionType.video')}</div>
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
                  <div className="font-semibold text-sm text-navy-dark">{t('submissionType.evidence')}</div>
                </button>
              </div>
            </div>

            {/* Twitter Extractor - Available for all submission types */}
            <TwitterExtractor
              onExtract={async (data) => {
                // Download and set profile picture (first image/video)
                if (data.images.length > 0) {
                  const response = await fetch('/api/download-media', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: data.images[0], type: 'image' }),
                  });
                  const { data: base64Data } = await response.json();
                  const binaryString = atob(base64Data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let j = 0; j < binaryString.length; j++) {
                    bytes[j] = binaryString.charCodeAt(j);
                  }
                  const blob = new Blob([bytes], { type: 'image/jpeg' });
                  const file = new File([blob], 'twitter-image-1.jpg', { type: 'image/jpeg' });
                  setVictimPicture(file);
                }

                // Download supporting documents (remaining images)
                for (let i = 1; i < data.images.length; i++) {
                  const response = await fetch('/api/download-media', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: data.images[i], type: 'image' }),
                  });
                  const { data: base64Data } = await response.json();
                  const binaryString = atob(base64Data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let j = 0; j < binaryString.length; j++) {
                    bytes[j] = binaryString.charCodeAt(j);
                  }
                  const blob = new Blob([bytes], { type: 'image/jpeg' });
                  const file = new File([blob], `twitter-image-${i + 1}.jpg`, { type: 'image/jpeg' });
                  setFiles(prev => [...prev, file]);
                }

                // Download videos
                for (let i = 0; i < data.videos.length; i++) {
                  const video = data.videos[i];
                  const response = await fetch('/api/download-media', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: video.url, type: 'video' }),
                  });
                  const { data: base64Data } = await response.json();
                  const binaryString = atob(base64Data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let j = 0; j < binaryString.length; j++) {
                    bytes[j] = binaryString.charCodeAt(j);
                  }
                  const blob = new Blob([bytes], { type: 'video/mp4' });
                  const file = new File([blob], `twitter-video-${i + 1}.mp4`, { type: 'video/mp4' });

                  // First video becomes profile if no images
                  if (i === 0 && data.images.length === 0 && !victimPicture) {
                    setVictimPicture(file);
                  } else {
                    setFiles(prev => [...prev, file]);
                  }

                  // Download poster as profile if first video and no images
                  if (video.poster && i === 0 && data.images.length === 0 && !victimPicture) {
                    const posterResponse = await fetch('/api/download-media', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ url: video.poster, type: 'image' }),
                    });
                    const { data: posterBase64 } = await posterResponse.json();
                    const posterBinary = atob(posterBase64);
                    const posterBytes = new Uint8Array(posterBinary.length);
                    for (let k = 0; k < posterBinary.length; k++) {
                      posterBytes[k] = posterBinary.charCodeAt(k);
                    }
                    const posterBlob = new Blob([posterBytes], { type: 'image/jpeg' });
                    const posterFile = new File([posterBlob], `video-poster-${i + 1}.jpg`, { type: 'image/jpeg' });
                    setVictimPicture(posterFile);
                  }
                }

                // Set form data
                setFormData(prev => ({
                  ...prev,
                  additionalInfo: prev.additionalInfo
                    ? `${prev.additionalInfo}\n\n${data.text}`
                    : data.text,
                  hashtags: data.hashtags.length > 0
                    ? prev.hashtags
                      ? `${data.hashtags.join(' ')} ${prev.hashtags}`
                      : data.hashtags.join(' ')
                    : prev.hashtags,
                  twitterUrl1: !prev.twitterUrl1 ? data.url : prev.twitterUrl1,
                }));
              }}
            />

            {/* Victim Form - Only show for Victim submission type */}
            {submissionType === 'victim' && (
              <>
                {/* Submitter Info - At the top with visual emphasis */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">👤</div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-navy-dark mb-2">
                        {t('form.submitterInfo')}
                      </h2>
                      <p className="text-sm text-gray-700 mb-4 font-medium">
                        {t('form.submitterInfoDesc')}
                      </p>
                      <div>
                        <label htmlFor="submitterTwitterId" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('form.twitterHandle')}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">@</span>
                          <input
                            type="text"
                            id="submitterTwitterId"
                            name="submitterTwitterId"
                            value={formData.submitterTwitterId}
                            onChange={handleInputChange}
                            placeholder={t('form.twitterPlaceholder')}
                            dir="ltr"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('form.twitterNote')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Twitter Extract - Quick Info Fill */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">🐦</div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-navy-dark mb-2">
                        استخراج خودکار از توییتر
                      </h2>
                      <p className="text-sm text-gray-700 mb-4 font-medium">
                        لینک توییتر را وارد کنید تا تصاویر و متن به صورت خودکار استخراج شود
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={twitterExtractUrl}
                          onChange={(e) => setTwitterExtractUrl(e.target.value)}
                          placeholder="https://twitter.com/user/status/..."
                          dir="ltr"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent text-left"
                          disabled={isExtracting}
                        />
                        <button
                          type="button"
                          onClick={handleExtractFromTwitter}
                          disabled={isExtracting || !twitterExtractUrl.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >
                          {isExtracting ? '⏳ در حال استخراج...' : '🔍 استخراج'}
                        </button>
                      </div>
                      {extractMessage && (
                        <div
                          className={`mt-3 p-3 rounded-lg text-sm ${
                            extractMessage.type === 'success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                          dir="rtl"
                        >
                          {extractMessage.text}
                        </div>
                      )}

                      {/* Media Previews */}
                      {extractedMedia.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-semibold text-gray-700 mb-2" dir="rtl">
                            محتوای استخراج شده:
                          </h3>
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                            {extractedMedia.map((media, index) => (
                              <div key={index} className="relative group">
                                {media.type === 'image' ? (
                                  <img
                                    src={media.url}
                                    alt={`Extracted ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                                  />
                                ) : (
                                  <div className="relative w-full h-24">
                                    <video
                                      src={media.url}
                                      poster={media.poster}
                                      className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                                      preload="metadata"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center pointer-events-none">
                                      <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                                        <div className="text-gray-800 text-xl ml-1">▶</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {media.isProfile && (
                                  <div className="absolute top-1 right-1 bg-gold text-white text-xs px-2 py-1 rounded-full z-10">
                                    پروفایل
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Victim Information Header */}
                <div id="victim-info-section" className="border-t-4 border-gray-300 pt-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">💔</div>
                    <div>
                      <h2 className="text-xl font-bold text-navy-dark">
                        {t('form.victimInfoHeader')}
                      </h2>
                      <p className="text-sm text-gray-600 font-medium">
                        {t('form.victimInfoDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Victim Status Selection */}
                <div id="victim-status-section">
                  <h2 className="text-lg font-semibold text-navy-dark mb-2">
                    {t('victimStatus.title')} *
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3" dir="ltr">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, victimStatus: 'killed' }))}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    formData.victimStatus === 'killed'
                      ? 'border-gold bg-gold/10 shadow-md'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">💔</div>
                  <div className="font-semibold text-sm text-navy-dark">{t('victimStatus.killed')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, victimStatus: 'executed' }))}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    formData.victimStatus === 'executed'
                      ? 'border-gold bg-gold/10 shadow-md'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">⚖️</div>
                  <div className="font-semibold text-sm text-navy-dark">{t('victimStatus.executed')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, victimStatus: 'disappeared' }))}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    formData.victimStatus === 'disappeared'
                      ? 'border-gold bg-gold/10 shadow-md'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">❓</div>
                  <div className="font-semibold text-sm text-navy-dark">{t('victimStatus.disappeared')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, victimStatus: 'incarcerated' }))}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    formData.victimStatus === 'incarcerated'
                      ? 'border-gold bg-gold/10 shadow-md'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">⛓️</div>
                  <div className="font-semibold text-sm text-navy-dark">{t('victimStatus.incarcerated')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, victimStatus: 'injured' }))}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    formData.victimStatus === 'injured'
                      ? 'border-gold bg-gold/10 shadow-md'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">🩹</div>
                  <div className="font-semibold text-sm text-navy-dark">{t('victimStatus.injured')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, victimStatus: 'other' }))}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    formData.victimStatus === 'other'
                      ? 'border-gold bg-gold/10 shadow-md'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                >
                  <div className="text-2xl mb-1">📋</div>
                  <div className="font-semibold text-sm text-navy-dark">{t('victimStatus.other')}</div>
                </button>
              </div>
            </div>
                {/* Required Fields */}
                <div>
                  <h2 className="text-lg font-semibold text-navy-dark mb-3">
                    {t('form.requiredInfo')}
                  </h2>
                  <div className="space-y-4">
                    {/* Full Name (Farsi) */}
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                        نام کامل (فارسی) *
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                        placeholder="مثال: افسانه رضویان"
                      />
                    </div>

                    {/* Full Name (English) */}
                    <div>
                      <label htmlFor="fullNameEn" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name (English) *
                      </label>
                      <input
                        type="text"
                        id="fullNameEn"
                        name="fullNameEn"
                        value={formData.fullNameEn}
                        onChange={handleInputChange}
                        dir="ltr"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                        placeholder="Example: Afsaneh Razavian"
                      />
                    </div>

                    <p className="text-sm text-gray-500 -mt-2">
                      * حداقل یکی از نام‌های فارسی یا انگلیسی را وارد کنید - At least one name (Farsi or English) is required
                    </p>

                    {/* Gender dropdown */}
                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('form.gender')} *
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      >
                        <option value="">{t('form.gender')}</option>
                        <option value="male">{t('form.male')}</option>
                        <option value="female">{t('form.female')}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Fields */}
                <div>
                  <h2 className="text-lg font-semibold text-navy-dark mb-3">
                    {t('form.additionalInfoTitle')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="birthYear" className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('form.age')}
                      </label>
                      <input
                        type="number"
                        id="age"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        placeholder={t('form.agePlaceholder')}
                        min="0"
                        max="150"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="incidentDate" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('form.incidentDate')}
                      </label>
                      <input
                        type="date"
                        id="incidentDate"
                        name="incidentDate"
                        value={formData.incidentDate}
                        onChange={handleInputChange}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('form.nationalId')}
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
                        {t('form.fatherName')}
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
                        {t('form.motherName')}
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
                        {t('form.hashtags')}
                      </label>
                      <input
                        type="text"
                        id="hashtags"
                        name="hashtags"
                        value={formData.hashtags}
                        onChange={handleInputChange}
                        placeholder={t('form.hashtagsPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('form.additionalInfo')}
                      </label>
                      <textarea
                        id="additionalInfo"
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleInputChange}
                        placeholder={t('form.additionalInfoPlaceholder')}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent resize-y"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                        />
                        <input
                          type="url"
                          id="twitterUrl2"
                          name="twitterUrl2"
                          value={formData.twitterUrl2}
                          onChange={handleInputChange}
                          placeholder={t('form.externalUrlPlaceholder2')}
                          dir="ltr"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                        />
                        <input
                          type="url"
                          id="twitterUrl3"
                          name="twitterUrl3"
                          value={formData.twitterUrl3}
                          onChange={handleInputChange}
                          placeholder={t('form.externalUrlPlaceholder3')}
                          dir="ltr"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="perpetrator" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('form.perpetrator')}
                      </label>
                      <input
                        type="text"
                        id="perpetrator"
                        name="perpetrator"
                        value={formData.perpetrator}
                        onChange={handleInputChange}
                        placeholder={t('form.perpetratorPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Victim Picture Upload */}
                <div>
                  <h2 className="text-lg font-semibold text-navy-dark mb-2">
                    {t('form.victimPicture')}
                  </h2>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('form.victimPictureDesc')}
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                      <div className="text-3xl mb-2">🖼️</div>
                      <div className="font-medium">{t('form.victimPictureButton')}</div>
                      <div className="text-sm">{t('form.victimPictureDragDrop')}</div>
                    </label>
                  </div>

                  {victimPicture && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                        <span className="text-sm text-gray-700 truncate flex-1">
                          {victimPicture.name} ({(victimPicture.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <button
                          type="button"
                          onClick={removeVictimPicture}
                          className="text-red-600 hover:text-red-700 ml-2 text-sm"
                        >
                          {t('form.removeFile')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Supporting Documents Upload */}
                <div>
                  <h2 className="text-lg font-semibold text-navy-dark mb-2">
                    {t('form.media')}
                  </h2>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('form.mediaDesc')}
                  </p>
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
                      <div className="font-medium">{t('form.mediaButton')}</div>
                      <div className="text-sm">{t('form.mediaDragDrop')}</div>
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
                            {t('form.removeFile')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Security Force Form */}
            {submissionType === 'security-force' && (
              <>
                {/* Submitter Info - At the top with visual emphasis */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">👤</div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-navy-dark mb-2">
                        {t('form.submitterInfo')}
                      </h2>
                      <p className="text-sm text-gray-700 mb-4 font-medium">
                        {t('form.submitterInfoDesc')}
                      </p>
                      <div>
                        <label htmlFor="submitterTwitterId_sf" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('form.twitterHandle')}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">@</span>
                          <input
                            type="text"
                            id="submitterTwitterId_sf"
                            name="submitterTwitterId"
                            value={formData.submitterTwitterId}
                            onChange={handleInputChange}
                            placeholder={t('form.twitterPlaceholder')}
                            dir="ltr"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('form.twitterNote')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Force Information Header */}
                <div className="border-t-4 border-gray-300 pt-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">⚠️</div>
                    <div>
                      <h2 className="text-xl font-bold text-navy-dark">
                        {t('securityForce.pageTitle')}
                      </h2>
                      <p className="text-sm text-gray-600 font-medium">
                        {t('securityForce.pageDescription')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Names */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نام کامل (فارسی) *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="مثال: حسن کریم‌زاده"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name (English) *
                  </label>
                  <input
                    type="text"
                    name="fullNameEn"
                    value={formData.fullNameEn}
                    onChange={handleInputChange}
                    dir="ltr"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="Example: Hasan Karimzadeh"
                  />
                </div>

                <p className="text-sm text-gray-500 -mt-2">
                  * حداقل یکی از نام‌های فارسی یا انگلیسی را وارد کنید - At least one name (Farsi or English) is required
                </p>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('securityForce.city')} *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    placeholder={t('securityForce.cityPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>

                {/* Addresses */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('securityForce.address')}
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={t('securityForce.addressPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('securityForce.residenceAddress')}
                  </label>
                  <input
                    type="text"
                    name="residenceAddress"
                    value={formData.residenceAddress}
                    onChange={handleInputChange}
                    placeholder={t('securityForce.residenceAddressPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>

                {/* GPS Coordinates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('securityForce.latitude')}
                    </label>
                    <input
                      type="text"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      placeholder={t('securityForce.latitudePlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('securityForce.longitude')}
                    </label>
                    <input
                      type="text"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      placeholder={t('securityForce.longitudePlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Organization */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('securityForce.organization')}
                    </label>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                      placeholder={t('securityForce.organizationPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('securityForce.rankPosition')}
                    </label>
                    <input
                      type="text"
                      name="rankPosition"
                      value={formData.rankPosition}
                      onChange={handleInputChange}
                      placeholder={t('securityForce.rankPositionPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Social Media Handles */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">{t('securityForce.socialMedia')}</h3>
                  <p className="text-xs text-gray-500 mb-3">{t('securityForce.socialMediaDesc')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('securityForce.twitterHandle')}
                      </label>
                      <input
                        type="text"
                        name="twitterHandle"
                        value={formData.twitterHandle}
                        onChange={handleInputChange}
                        placeholder={t('securityForce.twitterHandlePlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('securityForce.instagramHandle')}
                      </label>
                      <input
                        type="text"
                        name="instagramHandle"
                        value={formData.instagramHandle}
                        onChange={handleInputChange}
                        placeholder={t('securityForce.instagramHandlePlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Picture */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('securityForce.profilePicture')}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleVictimPictureChange}
                    className="hidden"
                    id="profilePicture"
                  />
                  <label
                    htmlFor="profilePicture"
                    className="cursor-pointer inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {victimPicture ? victimPicture.name : t('securityForce.profilePictureButton')}
                  </label>
                  {victimPicture && (
                    <button
                      type="button"
                      onClick={removeVictimPicture}
                      className="ml-2 text-red-600 hover:text-red-700 text-sm"
                    >
                      {t('form.removeFile')}
                    </button>
                  )}
                </div>

                {/* Supporting Documents */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.media')}
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="files-sf"
                  />
                  <label
                    htmlFor="files-sf"
                    className="cursor-pointer inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {t('form.mediaButton')}
                  </label>
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700 truncate flex-1">
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700 ml-2 text-sm"
                          >
                            {t('form.removeFile')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* External Links */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.externalLinks')}
                  </label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      name="twitterUrl1"
                      value={formData.twitterUrl1}
                      onChange={handleInputChange}
                      placeholder={t('form.externalUrlPlaceholder1')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                    <input
                      type="url"
                      name="twitterUrl2"
                      value={formData.twitterUrl2}
                      onChange={handleInputChange}
                      placeholder={t('form.externalUrlPlaceholder2')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                    <input
                      type="url"
                      name="twitterUrl3"
                      value={formData.twitterUrl3}
                      onChange={handleInputChange}
                      placeholder={t('form.externalUrlPlaceholder3')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Hashtags & Additional Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.hashtags')}
                  </label>
                  <input
                    type="text"
                    name="hashtags"
                    value={formData.hashtags}
                    onChange={handleInputChange}
                    placeholder={t('form.hashtagsPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.additionalInfo')}
                  </label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder={t('form.additionalInfoPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* IR Agent Form */}
            {submissionType === 'ir-agent' && (
              <>
                {/* Submitter Info - At the top with visual emphasis */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">👤</div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-navy-dark mb-2">
                        {t('form.submitterInfo')}
                      </h2>
                      <p className="text-sm text-gray-700 mb-4 font-medium">
                        {t('form.submitterInfoDesc')}
                      </p>
                      <div>
                        <label htmlFor="submitterTwitterId_iragent" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('form.twitterHandle')}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">@</span>
                          <input
                            type="text"
                            id="submitterTwitterId_iragent"
                            name="submitterTwitterId"
                            value={formData.submitterTwitterId}
                            onChange={handleInputChange}
                            placeholder={t('form.twitterPlaceholder')}
                            dir="ltr"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('form.twitterNote')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* IR Agent Information Header */}
                <div className="border-t-4 border-gray-300 pt-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">🥷</div>
                    <div>
                      <h2 className="text-xl font-bold text-navy-dark">
                        {t('irAgent.pageTitle')}
                      </h2>
                      <p className="text-sm text-gray-600 font-medium">
                        {t('irAgent.pageDescription')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Agent Type Selection */}
                <div className="border-2 border-gold/30 bg-gold/5 rounded-lg p-4 mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('irAgent.agentType')} *
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="agentType"
                        value="internal"
                        checked={formData.agentType === 'internal'}
                        onChange={handleInputChange}
                        required
                        className="w-4 h-4 text-gold focus:ring-gold border-gray-300"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {t('irAgent.internal')}
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="agentType"
                        value="foreign"
                        checked={formData.agentType === 'foreign'}
                        onChange={handleInputChange}
                        required
                        className="w-4 h-4 text-gold focus:ring-gold border-gray-300"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {t('irAgent.foreign')}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Names */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نام کامل (فارسی) *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="مثال: علی خامنه‌ای"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name (English) *
                  </label>
                  <input
                    type="text"
                    name="fullNameEn"
                    value={formData.fullNameEn}
                    onChange={handleInputChange}
                    dir="ltr"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="Example: Ali Khamenei"
                  />
                </div>

                <p className="text-sm text-gray-500 -mt-2">
                  * حداقل یکی از نام‌های فارسی یا انگلیسی را وارد کنید - At least one name (Farsi or English) is required
                </p>

                {/* Location - Conditional: City for internal, Country for foreign */}
                {formData.agentType === 'internal' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('irAgent.city')} *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      placeholder={t('irAgent.cityPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                )}

                {formData.agentType === 'foreign' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('irAgent.country')} *
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                      placeholder={t('irAgent.countryPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                )}

                {/* Addresses */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('irAgent.address')}
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={t('irAgent.addressPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('irAgent.residenceAddress')}
                  </label>
                  <input
                    type="text"
                    name="residenceAddress"
                    value={formData.residenceAddress}
                    onChange={handleInputChange}
                    placeholder={t('irAgent.residenceAddressPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>

                {/* GPS Coordinates */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">{t('irAgent.coordinates')}</h3>
                  <p className="text-xs text-gray-500 mb-3">{t('irAgent.coordinatesDesc')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('irAgent.latitude')}
                      </label>
                      <input
                        type="text"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        placeholder={t('irAgent.latitudePlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('irAgent.longitude')}
                      </label>
                      <input
                        type="text"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        placeholder={t('irAgent.longitudePlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Affiliation & Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('irAgent.affiliation')}
                    </label>
                    <input
                      type="text"
                      name="affiliation"
                      value={formData.affiliation}
                      onChange={handleInputChange}
                      placeholder={t('irAgent.affiliationPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('irAgent.role')}
                    </label>
                    <input
                      type="text"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      placeholder={t('irAgent.rolePlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Social Media Handles */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">{t('irAgent.socialMedia')}</h3>
                  <p className="text-xs text-gray-500 mb-3">{t('irAgent.socialMediaDesc')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('irAgent.twitterHandle')}
                      </label>
                      <input
                        type="text"
                        name="twitterHandle"
                        value={formData.twitterHandle}
                        onChange={handleInputChange}
                        placeholder={t('irAgent.twitterHandlePlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('irAgent.instagramHandle')}
                      </label>
                      <input
                        type="text"
                        name="instagramHandle"
                        value={formData.instagramHandle}
                        onChange={handleInputChange}
                        placeholder={t('irAgent.instagramHandlePlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Picture */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('irAgent.profilePicture')}
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('irAgent.profilePictureDesc')}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleVictimPictureChange}
                    className="hidden"
                    id="profilePicture_iragent"
                  />
                  <label
                    htmlFor="profilePicture_iragent"
                    className="cursor-pointer inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {victimPicture ? victimPicture.name : t('irAgent.profilePictureButton')}
                  </label>
                  {victimPicture && (
                    <button
                      type="button"
                      onClick={removeVictimPicture}
                      className="ml-2 text-red-600 hover:text-red-700 text-sm"
                    >
                      {t('form.removeFile')}
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-2">{t('irAgent.profilePictureDragDrop')}</p>
                </div>

                {/* Supporting Documents */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.media')}
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="files-iragent"
                  />
                  <label
                    htmlFor="files-iragent"
                    className="cursor-pointer inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {t('form.mediaButton')}
                  </label>
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700 truncate flex-1">
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700 ml-2 text-sm"
                          >
                            {t('form.removeFile')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* External Links */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.externalLinks')}
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('form.externalLinksDesc')}
                  </p>
                  <div className="space-y-2">
                    <input
                      type="url"
                      name="twitterUrl1"
                      value={formData.twitterUrl1}
                      onChange={handleInputChange}
                      placeholder={t('form.externalUrlPlaceholder1')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                    <input
                      type="url"
                      name="twitterUrl2"
                      value={formData.twitterUrl2}
                      onChange={handleInputChange}
                      placeholder={t('form.externalUrlPlaceholder2')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                    <input
                      type="url"
                      name="twitterUrl3"
                      value={formData.twitterUrl3}
                      onChange={handleInputChange}
                      placeholder={t('form.externalUrlPlaceholder3')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Hashtags & Additional Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.hashtags')}
                  </label>
                  <input
                    type="text"
                    name="hashtags"
                    value={formData.hashtags}
                    onChange={handleInputChange}
                    placeholder={t('form.hashtagsPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('form.hashtagsNote')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.additionalInfo')}
                  </label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder={t('form.additionalInfoPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* Video Form */}
            {submissionType === 'video' && (
              <>
                {/* Submitter Info - At the top with visual emphasis */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">👤</div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-navy-dark mb-2">
                        {t('form.submitterInfo')}
                      </h2>
                      <p className="text-sm text-gray-700 mb-4 font-medium">
                        {t('form.submitterInfoDesc')}
                      </p>
                      <div>
                        <label htmlFor="submitterTwitterId_video" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('form.twitterHandle')}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">@</span>
                          <input
                            type="text"
                            id="submitterTwitterId_video"
                            name="submitterTwitterId"
                            value={formData.submitterTwitterId}
                            onChange={handleInputChange}
                            placeholder={t('form.twitterPlaceholder')}
                            dir="ltr"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('form.twitterNote')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Information Header */}
                <div className="border-t-4 border-gray-300 pt-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">🎥</div>
                    <div>
                      <h2 className="text-xl font-bold text-navy-dark">
                        {t('video.pageTitle')}
                      </h2>
                      <p className="text-sm text-gray-600 font-medium">
                        {t('video.pageDescription')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('video.location')} *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    placeholder={t('video.locationPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('video.description')} *
                  </label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    placeholder={t('video.descriptionPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.hashtags')}
                  </label>
                  <input
                    type="text"
                    name="hashtags"
                    value={formData.hashtags}
                    onChange={handleInputChange}
                    placeholder={t('form.hashtagsPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('form.hashtagsNote')}</p>
                </div>

                {/* Videos Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('video.videos')} *
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('video.videosDesc')}
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="videoUpload"
                      multiple
                      accept="video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="videoUpload"
                      className="cursor-pointer text-gray-600 hover:text-navy-dark"
                    >
                      <div className="text-3xl mb-2">🎥</div>
                      <div className="font-medium">{t('video.videosButton')}</div>
                      <div className="text-sm">{t('video.videosDragDrop')}</div>
                    </label>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700 ml-2 text-sm"
                          >
                            {t('form.removeFile')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Evidence/Documents Form */}
            {submissionType === 'evidence' && (
              <>
                {/* Submitter Info - At the top with visual emphasis */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">👤</div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-navy-dark mb-2">
                        {t('form.submitterInfo')}
                      </h2>
                      <p className="text-sm text-gray-700 mb-4 font-medium">
                        {t('form.submitterInfoDesc')}
                      </p>
                      <div>
                        <label htmlFor="submitterTwitterId_evidence" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('form.twitterHandle')}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">@</span>
                          <input
                            type="text"
                            id="submitterTwitterId_evidence"
                            name="submitterTwitterId"
                            value={formData.submitterTwitterId}
                            onChange={handleInputChange}
                            placeholder={t('form.twitterPlaceholder')}
                            dir="ltr"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('form.twitterNote')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence Information Header */}
                <div className="border-t-4 border-gray-300 pt-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">📄</div>
                    <div>
                      <h2 className="text-xl font-bold text-navy-dark">
                        {t('evidence.pageTitle')}
                      </h2>
                      <p className="text-sm text-gray-600 font-medium">
                        {t('evidence.pageDescription')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('evidence.title')} *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder={t('evidence.titlePlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('evidence.description')} *
                  </label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    placeholder={t('evidence.descriptionPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.hashtags')}
                  </label>
                  <input
                    type="text"
                    name="hashtags"
                    value={formData.hashtags}
                    onChange={handleInputChange}
                    placeholder={t('form.hashtagsPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('form.hashtagsNote')}</p>
                </div>

                {/* Documents Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('evidence.documents')} *
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('evidence.documentsDesc')}
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="evidenceUpload"
                      multiple
                      accept="image/*,video/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="evidenceUpload"
                      className="cursor-pointer text-gray-600 hover:text-navy-dark"
                    >
                      <div className="text-3xl mb-2">📄</div>
                      <div className="font-medium">{t('evidence.documentsButton')}</div>
                      <div className="text-sm">{t('evidence.documentsDragDrop')}</div>
                    </label>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700 ml-2 text-sm"
                          >
                            {t('form.removeFile')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4 border-t">
              <button
                type="submit"
                disabled={isSubmitting || (submissionType !== 'victim' && submissionType !== 'security-force' && submissionType !== 'ir-agent' && submissionType !== 'video' && submissionType !== 'evidence')}
                className="flex-1 bg-gold hover:bg-gold-light text-navy-dark px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t('form.submitting') : t('form.submitButton')}
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
