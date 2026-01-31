'use client';

import { useState } from 'react';

interface UpdateFieldButtonProps {
  recordType: 'victim' | 'agent' | 'force' | 'video' | 'document';
  recordId: string;
  fieldName: string;
  fieldLabel: string;
  fieldType?: 'text' | 'number' | 'date' | 'textarea';
  currentValue?: string | number | null;
  options?: Array<{ value: string; label: string }>;
}

export default function UpdateFieldButton({
  recordType,
  recordId,
  fieldName,
  fieldLabel,
  fieldType = 'text',
  currentValue,
  options,
}: UpdateFieldButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');
  const [submitterTwitterId, setSubmitterTwitterId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Show button for dev admins to edit all fields
  // (removed the early return that was hiding buttons for filled fields)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!value.trim()) {
      setMessage({ type: 'error', text: 'لطفاً مقداری وارد کنید' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/update-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordType,
          recordId: parseInt(recordId),
          fieldName,
          value: fieldType === 'number' ? parseInt(value) : value,
          submitterTwitterId: submitterTwitterId.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'اطلاعات با موفقیت به‌روز شد!' });
        setValue('');
        setSubmitterTwitterId('');

        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'خطا در به‌روزرسانی اطلاعات' });
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ type: 'error', text: 'خطا در به‌روزرسانی. لطفاً دوباره تلاش کنید.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-gold hover:text-gold-dark font-medium transition-colors"
        title={`افزودن ${fieldLabel}`}
      >
        + افزودن
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6" dir="rtl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-navy-dark">
                افزودن {fieldLabel}
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
                  {fieldLabel}
                </label>
                {options ? (
                  <select
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    disabled={isSubmitting}
                    autoFocus
                  >
                    <option value="">انتخاب کنید...</option>
                    {options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : fieldType === 'textarea' ? (
                  <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    disabled={isSubmitting}
                    autoFocus
                  />
                ) : (
                  <input
                    type={fieldType}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    disabled={isSubmitting}
                    autoFocus
                  />
                )}
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
                  disabled={isSubmitting}
                  className="flex-1 bg-gold hover:bg-gold-dark text-navy-dark font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'در حال ثبت...' : 'ثبت اطلاعات'}
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
