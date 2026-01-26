'use client';

import { useState, useRef } from 'react';

interface AddMediaFormProps {
  agentId: string;
}

export default function AddMediaForm({ agentId }: AddMediaFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [submitterTwitterId, setSubmitterTwitterId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (newFiles) {
      const filesArray = Array.from(newFiles);
      setFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    handleFiles(droppedFiles);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      setMessage({ type: 'error', text: 'لطفاً حداقل یک فایل انتخاب کنید' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();

      files.forEach(file => {
        formData.append('files', file);
      });

      if (submitterTwitterId) {
        formData.append('submitterTwitterId', submitterTwitterId);
      }

      const response = await fetch(`/api/agents/${agentId}/add-media`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `${data.filesUploaded} فایل با موفقیت آپلود شد. صفحه را رفرش کنید.` });
        setFiles([]);
        setSubmitterTwitterId('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setMessage({ type: 'error', text: data.error || 'خطا در آپلود فایل‌ها' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'خطا در آپلود فایل‌ها. لطفاً دوباره تلاش کنید.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-t pt-6 mt-6">
      <h3 className="text-xl font-bold text-navy-dark mb-4" dir="rtl">
        افزودن مدارک و اسناد اضافی
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drag and Drop Zone */}
        <div dir="rtl">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            انتخاب فایل‌ها (تصاویر، ویدیوها، اسناد)
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer
              transition-all duration-200
              ${isDragging
                ? 'border-gold bg-gold/10 scale-[1.02]'
                : 'border-gray-300 hover:border-gold hover:bg-gray-50'
              }
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl">📁</div>
              <p className="text-sm sm:text-base font-semibold text-gray-700">
                {isDragging ? 'فایل‌ها را اینجا رها کنید' : 'فایل‌ها را اینجا بکشید یا کلیک کنید'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                تصاویر، ویدیوها، PDF و اسناد
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
              disabled={uploading}
            />
          </div>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div dir="rtl" className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              فایل‌های انتخاب شده ({files.length})
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-2 sm:p-3 rounded-lg"
                >
                  <span className="text-xs sm:text-sm text-gray-700 truncate flex-1">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800 mr-2 text-lg sm:text-xl px-2"
                    disabled={uploading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Twitter ID (Optional) */}
        <div dir="rtl">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            شناسه توییتر شما (اختیاری)
          </label>
          <input
            type="text"
            value={submitterTwitterId}
            onChange={(e) => setSubmitterTwitterId(e.target.value)}
            placeholder="@username"
            dir="ltr"
            className="w-full px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent text-left"
            disabled={uploading}
          />
        </div>

        {/* Submit Button */}
        <div dir="rtl">
          <button
            type="submit"
            disabled={uploading || files.length === 0}
            className="w-full sm:w-auto bg-gold hover:bg-gold-dark text-navy-dark font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            {uploading ? 'در حال آپلود...' : 'آپلود فایل‌ها'}
          </button>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            dir="rtl"
            className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}
