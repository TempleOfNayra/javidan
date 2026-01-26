'use client';

import { useState } from 'react';
import Link from 'next/link';
import SubmitModal from './SubmitModal';

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

  return (
    <>
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-navy-dark mb-6">
            In Memory of Those We Lost
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            A public memorial and archive documenting the lives lost during Iran's revolution. Community-driven, open-source, and dedicated to preserving the truth.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gold hover:bg-gold-light text-navy-dark px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Submit a Record
            </button>
            <Link
              href="/search"
              className="border-2 border-gold hover:bg-gold/10 px-8 py-3 rounded-lg font-semibold transition-colors text-navy-dark"
            >
              Search Archive
            </Link>
          </div>
        </div>

        {/* Recent Submissions Feed */}
        {recentRecords.length > 0 && (
          <div className="mb-16">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-navy-dark">
                Recent Submissions
              </h3>
              <Link
                href="/search"
                className="text-gold hover:text-gold-light font-semibold transition-colors"
              >
                View All →
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
                        Submitted by:{' '}
                        {record.submitterTwitterId ? (
                          <span className="text-blue-600">
                            {record.submitterTwitterId.startsWith('@')
                              ? record.submitterTwitterId
                              : `@${record.submitterTwitterId}`}
                          </span>
                        ) : (
                          <span className="text-gray-400">Anonymous</span>
                        )}
                        {' '}at {new Date(record.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Mission Statement */}
        <div className="mt-16 text-center max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-navy-dark mb-4">
            Why Javidan?
          </h3>
          <p className="text-gray-700 leading-relaxed">
            Javidan (جاویدان - eternal) is an open-source, crowd-sourced memorial dedicated to documenting and honoring those who lost their lives during Iran's ongoing revolution. We believe in transparency, community verification, and preserving the truth for future generations.
          </p>
        </div>
      </main>

      {/* Submit Modal */}
      <SubmitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
