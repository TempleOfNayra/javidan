import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url, type } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Download the media file from Twitter
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': type === 'video' ? 'video/*' : 'image/*',
        'Referer': 'https://twitter.com/',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to download media: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the blob
    const blob = await response.blob();

    // Validate size
    if (blob.size === 0) {
      return NextResponse.json(
        { error: 'Downloaded file is empty (0 bytes)' },
        { status: 500 }
      );
    }

    // Convert to base64 for transfer
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    return NextResponse.json({
      success: true,
      data: base64,
      size: blob.size,
      type: blob.type || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
    });

  } catch (error) {
    console.error('Error downloading media:', error);
    return NextResponse.json(
      { error: 'Failed to download media file' },
      { status: 500 }
    );
  }
}
