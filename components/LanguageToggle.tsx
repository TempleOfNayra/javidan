'use client';

import { useLanguage } from '@/lib/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    const nextLanguage = language === 'en' ? 'fa' : 'en';
    setLanguage(nextLanguage);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/80 hover:text-white text-sm font-medium"
    >
      {language === 'en' ? (
        <>
          <span>🇮🇷</span>
          <span>فا</span>
        </>
      ) : (
        <>
          <span>🇬🇧</span>
          <span>EN</span>
        </>
      )}
    </button>
  );
}
