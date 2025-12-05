import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT * FROM bot_settings');
    const settings: Record<string, string> = {};

    for (const row of result.rows) {
      settings[row.key] = row.value;
    }

    // Get promocod settings
    const promocodResult = await query('SELECT * FROM promocod_settings ORDER BY id DESC LIMIT 1');
    const promocodSettings = promocodResult.rows[0] || { one_per_user: true };

    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        promocod_one_per_user: promocodSettings.one_per_user
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
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
    }

    // Handle promocod one_per_user setting separately
    if (key === 'promocod_one_per_user') {
      await query(`
        INSERT INTO promocod_settings (one_per_user)
        VALUES ($1)
      `, [value === 'true' || value === true]);
    } else {
      await query(`
        INSERT INTO bot_settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = $2
      `, [key, value]);
    }

    return NextResponse.json({
      success: true,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
