import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get default_link
    const linkResult = await query(`
      SELECT value FROM bot_settings WHERE key = 'default_link'
    `);

    // Get one_per_user setting
    const settingsResult = await query(`
      SELECT one_per_user FROM promocod_settings ORDER BY id DESC LIMIT 1
    `);

    return NextResponse.json({
      success: true,
      data: {
        default_link: linkResult.rows[0]?.value || '',
        one_per_user: settingsResult.rows[0]?.one_per_user !== false
      }
    });
  } catch (error) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { default_link, one_per_user } = body;

    // Update default_link
    if (default_link !== undefined) {
      await query(`
        INSERT INTO bot_settings (key, value)
        VALUES ('default_link', $1)
        ON CONFLICT (key) DO UPDATE SET value = $1
      `, [default_link]);
    }

    // Update one_per_user
    if (one_per_user !== undefined) {
      await query(`
        INSERT INTO promocod_settings (one_per_user)
        VALUES ($1)
        ON CONFLICT (id) DO UPDATE SET one_per_user = $1
      `, [one_per_user]);
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
