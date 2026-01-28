'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import Header from '@/components/Header';

type Category = 'victims' | 'agents' | 'forces' | 'videos' | 'documents';

interface SearchResult {
  id: number;
  first_name?: string;
  last_name?: string;
  first_name_en?: string;
  last_name_en?: string;
  full_name?: string;
  full_name_en?: string;
  location?: string;
  city?: string;
  title?: string;
  description?: string;
  birth_year?: number;
  agent_type?: string;
  affiliation?: string;
  role?: string;
  organization?: string;
  rank_position?: string;
  victim_status?: string;
  verified: boolean;
  verification_level: string;
  evidence_count: number;
  submitted_at: string;
  media?: Array<{ url: string; type: string }> | null;
}

const victimStatusLabels: Record<string, { en: string; fa: string }> = {
  executed: { en: 'Executed', fa: 'اعدام شده' },
  killed: { en: 'Killed', fa: 'کشته شده' },
  incarcerated: { en: 'Incarcerated', fa: 'زندانی' },
  disappeared: { en: 'Disappeared', fa: 'ناپدید شده' },
  injured: { en: 'Injured', fa: 'مجروح' },
  other: { en: 'Other', fa: 'سایر' },
};

const categoryEndpoints: Record<Category, string> = {
  victims: '/api/victims',
  agents: '/api/agents',
  forces: '/api/supforces',
  videos: '/api/videos',
  documents: '/api/docts',
};

const categoryLabels: Record<Category, { en: string; fa: string }> = {
  victims: { en: 'Victims', fa: 'قربانیان' },
  agents: { en: 'IR Agents', fa: 'عوامل رژیم' },
  forces: { en: 'Security Forces', fa: 'نیروهای امنیتی' },
  videos: { en: 'Videos', fa: 'ویدئوها' },
  documents: { en: 'Documents', fa: 'اسناد' },
};

