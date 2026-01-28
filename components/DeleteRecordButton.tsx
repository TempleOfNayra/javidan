'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteRecordButton({
  recordId,
  recordType = 'victim',
}: {
  recordId: string;
  recordType?: 'victim' | 'agent' | 'security-force';
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  // Only show in development (client-side check for UI only - server enforces this)
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) {
    return null;
  }

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const endpoint =
        recordType === 'agent' ? `/api/agents/${recordId}/delete` :
        recordType === 'security-force' ? `/api/supforces/${recordId}/delete` :
        `/api/records/${recordId}/delete`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete record');
      }

      // Redirect to search page after successful deletion
      router.push('/search');
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('خطا در حذف رکورد. لطفاً دوباره تلاش کنید.');
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="fixed bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg text-sm font-medium"
      >
        🗑️ حذف رکورد (DEV)
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border-2 border-red-600 rounded-lg shadow-xl p-4 max-w-sm">
      <p className="text-sm font-semibold text-gray-900 mb-3" dir="rtl">
        آیا مطمئن هستید که می‌خواهید این رکورد را حذف کنید؟
      </p>
      <p className="text-xs text-gray-600 mb-4" dir="rtl">
        این عملیات قابل بازگشت نیست و تمام اطلاعات و مدارک مرتبط حذف خواهند شد.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:bg-gray-400 text-sm font-medium"
        >
          {isDeleting ? 'در حال حذف...' : 'بله، حذف شود'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors disabled:bg-gray-100 text-sm font-medium"
        >
          انصراف
        </button>
      </div>
    </div>
  );
}
