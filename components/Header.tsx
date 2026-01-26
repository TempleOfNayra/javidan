'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import LanguageToggle from './LanguageToggle';

export default function Header() {
  const { t } = useLanguage();

  return (
    <header className="bg-navy-dark border-b border-navy">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center relative">
          {/* Version - Always on the left */}
          <div className="text-white/60 text-sm absolute left-0" dir="ltr">
            {t('common.version')}
          </div>

          {/* Logo - Center */}
          <a href="/" className="absolute left-1/2 transform -translate-x-1/2">
            <img
              src="/lion-sun.svg"
              alt="Lion and Sun - Emblem of Iran"
              className="h-20 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            />
          </a>

          {/* Navigation and Language Toggle */}
          <div className="ml-auto flex items-center gap-4">
            <nav className="flex gap-6">
              <Link
                href="/search"
                className="text-white/80 hover:text-gold transition-colors"
              >
                {t('nav.search')}
              </Link>
              <Link
                href="/submit"
                className="text-white/80 hover:text-gold transition-colors"
              >
                {t('nav.submit')}
              </Link>
            </nav>
            <LanguageToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
