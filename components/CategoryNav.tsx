'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';

type Category = 'victims' | 'agents' | 'forces' | 'videos' | 'documents';

interface CategoryNavProps {
  selectedCategory?: Category;
  categoryCounts: Record<Category, number>;
  onCategoryClick?: (category: Category) => void;
  mode?: 'navigate' | 'callback'; // navigate = go to /search, callback = call onCategoryClick
}

const categoryLabels: Record<Category, { en: string; fa: string }> = {
  victims: { en: 'Victims', fa: 'قربانیان' },
  agents: { en: 'IR Agents', fa: 'عوامل رژیم' },
  forces: { en: 'Security Forces', fa: 'نیروهای امنیتی' },
  videos: { en: 'Videos', fa: 'ویدئوها' },
  documents: { en: 'Documents', fa: 'اسناد' },
};

export default function CategoryNav({
  selectedCategory,
  categoryCounts,
  onCategoryClick,
  mode = 'callback'
}: CategoryNavProps) {
  const { language } = useLanguage();
  const router = useRouter();

  const handleClick = (category: Category) => {
    if (mode === 'navigate') {
      router.push(`/search?category=${category}`);
    } else if (onCategoryClick) {
      onCategoryClick(category);
    }
  };

  return (
    <div className="w-64 flex-shrink-0">
      <h2 className="text-xl font-bold text-navy-dark mb-4" dir={language === 'fa' ? 'rtl' : 'ltr'}>
        {language === 'fa' ? 'جستجو در' : 'Search in'}
      </h2>
      <nav className="space-y-2">
        {(Object.keys(categoryLabels) as Category[]).map((category) => (
          <button
            key={category}
            onClick={() => handleClick(category)}
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
  );
}
