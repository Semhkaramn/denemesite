import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Total users
    const totalUsersResult = await query('SELECT COUNT(*) as count FROM message_stats');
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // Total messages
    const totalMessagesResult = await query('SELECT SUM(message_count) as total FROM message_stats');
    const totalMessages = parseInt(totalMessagesResult.rows[0].total || 0);

    // Active promocodes
    const activeCodesResult = await query('SELECT COUNT(*) as count FROM codes WHERE used = false');
    const activeCodes = parseInt(activeCodesResult.rows[0].count);

    // Used promocodes
    const usedCodesResult = await query('SELECT COUNT(*) as count FROM codes WHERE used = true');
    const usedCodes = parseInt(usedCodesResult.rows[0].count);

    // Active randy schedules
    const activeRandyResult = await query("SELECT COUNT(*) as count FROM randy_schedule WHERE status = 'active'");
    const activeRandy = parseInt(activeRandyResult.rows[0].count);

    // Total invites
    const totalInvitesResult = await query('SELECT COUNT(*) as count FROM invited_users');
    const totalInvites = parseInt(totalInvitesResult.rows[0].count);

    // Active invites
    const activeInvitesResult = await query('SELECT COUNT(*) as count FROM invited_users WHERE is_active = true');
    const activeInvites = parseInt(activeInvitesResult.rows[0].count);

    // Top users by message count
    const topUsersResult = await query(`
      SELECT user_id, username, first_name, message_count, last_message_at
      FROM message_stats
      ORDER BY message_count DESC
      LIMIT 10
    `);

    // Messages per day (last 7 days)
    const messagesPerDayResult = await query(`
      SELECT DATE(last_message_at) as date, COUNT(*) as count
      FROM message_stats
      WHERE last_message_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(last_message_at)
      ORDER BY date DESC
    `);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalMessages,
        activeCodes,
        usedCodes,
        activeRandy,
        totalInvites,
        activeInvites,
        topUsers: topUsersResult.rows,
        messagesPerDay: messagesPerDayResult.rows,
      }
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
