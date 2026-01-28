import { NextRequest, NextResponse } from 'next/server';

// Extract tweet ID from various Twitter URL formats
function extractTweetId(url: string): string | null {
  try {
    const patterns = [
      /twitter\.com\/\w+\/status\/(\d+)/,
      /x\.com\/\w+\/status\/(\d+)/,
      /twitter\.com\/i\/web\/status\/(\d+)/,
      /x\.com\/i\/web\/status\/(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  } catch {
    return null;
  }
}

// Extract username from profile URL
function extractUsername(url: string): string | null {
  try {
    const patterns = [
      /(?:twitter|x)\.com\/([a-zA-Z0-9_]+)\/?$/,
      /(?:twitter|x)\.com\/([a-zA-Z0-9_]+)$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1] !== 'i' && match[1] !== 'intent' && match[1] !== 'home' && match[1] !== 'explore' && match[1] !== 'notifications') {
        return match[1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Extract profile information by fetching their latest tweet
async function extractProfileInfo(username: string) {
  try {
    // Use Twitter's public API endpoint to get user timeline
    const url = `https://cdn.syndication.twimg.com/timeline/profile?screen_name=${username}&limit=1`;
    console.log('[PROFILE EXTRACT] Fetching:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    console.log('[PROFILE EXTRACT] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PROFILE EXTRACT] Error response:', errorText);
      throw new Error(`Profile API failed with status ${response.status}: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('[PROFILE EXTRACT] Response text:', responseText.substring(0, 500));

    if (!responseText || responseText.trim() === '') {
      throw new Error('Empty response from Twitter API');
    }

    const data = JSON.parse(responseText);
    console.log('[PROFILE EXTRACT] Parsed data:', JSON.stringify(data).substring(0, 500));

    // Extract user info from the timeline response
    if (data && data.user) {
      return {
        authorName: data.user.name || '',
        author: data.user.screen_name || username,
        bio: data.user.description || '',
        profileImage: data.user.profile_image_url_https || '',
        isProfile: true,
      };
    }

    throw new Error('No user data in response');
  } catch (error) {
    console.error('[PROFILE EXTRACT] Profile extraction error:', error);
    throw error;
  }
}


// Try Syndication API first (official, free, reliable)
async function extractViaSyndicationAPI(tweetId: string) {
  try {
    const response = await fetch(
      `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en&token=abc`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://publish.twitter.com/',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Syndication API failed');
    }

    const data = await response.json();

    // Extract information
    const result = {
      text: data.text || '',
      author: data.user?.screen_name || '',
      authorName: data.user?.name || '',
      date: data.created_at || '',
      images: [] as string[],
      videos: [] as { url: string; poster?: string }[],
      hashtags: [] as string[],
    };

    // Extract hashtags
    if (data.entities?.hashtags && Array.isArray(data.entities.hashtags)) {
      result.hashtags = data.entities.hashtags.map((tag: any) => tag.text);
    }

    // Extract media
    if (data.photos && Array.isArray(data.photos)) {
      result.images = data.photos.map((photo: any) => photo.url);
    }

    if (data.video && data.video.variants) {
      // Get highest quality video
      const mp4Videos = data.video.variants
        .filter((v: any) => v.type === 'video/mp4')
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

      if (mp4Videos.length > 0) {
        result.videos.push({
          url: mp4Videos[0].src || mp4Videos[0].url,
          poster: data.video.poster || undefined,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Syndication API error:', error);
    throw error;
  }
}


export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Check if it's a tweet URL
    const tweetId = extractTweetId(url);

    // If no tweet ID, try profile extraction
    if (!tweetId) {
      const username = extractUsername(url);

      if (!username) {
        return NextResponse.json(
          { error: 'Invalid Twitter/X URL. Please provide a valid profile or tweet URL.' },
          { status: 400 }
        );
      }

      // Extract profile information
      try {
        const profileData = await extractProfileInfo(username);

        return NextResponse.json({
          success: true,
          data: {
            text: profileData.bio,
            author: profileData.author,
            authorName: profileData.authorName,
            date: '',
            images: profileData.profileImage ? [profileData.profileImage] : [],
            videos: [],
            hashtags: [],
            isProfile: true,
          },
        });
      } catch (profileError) {
        console.error('Profile extraction error:', profileError);

        // Fallback: Return minimal profile data with just the username
        return NextResponse.json({
          success: true,
          data: {
            text: '',
            author: username,
            authorName: username,
            date: '',
            images: [],
            videos: [],
            hashtags: [],
            isProfile: true,
          },
        });
      }
    }

    // Extract tweet information using Syndication API
    let result;
    try {
      result = await extractViaSyndicationAPI(tweetId);
    } catch (syndicationError) {
      console.error('Syndication API failed:', syndicationError);
      return NextResponse.json(
        { error: 'Could not extract tweet information. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Extract tweet error:', error);
    return NextResponse.json(
      { error: 'Failed to extract tweet information' },
      { status: 500 }
    );
  }
}
