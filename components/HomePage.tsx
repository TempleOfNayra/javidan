'use client';

import { useState } from 'react';
import Link from 'next/link';
import SubmitModal from './SubmitModal';
import Header from './Header';
import { useLanguage } from '@/lib/LanguageContext';

interface RecentRecord {
  id: string;
  firstName: string;
  lastName: string;
  location: string;
  additionalInfo?: string;
  submitterTwitterId?: string;
  submittedAt: string;
  media?: { url: string; type: string } | null;
}

export default function HomePage({ recentRecords }: { recentRecords: RecentRecord[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <Header onSubmitClick={() => setIsModalOpen(true)} />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-navy-dark mb-3">
            {t('home.title')}
          </h2>
          <p className="text-2xl font-semibold text-red-600 mb-6 italic">
            {t('home.subtitle')}
          </p>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            {t('home.description')}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gold hover:bg-gold-light text-navy-dark px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              {t('home.submitButton')}
            </button>
            <Link
              href="/search"
              className="border-2 border-gold hover:bg-gold/10 px-8 py-3 rounded-lg font-semibold transition-colors text-navy-dark"
            >
              {t('home.searchButton')}
            </Link>
          </div>
        </div>

        {/* Recent Submissions Feed */}
        {recentRecords.length > 0 && (
          <div className="mb-16">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-navy-dark">
                {t('home.recentSubmissions')}
              </h3>
              <Link
                href="/search"
                className="text-gold hover:text-gold-light font-semibold transition-colors"
              >
                {t('home.viewAll')} →
              </Link>
            </div>

            <div className="space-y-4">
              {recentRecords.map((record) => (
                <Link
                  key={record.id}
                  href={`/record/${record.id}`}
                  className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-gold transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Photo */}
                    {record.media && record.media.type === 'image' ? (
                      <div className="flex-shrink-0">
                        <img
                          src={record.media.url}
                          alt={`${record.firstName} ${record.lastName}`}
                          className="w-16 h-16 object-cover rounded"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-2xl">👤</span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <h4 className="text-lg font-semibold text-navy-dark">
                          {record.firstName} {record.lastName}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {record.location}
                        </span>
                      </div>

                      {record.additionalInfo && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                          {record.additionalInfo}
                        </p>
                      )}

                      <p className="text-xs text-gray-500">
                        {t('home.submittedBy')}:{' '}
                        {record.submitterTwitterId ? (
                          <span className="text-blue-600">
                            {record.submitterTwitterId.startsWith('@')
                              ? record.submitterTwitterId
                              : `@${record.submitterTwitterId}`}
                          </span>
                        ) : (
                          <span className="text-gray-400">{t('home.anonymous')}</span>
                        )}
                        {' '}{t('home.at')} {new Date(record.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Open Source Notice */}
        <div className="mt-16 text-center max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-navy-dark mb-4">
            {t('home.openSourceTitle')}
          </h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            {t('home.openSourceText')}
          </p>
          <a
            href="https://github.com/TempleOfNayra/javidan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:text-gold-light font-semibold inline-flex items-center gap-2"
            dir="ltr"
          >
            github.com/TempleOfNayra/javidan
            <span>→</span>
          </a>
        </div>
      </main>

      {/* Submit Modal */}
      <SubmitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
