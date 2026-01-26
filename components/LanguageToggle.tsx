'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const nextLocale = locale === 'en' ? 'fa' : 'en';

    startTransition(() => {
      // Set cookie for locale preference
      document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000`;
      router.refresh();
    });
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isPending}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/80 hover:text-white text-sm font-medium"
    >
      {locale === 'en' ? (
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
