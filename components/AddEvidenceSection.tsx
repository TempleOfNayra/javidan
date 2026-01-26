'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface AddEvidenceSectionProps {
  recordId: string;
}

export default function AddEvidenceSection({ recordId }: AddEvidenceSectionProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = Array.from(selectedFiles);
      setFiles(prev => [...prev, ...newFiles]);
      setUploadStatus('idle');
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('recordId', recordId);

      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/add-evidence', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setFiles([]);
        // Refresh the page to show new media
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setUploadStatus('error');
        setErrorMessage(data.error || 'فشل در آپلود فایل‌ها');
      }
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage('خطا در ارتباط با سرور');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 shadow-sm mb-8">
      <h3 className="text-xl font-semibold text-navy-dark mb-2 text-center">
        اطلاعات بیشتری دارید؟
      </h3>
      <p className="text-gray-600 mb-4 text-center">
        با افزودن مدارک، اسناد یا جزئیات بیشتر به تأیید این رکورد کمک کنید.
      </p>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag and Drop Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center transition-colors ${
          isDragging
            ? 'border-gold bg-gold/10'
            : 'border-gray-300 bg-white'
        }`}
      >
        <div className="text-4xl mb-2">📎</div>
        <p className="text-gray-700 mb-2">
          فایل‌ها را اینجا بکشید یا کلیک کنید
        </p>
        <button
          onClick={handleButtonClick}
          disabled={uploading}
          className="inline-block bg-gold hover:bg-gold-light text-navy-dark px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          انتخاب فایل
        </button>
        <p className="text-sm text-gray-500 mt-2">
          فرمت‌های پشتیبانی شده: تصاویر، ویدیوها، PDF
        </p>
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            فایل‌های انتخاب شده ({files.length}):
          </h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl">
                    {file.type.startsWith('image/') ? '🖼️' : file.type.startsWith('video/') ? '🎥' : '📄'}
                  </span>
                  <span className="text-sm text-gray-700 truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="text-red-600 hover:text-red-800 px-2 py-1 text-sm disabled:opacity-50"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="text-center">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-navy-dark hover:bg-navy text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'در حال آپلود...' : 'آپلود فایل‌ها'}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {uploadStatus === 'success' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-green-700 font-medium">
            ✓ فایل‌ها با موفقیت آپلود شدند
          </p>
          <p className="text-sm text-green-600 mt-1">
            صفحه در حال بارگذاری مجدد...
          </p>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-700 font-medium">
            ✗ {errorMessage}
          </p>
          <p className="text-sm text-red-600 mt-1">
            لطفاً دوباره تلاش کنید
          </p>
        </div>
      )}
    </div>
  );
}
