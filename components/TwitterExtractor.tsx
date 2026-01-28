'use client';

import { useState } from 'react';

interface TwitterExtractorProps {
  onExtract: (data: {
    text: string;
    images: string[];
    videos: Array<{ url: string; poster: string }>;
    hashtags: string[];
    url: string;
    authorName?: string;
  }) => Promise<void>;
}

interface ExtractedMedia {
  type: 'image' | 'video';
  url: string;
  poster?: string;
  isProfile?: boolean;
}

export default function TwitterExtractor({ onExtract }: TwitterExtractorProps) {
  const [twitterUrl, setTwitterUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractMessage, setExtractMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [extractedMedia, setExtractedMedia] = useState<ExtractedMedia[]>([]);

  const handleExtract = async () => {
    if (!twitterUrl.trim()) return;

    setIsExtracting(true);
    setExtractMessage(null);
    setExtractedMedia([]);

    try {
      const response = await fetch('/api/extract-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: twitterUrl }),
      });

      const response_data = await response.json();

      if (!response.ok) {
        setExtractMessage({ type: 'error', text: response_data.error || 'خطا در استخراج اطلاعات' });
        return;
      }

      // Extract data from the nested structure
      const data = response_data.data || response_data;

      // Show extracted media preview
      const mediaItems: ExtractedMedia[] = [];

      // First image is profile
      if (data.images && data.images.length > 0) {
        mediaItems.push({
          type: 'image',
          url: data.images[0],
          isProfile: true,
        });
        // Rest are documents
        for (let i = 1; i < data.images.length; i++) {
          mediaItems.push({
            type: 'image',
            url: data.images[i],
          });
        }
      }

      // Add videos
      if (data.videos && data.videos.length > 0) {
        data.videos.forEach((video: { url: string; poster: string }) => {
          mediaItems.push({
            type: 'video',
            url: video.url,
            poster: video.poster,
            isProfile: data.images.length === 0, // First video is profile if no images
          });
        });
      }

      setExtractedMedia(mediaItems);

      // Call the parent's onExtract callback
      await onExtract({
        text: data.text || '',
        images: data.images || [],
        videos: data.videos || [],
        hashtags: data.hashtags || [],
        url: twitterUrl,
        authorName: data.authorName,
      });

      setExtractMessage({
        type: 'success',
        text: `✓ استخراج موفق: ${data.images?.length || 0} تصویر، ${data.videos?.length || 0} ویدیو`
      });

      // Clear URL after successful extraction
      setTwitterUrl('');
    } catch (error) {
      console.error('Twitter extraction error:', error);
      setExtractMessage({ type: 'error', text: 'خطا در اتصال به سرور' });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-3">
        <div className="text-3xl">🐦</div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-navy-dark mb-2">
            استخراج خودکار از توییتر
          </h2>
          <p className="text-sm text-gray-700 mb-4 font-medium">
            لینک توییتر را وارد کنید تا تصاویر و متن به صورت خودکار استخراج شود
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://twitter.com/user/status/..."
              dir="ltr"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-gold focus:border-transparent text-left"
              disabled={isExtracting}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleExtract();
                }
              }}
            />
            <button
              type="button"
              onClick={handleExtract}
              disabled={isExtracting || !twitterUrl.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {isExtracting ? '⏳ در حال استخراج...' : '🔍 استخراج'}
            </button>
          </div>
          {extractMessage && (
            <div
              className={`mt-3 p-3 rounded-lg text-sm ${
                extractMessage.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
              dir="rtl"
            >
              {extractMessage.text}
            </div>
          )}

          {/* Media Previews */}
          {extractedMedia.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2" dir="rtl">
                محتوای استخراج شده:
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {extractedMedia.map((media, index) => (
                  <div key={index} className="relative group">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={`Extracted ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                    ) : (
                      <div className="relative w-full h-24">
                        <video
                          src={media.url}
                          poster={media.poster}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center pointer-events-none">
                          <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                            <div className="text-gray-800 text-xl ml-1">▶</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {media.isProfile && (
                      <div className="absolute top-1 right-1 bg-gold text-white text-xs px-2 py-1 rounded-full z-10">
                        پروفایل
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
