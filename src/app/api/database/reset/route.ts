import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    // Delete all data from all tables
    // Order matters due to foreign key constraints

    await query('DELETE FROM schedule');
    await query('DELETE FROM codes');
    await query('DELETE FROM randy_slots');
    await query('DELETE FROM randy_schedule');
    await query('DELETE FROM invited_users');
    await query('DELETE FROM invite_links');
    await query('DELETE FROM message_stats');
    await query('DELETE FROM promocod_settings');
    await query('DELETE FROM bot_settings');

    console.log('✅ Database reset completed successfully');

    return NextResponse.json({
      success: true,
      message: 'All database tables have been cleared'
    });
  } catch (error) {
    console.error('Database reset error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