export default function SearchPage() {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<Category>('victims');
  const [searchQuery, setSearchQuery] = useState('');
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<Category, number>>({
    victims: 0,
    agents: 0,
    forces: 0,
    videos: 0,
    documents: 0,
  });

  // Fetch category counts on mount
  useEffect(() => {
    fetchAllCategoryCounts();
  }, []);

  // Fetch all data when category changes
  useEffect(() => {
    fetchCategoryData();
  }, [selectedCategory]);

  // Filter results when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredResults(allResults);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = allResults.filter((item) => {
        const searchableText = [
          item.first_name,
          item.last_name,
          item.first_name_en,
          item.last_name_en,
          item.full_name,
          item.full_name_en,
          item.location,
          item.city,
          item.title,
          item.description,
          item.affiliation,
          item.role,
          item.organization,
        ].filter(Boolean).join(' ').toLowerCase();

        return searchableText.includes(lowerQuery);
      });
      setFilteredResults(filtered);
    }
  }, [searchQuery, allResults]);

  const fetchAllCategoryCounts = async () => {
    try {
      const categories: Category[] = ['victims', 'agents', 'forces', 'videos', 'documents'];
      const counts: Record<Category, number> = {
        victims: 0,
        agents: 0,
        forces: 0,
        videos: 0,
        documents: 0,
      };

      // Fetch counts for all categories in parallel
      await Promise.all(
        categories.map(async (category) => {
          try {
            const endpoint = categoryEndpoints[category];
            const response = await fetch(`${endpoint}?limit=10000`);
            const data = await response.json();
            if (data.success && data.data) {
              counts[category] = data.data.length;
            }
          } catch (error) {
            console.error(`Error fetching count for ${category}:`, error);
          }
        })
      );

      setCategoryCounts(counts);
    } catch (error) {
      console.error('Error fetching category counts:', error);
    }
  };

  const fetchCategoryData = async () => {
    setLoading(true);
    setSearchQuery(''); // Clear search when switching categories
    try {
      const endpoint = categoryEndpoints[selectedCategory];
      const response = await fetch(`${endpoint}?limit=1000`);
      const data = await response.json();

      if (data.success) {
        setAllResults(data.data || []);
        setFilteredResults(data.data || []);
        // Update count for current category
        setCategoryCounts(prev => ({
          ...prev,
          [selectedCategory]: data.data?.length || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setAllResults([]);
      setFilteredResults([]);
    } finally {
      setLoading(false);
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

  const getResultImage = (result: SearchResult) => {
    if (result.media && result.media.length > 0) {
      const imageMedia = result.media.find(m => m.type === 'image');
      if (imageMedia) return imageMedia.url;
    }
    return null;
  };

  const getResultTitle = (result: SearchResult) => {
    if (result.title) return result.title;
    // Use fullName with fallback to firstName + lastName
    if (result.full_name) return result.full_name;
    if (result.first_name && result.last_name) {
      return `${result.first_name} ${result.last_name}`;
    }
    if (result.full_name_en) return result.full_name_en;
    if (result.first_name_en && result.last_name_en) {
      return `${result.first_name_en} ${result.last_name_en}`;
    }
    return 'Unknown';
  };

  const getResultLocation = (result: SearchResult) => {
    return result.location || result.city || '';
  };

  const slugify = (text?: string) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const getDetailPageUrl = (result: SearchResult) => {
    const slug = slugify(
      result.full_name_en ||
      (result.first_name_en && result.last_name_en ? `${result.first_name_en}-${result.last_name_en}` : null) ||
      result.title
    );

    switch (selectedCategory) {
      case 'victims':
        return `/record/${result.id}${slug ? '/' + slug : ''}`;
      case 'agents':
        return `/agent/${result.id}${slug ? '/' + slug : ''}`;
      case 'forces':
        return `/force/${result.id}${slug ? '/' + slug : ''}`;
      case 'videos':
        return `/video/${result.id}${slug ? '/' + slug : ''}`;
      case 'documents':
        return `/document/${result.id}${slug ? '/' + slug : ''}`;
      default:
        return `/record/${result.id}`;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex gap-8">
          {/* Left Sidebar - Category Selection */}
          <div className="w-64 flex-shrink-0">
            <h2 className="text-xl font-bold text-navy-dark mb-4" dir={language === 'fa' ? 'rtl' : 'ltr'}>
              {language === 'fa' ? 'جستجو در' : 'Search in'}
            </h2>
            <nav className="space-y-2">
              {(Object.keys(categoryLabels) as Category[]).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-center px-4 py-3 rounded-lg transition-colors ${
                    selectedCategory === category
                      ? 'bg-gold text-navy-dark font-semibold'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>{categoryLabels[category][language]}</span>
                    <span className={`text-sm ${
                      selectedCategory === category
                        ? 'text-navy-dark/70'
                        : 'text-gray-500'
                    }`}>
                      ({categoryCounts[category]})
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content - Search and Results */}
          <div className="flex-1">
            {/* Search Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-navy-dark mb-4">
                {t('search.title')}
              </h1>

              {/* Search Field */}
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
                {loading ? (
                  <span>{t('search.searching')}</span>
                ) : (
                  <span>
                    {filteredResults.length} {t('search.recordsFound')}
                  </span>
                )}
              </div>
            </div>

            {/* Results */}
            {filteredResults.length === 0 && !loading ? (
              <div className="text-center py-16">
                <p className="text-xl text-gray-500 mb-4">{t('search.noRecords')}</p>
                <Link
                  href="/"
                  className="text-gold hover:text-gold-light font-semibold"
                >
                  {t('search.submitFirst')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResults.map((result) => {
                  const imageUrl = getResultImage(result);
                  const title = getResultTitle(result);
                  const location = getResultLocation(result);

                  return (
                    <Link
                      key={result.id}
                      href={getDetailPageUrl(result)}
                      className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      {/* Image */}
                      {imageUrl ? (
                        <div className="w-full h-48 bg-gray-100">
                          <img
                            src={imageUrl}
                            alt={title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-6xl">
                            {selectedCategory === 'videos' ? '📹' : selectedCategory === 'documents' ? '📄' : '👤'}
                          </span>
                        </div>
                      )}

                      <div className="p-4">
                        {/* Title/Name */}
                        <h3 className="text-xl font-bold text-navy-dark mb-1" dir={language === 'fa' ? 'rtl' : 'ltr'}>
                          {title}
                        </h3>

                        {/* English Name */}
                        {(result.full_name_en || result.first_name_en || result.last_name_en) && (
                          <p className="text-sm text-gray-600 mb-2" dir="ltr">
                            {result.full_name_en || `${result.first_name_en || ''} ${result.last_name_en || ''}`.trim()}
                          </p>
                        )}

                        {/* Victim Status */}
                        {result.victim_status && (
                          <p className="text-sm text-gray-700 mb-2">
                            {victimStatusLabels[result.victim_status]?.[language] || result.victim_status}
                          </p>
                        )}

                        {/* Agent Type */}
                        {result.agent_type && (
                          <p className="text-sm text-gray-700 mb-2">
                            {result.agent_type === 'internal' ? (language === 'fa' ? 'داخلی' : 'Internal') : (language === 'fa' ? 'خارجی' : 'External')}
                          </p>
                        )}

                        {/* Role/Affiliation */}
                        {result.role && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1" dir={language === 'fa' ? 'rtl' : 'ltr'}>
                            {result.role}
                          </p>
                        )}

                        {/* Location */}
                        {location && (
                          <p className="text-sm text-gray-600 mb-2">
                            📍 {location}
                          </p>
                        )}

                        {/* Birth Year */}
                        {result.birth_year && (
                          <p className="text-sm text-gray-600 mb-2">
                            🎂 {result.birth_year}
                          </p>
                        )}

                        {/* Description (for videos/documents) */}
                        {result.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2" dir={language === 'fa' ? 'rtl' : 'ltr'}>
                            {result.description}
                          </p>
                        )}

                        {/* Verification Badge */}
                        <div className="mt-3">
                          {getVerificationBadge(result.verification_level)}
                        </div>

                        {/* Evidence Count */}
                        {result.evidence_count > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            📎 {result.evidence_count} {t('search.mediaCount')}
                          </p>
                        )}

                        {/* Submitted Date */}
                        <p className="text-xs text-gray-400 mt-2">
                          {t('search.submitted')} {new Date(result.submitted_at).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US')}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
