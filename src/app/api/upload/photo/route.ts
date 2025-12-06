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

    // Bot will handle base64 images directly, so we'll just convert to base64
    // This is more reliable than trying external upload services
    console.log('Converting image to base64 for direct bot transmission...');

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      isBase64: true,
      message: 'Image will be sent directly by bot'
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 });
  }
}
