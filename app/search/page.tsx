'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import Header from '@/components/Header';

interface SearchRecord {
  id: number;
  first_name: string;
  last_name: string;
  first_name_en?: string;
  last_name_en?: string;
  location: string;
  birth_year?: number;
  national_id?: string;
  father_name?: string;
  mother_name?: string;
  verified: boolean;
  verification_level: string;
  evidence_count: number;
  victim_status?: string;
  submitted_at: string;
  updated_at: string;
  victim_picture_url?: string;
}

const victimStatusLabels: Record<string, { en: string; fa: string }> = {
  executed: { en: 'Executed', fa: 'اعدام شده' },
  killed: { en: 'Killed', fa: 'کشته شده' },
  incarcerated: { en: 'Incarcerated', fa: 'زندانی' },
  disappeared: { en: 'Disappeared', fa: 'ناپدید شده' },
  injured: { en: 'Injured', fa: 'مجروح' },
  other: { en: 'Other', fa: 'سایر' },
};

export default function SearchPage() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial load
  useEffect(() => {
    performSearch('');
  }, []);

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success) {
        setRecords(data.records);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case 'trusted':
        return (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <span>✓✓✓</span>
            {language === 'fa' ? 'تأیید شده' : 'Verified'}
          </span>
        );
      case 'document':
        return (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <span>✓✓</span>
            {language === 'fa' ? 'تأیید شده' : 'Verified'}
          </span>
        );
      case 'community':
        return (
          <span className="text-xs text-blue-600 flex items-center gap-1">
            <span>✓</span>
            {language === 'fa' ? 'تأیید شده' : 'Verified'}
          </span>
        );
      default:
        return (
          <span className="text-xs text-yellow-600 flex items-center gap-1">
            <span>⚠</span>
            {language === 'fa' ? 'تأیید نشده' : 'Unverified'}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-navy-dark mb-4">
            {t('search.title')}
          </h1>

          {/* Single Search Field */}
          <div className="max-w-2xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.searchPlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent text-lg"
              dir={language === 'fa' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Results Count */}
          <div className="mt-4 text-gray-600">
            {loading && !initialLoad ? (
              <span>{t('search.searching')}</span>
            ) : (
              <span>
                {records.length} {t('search.recordsFound')}
              </span>
            )}
          </div>
        </div>

        {/* Results */}
        {records.length === 0 && !loading && !initialLoad ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500 mb-4">{t('search.noRecords')}</p>
            <Link
              href="/submit"
              className="text-gold hover:text-gold-light font-semibold"
            >
              {t('search.submitFirst')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map((record) => (
              <Link
                key={record.id}
                href={`/record/${record.id}`}
                className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Victim Picture */}
                {record.victim_picture_url ? (
                  <div className="w-full h-48 bg-gray-100">
                    <img
                      src={record.victim_picture_url}
                      alt={`${record.first_name} ${record.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-6xl">👤</span>
                  </div>
                )}

                <div className="p-4">
                  {/* Names */}
                  <h3 className="text-xl font-bold text-navy-dark mb-1" dir={language === 'fa' ? 'rtl' : 'ltr'}>
                    {record.first_name} {record.last_name}
                  </h3>
                  {(record.first_name_en || record.last_name_en) && (
                    <p className="text-sm text-gray-600 mb-2" dir="ltr">
                      {record.first_name_en} {record.last_name_en}
                    </p>
                  )}

                  {/* Victim Status */}
                  {record.victim_status && (
                    <p className="text-sm text-gray-700 mb-2">
                      {victimStatusLabels[record.victim_status]?.[language] || record.victim_status}
                    </p>
                  )}

                  {/* Location */}
                  <p className="text-sm text-gray-600 mb-2">
                    📍 {record.location}
                  </p>

                  {/* Birth Year */}
                  {record.birth_year && (
                    <p className="text-sm text-gray-600 mb-2">
                      {language === 'fa' ? '🎂' : '🎂'} {record.birth_year}
                    </p>
                  )}

                  {/* Verification Badge */}
                  <div className="mt-3">
                    {getVerificationBadge(record.verification_level)}
                  </div>

                  {/* Evidence Count */}
                  {record.evidence_count > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      📎 {record.evidence_count} {t('search.mediaCount')}
                    </p>
                  )}

                  {/* Submitted Date */}
                  <p className="text-xs text-gray-400 mt-2">
                    {t('search.submitted')} {new Date(record.submitted_at).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
