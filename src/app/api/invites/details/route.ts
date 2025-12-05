import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const inviteLink = searchParams.get('link');

    if (!inviteLink) {
      return NextResponse.json({ success: false, error: 'Invite link is required' }, { status: 400 });
    }

    const result = await query(`
      SELECT *
      FROM invited_users
      WHERE invite_link = $1
      ORDER BY joined_at DESC
    `, [inviteLink]);

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Invite Details GET Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
