'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface AddProfilePictureProps {
  agentId: string;
  hasExistingPhoto?: boolean;
}

export default function AddProfilePicture({ agentId, hasExistingPhoto = false }: AddProfilePictureProps) {
  const isDev = process.env.NODE_ENV === 'development';
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setUploading(true);
    setMessage(null);

    try {
      // Upload file to R2
      const fileMetadata = await uploadFileToR2(file);

      // Send metadata to API
      const formData = new FormData();
      formData.append('uploadedFiles', JSON.stringify([fileMetadata]));

      const response = await fetch(`/api/agents/${agentId}/add-media`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'تصویر پروفایل با موفقیت آپلود شد.' });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Refresh the page to show the new profile picture
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        setMessage({ type: 'error', text: data.error || 'خطا در آپلود تصویر' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در آپلود تصویر. لطفاً دوباره تلاش کنید.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('آیا از حذف تصویر پروفایل اطمینان دارید؟')) {
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/agents/${agentId}/delete-primary-media`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'تصویر پروفایل با موفقیت حذف شد.' });
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        setMessage({ type: 'error', text: data.error || 'خطا در حذف تصویر' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'خطا در حذف تصویر. لطفاً دوباره تلاش کنید.' });
    } finally {
      setDeleting(false);
    }
  };

  // Only show for non-existing photos OR in dev mode
  if (!isDev && hasExistingPhoto) {
    return null;
  }

  return (
    <div className="mt-4">
      {isDev && hasExistingPhoto && (
        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800" dir="rtl">
            🔧 وضعیت توسعه‌دهنده: تغییر یا حذف عکس پروفایل
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
            disabled={uploading}
          >
            {file ? file.name : hasExistingPhoto ? 'تغییر تصویر' : 'انتخاب تصویر'}
          </button>
        </div>

        {file && (
          <button
            type="submit"
            disabled={uploading || deleting}
            className="w-full text-sm bg-gold hover:bg-gold-dark text-navy-dark font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'در حال آپلود...' : hasExistingPhoto ? 'جایگزینی تصویر' : 'آپلود تصویر'}
          </button>
        )}

        {isDev && hasExistingPhoto && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading || deleting}
            className="w-full text-sm bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? 'در حال حذف...' : 'حذف تصویر'}
          </button>
        )}

        {message && (
          <div
            className={`p-2 rounded-lg text-xs ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
            dir="rtl"
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}
