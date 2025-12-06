import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'File too large (max 10MB)'
      }, { status: 400 });
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        error: 'Only image files are allowed'
      }, { status: 400 });
    }

    // Upload to Telegraph
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const response = await fetch('https://telegra.ph/upload', {
      method: 'POST',
      body: uploadFormData
    });

    if (!response.ok) {
      throw new Error('Telegraph upload failed');
    }

    const data = await response.json();

    if (data && data[0] && data[0].src) {
      const photoUrl = 'https://telegra.ph' + data[0].src;
      return NextResponse.json({
        success: true,
        url: photoUrl
      });
    } else {
      throw new Error('Invalid response from Telegraph');
    }
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 });
  }
}
