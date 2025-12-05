import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    // Delete all schedules
    await query('DELETE FROM schedule');

    // Delete all codes
    await query('DELETE FROM codes');

    // Reset promocod_users tracking
    await query('DELETE FROM promocod_users');

    return NextResponse.json({
      success: true,
      message: 'All codes and schedules have been reset'
    });
  } catch (error) {
    console.error('Reset POST Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
