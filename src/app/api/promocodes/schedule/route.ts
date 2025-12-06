import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hours, codesToDistribute, onePerUser, sendAnnouncement, pinMessage, minMessages } = body;

    if (!hours || hours <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Valid hours value is required'
      }, { status: 400 });
    }

    // Get unused codes
    const unusedResult = await query(`
      SELECT code FROM codes WHERE used = false
      AND code NOT IN (SELECT code FROM schedule WHERE assigned = false)
      ORDER BY created_at
    `);

    let codes = unusedResult.rows.map(r => r.code);

    if (codes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No unused codes available'
      }, { status: 400 });
    }

    // Limit to requested number of codes if specified
    if (codesToDistribute && codesToDistribute > 0) {
      if (codesToDistribute > codes.length) {
        return NextResponse.json({
          success: false,
          error: `Only ${codes.length} unused codes available`
        }, { status: 400 });
      }
      codes = codes.slice(0, codesToDistribute);
    }

    // Save one_per_user setting
    await query(`
      INSERT INTO promocod_settings (one_per_user)
      VALUES ($1)
      ON CONFLICT (id) DO UPDATE SET one_per_user = $1
    `, [onePerUser !== false]);

    // Create random time slots
    const now = new Date();
    const totalSeconds = hours * 3600;
    const sliceLength = totalSeconds / codes.length;
    const times: Date[] = [];

    for (let i = 0; i < codes.length; i++) {
      const sliceStart = i * sliceLength;
      const sliceEnd = i < codes.length - 1 ? sliceStart + sliceLength - 1 : totalSeconds - 1;
      const randomSeconds = Math.floor(Math.random() * (sliceEnd - sliceStart + 1)) + sliceStart;
      const schedTime = new Date(now.getTime() + randomSeconds * 1000);
      times.push(schedTime);
    }

    // Sort times
    times.sort((a, b) => a.getTime() - b.getTime());

    // Update codes table with min_messages
    const minMessagesValue = minMessages || 0;
    for (const code of codes) {
      await query(`
        UPDATE codes SET min_messages = $1 WHERE code = $2
      `, [minMessagesValue, code]);
    }

    // Insert schedule
    for (let i = 0; i < codes.length; i++) {
      await query(`
        INSERT INTO schedule (sched_time, code)
        VALUES ($1, $2)
      `, [times[i], codes[i]]);
    }

    // TODO: Send announcement to group if sendAnnouncement is true
    // This would need bot integration

    return NextResponse.json({
      success: true,
      message: `Schedule created for ${codes.length} codes over ${hours} hours`,
      codesCount: codes.length
    });
  } catch (error) {
    console.error('Schedule POST Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
