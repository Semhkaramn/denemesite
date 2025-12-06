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

    // Try multiple upload services

    // Method 1: Try Telegraph
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('https://telegra.ph/upload', {
        method: 'POST',
        body: uploadFormData,
        headers: {
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].src) {
          const photoUrl = 'https://telegra.ph' + data[0].src;
          return NextResponse.json({
            success: true,
            url: photoUrl
          });
        }
      }
    } catch (e) {
      console.log('Telegraph upload failed, trying alternative...');
    }

    // Method 2: Try ImgBB (free, no API key for temp uploads)
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      // Using free API (might have limits)
      const response = await fetch('https://api.imgbb.com/1/upload?key=d48372cbf361f9cf138493d820795571', {
        method: 'POST',
        body: uploadFormData
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.data && data.data.url) {
          return NextResponse.json({
            success: true,
            url: data.data.url
          });
        }
      }
    } catch (e) {
      console.log('ImgBB upload failed, trying alternative...');
    }

    // Method 3: Convert to base64 and use Telegraph via bot later
    // For now, return base64 URL
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      isBase64: true
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 });
  }
}
