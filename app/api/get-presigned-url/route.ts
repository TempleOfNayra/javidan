import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUrl } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const { fileName, contentType } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      );
    }

    const result = await generatePresignedUrl(fileName, contentType, contentType);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
