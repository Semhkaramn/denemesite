import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT
        c.code,
        c.created_at,
        c.used,
        c.used_by,
        c.used_at,
        c.min_messages,
        s.sched_time,
        s.assigned,
        s.assigned_user,
        s.dm_sent,
        m.username as used_by_username,
        m.first_name as used_by_first_name
      FROM codes c
      LEFT JOIN schedule s ON c.code = s.code
      LEFT JOIN message_stats m ON c.used_by = m.user_id
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
    const { codes } = body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Codes array is required'
      }, { status: 400 });
    }

    // Insert codes (ignore duplicates)
    for (const code of codes) {
      await query(`
        INSERT INTO codes (code)
        VALUES ($1)
        ON CONFLICT (code) DO NOTHING
      `, [code]);
    }

    return NextResponse.json({
      success: true,
      message: `${codes.length} codes uploaded successfully`
    });
  } catch (error) {
    console.error('Promocodes POST Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
