import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      message,
      parseMode = 'HTML',
      pinMessage = false,
      photoUrl = null,
      mediaType = 'photo',
      inlineKeyboard = null,
      announcementType = 'general' // general, promocode, randy
    } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }

    // Create group_announcements table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS group_announcements (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        parse_mode VARCHAR(10) DEFAULT 'HTML',
        pin_message BOOLEAN DEFAULT FALSE,
        photo_url TEXT,
        media_type VARCHAR(10) DEFAULT 'photo',
        inline_keyboard JSONB,
        announcement_type VARCHAR(50) DEFAULT 'general',
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMP,
        message_id BIGINT
      )
    `);

    // Insert announcement
    await query(`
      INSERT INTO group_announcements
      (message, parse_mode, pin_message, photo_url, media_type, inline_keyboard, announcement_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [message, parseMode, pinMessage, photoUrl, mediaType, inlineKeyboard ? JSON.stringify(inlineKeyboard) : null, announcementType]);

    return NextResponse.json({
      success: true,
      message: 'Announcement queued successfully'
    });
  } catch (error) {
    console.error('Announcements POST Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
