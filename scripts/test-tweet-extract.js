// Test with a known public tweet from Elon Musk (should always work)
const tweetUrl = 'https://twitter.com/elonmusk/status/1866249225688084932';

// Extract tweet ID
function extractTweetId(url) {
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
}

async function testExtraction() {
  const tweetId = extractTweetId(tweetUrl);
  console.log('Tweet ID:', tweetId);

  if (!tweetId) {
    console.error('Could not extract tweet ID');
    return;
  }

  // Test Syndication API
  console.log('\n=== Testing Syndication API ===');
  try {
    const response = await fetch(
      `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IranEyes/1.0)',
        },
      }
    );

    console.log('Status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('\nFull Response:');
      console.log(JSON.stringify(data, null, 2));

      console.log('\n=== Extracted Data ===');
      console.log('Text:', data.text || 'NONE');
      console.log('Photos:', data.photos?.length || 0);
      console.log('Video:', data.video ? 'YES' : 'NO');

      if (data.video) {
        console.log('Video variants:', data.video.variants?.length || 0);
        if (data.video.variants) {
          const mp4Videos = data.video.variants.filter(v => v.type === 'video/mp4');
          console.log('MP4 videos:', mp4Videos.length);
          if (mp4Videos.length > 0) {
            console.log('Best quality URL:', mp4Videos[0].url);
          }
        }
      }
    } else {
      const text = await response.text();
      console.log('Error response:', text);
    }
  } catch (error) {
    console.error('Syndication API Error:', error.message);
  }

  // Test Nitter
  console.log('\n\n=== Testing Nitter ===');
  const username = tweetUrl.match(/(?:twitter|x)\.com\/(\w+)\/status/)?.[1];
  console.log('Username:', username);

  if (username) {
    const nitterInstances = ['nitter.net', 'nitter.poast.org', 'nitter.privacydev.net'];

    for (const instance of nitterInstances) {
      console.log(`\nTrying ${instance}...`);
      try {
        const url = `https://${instance}/${username}/status/${tweetId}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; IranEyes/1.0)',
          },
        });

        console.log('Status:', response.status);

        if (response.ok) {
          const html = await response.text();
          console.log('HTML length:', html.length);

          // Try to extract tweet text
          const tweetTextMatch = html.match(/<div class="tweet-content[^"]*"[^>]*>(.*?)<\/div>/s);
          if (tweetTextMatch) {
            const text = tweetTextMatch[1]
              .replace(/<[^>]+>/g, '')
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .trim();
            console.log('Extracted text:', text.substring(0, 200));
          } else {
            console.log('Could not extract text');
          }

          // Look for images
          const imageMatches = [...html.matchAll(/<a href="([^"]+\/pic\/[^"]+)"/g)];
          console.log('Found images:', imageMatches.length);

          break;
        }
      } catch (error) {
        console.log('Error:', error.message);
      }
    }
  }

  // Test via our API
  console.log('\n\n=== Testing Our API ===');
  try {
    const response = await fetch('http://localhost:3000/api/extract-tweet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: tweetUrl }),
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('API Error:', error.message);
  }
}

testExtraction().catch(console.error);
