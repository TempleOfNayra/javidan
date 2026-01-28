'use client';

import { useState, useRef } from 'react';

interface UpdateProfilePictureButtonProps {
  recordType: 'victim' | 'agent' | 'force';
  recordId: string;
  hasPicture: boolean;
}

export default function UpdateProfilePictureButton({
  recordType,
  recordId,
  hasPicture,
}: UpdateProfilePictureButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitterTwitterId, setSubmitterTwitterId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Don't show button if already has a picture
  if (hasPicture) {
    return null;
  }

  const uploadFileToR2 = async (file: File) => {
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
      throw new Error('Failed to get upload URL');
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
      throw new Error('Failed to upload file');
    }

    return {
      r2Key,
      publicUrl,
      fileName: file.name,
      fileSize: file.size,
      type: 'image',
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage({ type: 'error', text: 'لطفاً یک تصویر انتخاب کنید' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Upload file to R2
      const fileMetadata = await uploadFileToR2(file);

      // Send metadata to API
      const formData = new FormData();
      formData.append('uploadedFiles', JSON.stringify([fileMetadata]));
      formData.append('submitterTwitterId', submitterTwitterId.trim() || '');

      // Determine the API endpoint based on record type
      const apiEndpoint =
        recordType === 'victim' ? `/api/records/${recordId}/add-media` :
        recordType === 'agent' ? `/api/agents/${recordId}/add-media` :
        `/api/forces/${recordId}/add-media`;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'تصویر پروفایل با موفقیت آپلود شد!' });
        setFile(null);
        setSubmitterTwitterId('');

        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'خطا در آپلود تصویر' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در آپلود تصویر. لطفاً دوباره تلاش کنید.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'لطفاً فقط فایل تصویری انتخاب کنید' });
        return;
      }

      setFile(selectedFile);
      setMessage(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-2 right-2 bg-gold hover:bg-gold-dark text-navy-dark font-semibold px-3 py-1 rounded-lg text-sm transition-colors"
      >
        + افزودن تصویر
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6" dir="rtl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-navy-dark">
                افزودن تصویر پروفایل
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  انتخاب تصویر
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  {file ? file.name : 'کلیک کنید برای انتخاب تصویر'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  شناسه توییتر شما (اختیاری)
                </label>
                <input
                  type="text"
                  value={submitterTwitterId}
                  onChange={(e) => setSubmitterTwitterId(e.target.value)}
                  placeholder="@username"
                  dir="ltr"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent text-left"
                  disabled={isSubmitting}
                />
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    message.type === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !file}
                  className="flex-1 bg-gold hover:bg-gold-dark text-navy-dark font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'در حال آپلود...' : 'آپلود تصویر'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
