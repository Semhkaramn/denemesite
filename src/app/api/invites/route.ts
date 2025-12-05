import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT
        il.*,
        COUNT(DISTINCT iu.id) as total_invites,
        COUNT(DISTINCT CASE WHEN iu.is_active = true THEN iu.id END) as active_invites
      FROM invite_links il
      LEFT JOIN invited_users iu ON il.invite_link = iu.invite_link
      GROUP BY il.id
      ORDER BY il.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Invites GET Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
