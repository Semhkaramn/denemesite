import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const schedulesResult = await query(`
      SELECT
        rs.*,
        COUNT(DISTINCT rsl.id) as total_slots,
        COUNT(DISTINCT CASE WHEN rsl.assigned = true THEN rsl.id END) as assigned_slots
      FROM randy_schedule rs
      LEFT JOIN randy_slots rsl ON rs.id = rsl.schedule_id
      GROUP BY rs.id
      ORDER BY rs.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      data: schedulesResult.rows
    });
  } catch (error) {
    console.error('Randy GET Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      winnerCount,
      distributionHours,
      prizeText,
      minMessages,
      messagePeriod,
      sendAnnouncement,
      pinMessage,
      onePerUser,
      startTime
    } = body;

    if (!winnerCount || !distributionHours || !prizeText || !startTime) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Create randy schedule
    const scheduleResult = await query(`
      INSERT INTO randy_schedule (
        winner_count, distribution_hours, prize_text, min_messages,
        message_period, send_announcement, pin_message, one_per_user, start_time
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      winnerCount,
      distributionHours,
      prizeText,
      minMessages || 0,
      messagePeriod || 'none',
      sendAnnouncement !== false,
      pinMessage !== false,
      onePerUser !== false,
      startTime
    ]);

    const scheduleId = scheduleResult.rows[0].id;

    // Create slots
    const start = new Date(startTime);
    const intervalMs = (distributionHours * 60 * 60 * 1000) / winnerCount;

    for (let i = 0; i < winnerCount; i++) {
      const slotTime = new Date(start.getTime() + (intervalMs * i));
      await query(`
        INSERT INTO randy_slots (schedule_id, sched_time, random_key)
        VALUES ($1, $2, $3)
      `, [scheduleId, slotTime, Math.random().toString(36).substring(7)]);
    }

    return NextResponse.json({
      success: true,
      message: 'Randy schedule created successfully',
      scheduleId
    });
  } catch (error: any) {
    console.error('Randy POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await query('DELETE FROM randy_schedule WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Randy schedule deleted successfully'
    });
  } catch (error: any) {
    console.error('Randy DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
