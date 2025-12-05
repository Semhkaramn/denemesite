import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface TargetUser {
  user_id: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      message,
      parseMode,
      sendToAll,
      userIds,
      disableWebPagePreview,
      photoUrl,
      inlineKeyboard
    } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }

    // Get target users
    let targetUsers: TargetUser[] = [];

    if (sendToAll) {
      // Get all users
      const result = await query(`
        SELECT user_id FROM message_stats
        ORDER BY user_id
      `);
      targetUsers = result.rows;
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Get selected users
      const result = await query(`
        SELECT user_id FROM message_stats
        WHERE user_id = ANY($1)
      `, [userIds]);
      targetUsers = result.rows;
    } else {
      return NextResponse.json({
        success: false,
        error: 'No users selected'
      }, { status: 400 });
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No users found'
      }, { status: 404 });
    }

    // Send messages via bot (you'll need to implement this in your bot)
    // For now, we'll store the message request in a pending_messages table

    const messagePreview = message.length > 100 ? message.substring(0, 100) + '...' : message;

    // Create message log
    const logResult = await query(`
      INSERT INTO message_logs (
        message_text, parse_mode, recipient_count, message_preview, sent_at,
        disable_web_page_preview, photo_url, inline_keyboard
      )
      VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7)
      RETURNING id
    `, [
      message,
      parseMode || 'HTML',
      targetUsers.length,
      messagePreview,
      disableWebPagePreview !== false,  // Default to true
      photoUrl || null,
      inlineKeyboard ? JSON.stringify(inlineKeyboard) : null
    ]);

    const messageLogId = logResult.rows[0].id;

    // Store pending messages for each user
    for (const user of targetUsers) {
      await query(`
        INSERT INTO pending_messages (
          user_id, message_text, parse_mode, message_log_id, status,
          disable_web_page_preview, photo_url, inline_keyboard
        )
        VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)
        ON CONFLICT (user_id, message_log_id) DO NOTHING
      `, [
        user.user_id,
        message,
        parseMode || 'HTML',
        messageLogId,
        disableWebPagePreview !== false,  // Default to true
        photoUrl || null,
        inlineKeyboard ? JSON.stringify(inlineKeyboard) : null
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Messages queued for sending',
      sentCount: targetUsers.length,
      messageLogId
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
