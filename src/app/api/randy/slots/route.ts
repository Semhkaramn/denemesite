import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');

    if (!scheduleId) {
      return NextResponse.json({ success: false, error: 'Schedule ID is required' }, { status: 400 });
    }

    const result = await query(`
      SELECT
        rs.*,
        ms.username,
        ms.first_name
      FROM randy_slots rs
      LEFT JOIN message_stats ms ON rs.assigned_user = ms.user_id
      WHERE rs.schedule_id = $1
      ORDER BY rs.sched_time ASC
    `, [scheduleId]);

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Randy Slots GET Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
