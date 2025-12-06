import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get all settings from bot_settings
    const settingsResult = await query(`
      SELECT key, value FROM bot_settings
    `);

    // Get one_per_user setting
    const promocodSettingsResult = await query(`
      SELECT one_per_user FROM promocod_settings ORDER BY id DESC LIMIT 1
    `);

    // Convert settings to object
    const settings: Record<string, string> = {};
    for (const row of settingsResult.rows) {
      settings[row.key] = row.value;
    }

    return NextResponse.json({
      success: true,
      data: {
        default_link: settings.default_link || '',
        one_per_user: promocodSettingsResult.rows[0]?.one_per_user !== false,
        promocod_one_per_user: promocodSettingsResult.rows[0]?.one_per_user !== false,
        promocod_dm_template: settings.promocod_dm_template || '',
        promocod_group_template: settings.promocod_group_template || '',
        randy_dm_template: settings.randy_dm_template || '',
        randy_group_template: settings.randy_group_template || ''
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
    const { key, value, default_link, one_per_user } = body;

    // If using key/value format (for templates and other settings)
    if (key && value !== undefined) {
      await query(`
        INSERT INTO bot_settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = $2
      `, [key, value]);
    }

    // Update default_link (backward compatibility)
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
