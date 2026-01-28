'use client';

import { useState } from 'react';

interface ProfileMediaDisplayProps {
  victimPicture: {
    type: 'image' | 'video';
    publicUrl: string;
  } | null;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  supportingMedia?: Array<{ type: string; publicUrl: string }>;
}

export default function ProfileMediaDisplay({
  victimPicture,
  fullName,
  firstName,
  lastName,
  supportingMedia = [],
}: ProfileMediaDisplayProps) {
  const displayName = fullName || `${firstName} ${lastName}`;
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Find the first video in supporting media
  const firstVideo = supportingMedia?.find(m => m.type === 'video');

  const handleClick = () => {
    if (firstVideo) {
      setShowVideoModal(true);
    }
  };

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('ProfileMediaDisplay:', {
      victimPictureType: victimPicture?.type,
      victimPictureUrl: victimPicture?.publicUrl,
      hasVideo: !!firstVideo,
      showModal: showVideoModal,
    });
  }

  return (
    <>
      {victimPicture ? (
        <div
          className={`mb-6 ${firstVideo ? 'cursor-pointer group' : ''}`}
          onClick={handleClick}
        >
          {victimPicture.type === 'video' ? (
            <video
              src={victimPicture.publicUrl}
              controls
              preload="metadata"
              className="w-80 h-80 object-cover rounded-lg shadow-lg"
            >
              متصفح شما از پخش ویدیو پشتیبانی نمی‌کند.
            </video>
          ) : (
            <div className="relative">
              {firstVideo ? (
                // If there's a video, use video tag with poster - much simpler!
                <video
                  poster={victimPicture.publicUrl}
                  className="w-80 h-80 object-cover rounded-lg shadow-lg"
                  preload="metadata"
                  controls
                >
                  <source src={firstVideo.publicUrl} type="video/mp4" />
                  متصفح شما از پخش ویدیو پشتیبانی نمی‌کند.
                </video>
              ) : (
                // If no video, just show the image
                <img
                  src={victimPicture.publicUrl}
                  alt={displayName}
                  className="w-80 h-80 object-cover rounded-lg shadow-lg"
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="w-80 h-80 bg-gray-100 rounded-lg flex items-center justify-center mb-6 shadow-lg relative">
          <span className="text-gray-400 text-9xl">👤</span>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && firstVideo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button - larger and more visible */}
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-12 right-0 bg-white text-black text-xl font-bold px-4 py-2 rounded hover:bg-gray-200 transition-colors z-10"
            >
              ✕ بستن
            </button>
            <video
              src={firstVideo.publicUrl}
              controls
              autoPlay
              className="w-full max-h-[80vh] rounded-lg"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowVideoModal(false);
                }
              }}
            >
              متصفح شما از پخش ویدیو پشتیبانی نمی‌کند.
            </video>
            {/* Instruction text */}
            <p className="text-white text-center mt-4 text-sm">
              برای بستن، روی پس‌زمینه کلیک کنید یا دکمه بستن را فشار دهید
            </p>
          </div>
        </div>
      )}
    </>
  );
}
