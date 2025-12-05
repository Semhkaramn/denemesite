import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT c.*, s.sched_time, s.assigned, s.assigned_user, s.dm_sent
      FROM codes c
      LEFT JOIN schedule s ON c.code = s.code
      ORDER BY c.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Promocodes GET Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, minMessages, scheduleTime } = body;

    if (!code) {
      return NextResponse.json({ success: false, error: 'Code is required' }, { status: 400 });
    }

    // Insert code
    await query(
      'INSERT INTO codes (code, min_messages) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING',
      [code, minMessages || 0]
    );

    // If schedule time provided, add to schedule
    if (scheduleTime) {
      await query(
        'INSERT INTO schedule (sched_time, code) VALUES ($1, $2)',
        [scheduleTime, code]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Promocode added successfully'
    });
  } catch (error) {
    console.error('Promocodes POST Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ success: false, error: 'Code is required' }, { status: 400 });
    }

    await query('DELETE FROM codes WHERE code = $1', [code]);

    return NextResponse.json({
      success: true,
      message: 'Promocode deleted successfully'
    });
  } catch (error) {
    console.error('Promocodes DELETE Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
