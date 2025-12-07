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

    // Create slots with random distribution (like promocode system)
    const start = new Date(startTime);
    const totalSeconds = distributionHours * 3600;
    const sliceLength = Math.floor(totalSeconds / winnerCount);
    const chosenTimes: Date[] = [];

    for (let i = 0; i < winnerCount; i++) {
      const sliceStart = i * sliceLength;
      const sliceEnd = i < winnerCount - 1 ? sliceStart + sliceLength - 1 : totalSeconds - 1;
      const randomSeconds = Math.floor(Math.random() * (sliceEnd - sliceStart + 1)) + sliceStart;
      const slotTime = new Date(start.getTime() + randomSeconds * 1000);
      chosenTimes.push(slotTime);
    }

    // Sort times chronologically
    chosenTimes.sort((a, b) => a.getTime() - b.getTime());

    // Insert all slots
    for (const slotTime of chosenTimes) {
      await query(`
        INSERT INTO randy_slots (schedule_id, sched_time, random_key)
        VALUES ($1, $2, $3)
      `, [scheduleId, slotTime, Math.random().toString(36).substring(7)]);
    }

    // Send announcement to group if requested
    if (sendAnnouncement) {
      try {
        // Get group announcement template from settings
        const settingsResult = await query('SELECT randy_group_template FROM settings WHERE id = 1');
        const groupTemplate = settingsResult.rows[0]?.randy_group_template ||
          '🏆 Yeni Randy Çekilişi Başladı!\n\n{winner_count} kişi kazanacak!\nÖdül: {prize}\n{hours} saat içinde kazananlar belirlenecek!\n\nMesaj atarak katılabilirsiniz!';

        const announcementMessage = groupTemplate
          .replace('{winner_count}', winnerCount.toString())
          .replace('{prize}', prizeText)
          .replace('{hours}', distributionHours.toString());

        // Create group_announcements table and insert announcement
        await query(`
          CREATE TABLE IF NOT EXISTS group_announcements (
            id SERIAL PRIMARY KEY,
            message TEXT NOT NULL,
            parse_mode VARCHAR(10) DEFAULT 'HTML',
            pin_message BOOLEAN DEFAULT FALSE,
            photo_url TEXT,
            media_type VARCHAR(10) DEFAULT 'photo',
            inline_keyboard JSONB,
            announcement_type VARCHAR(50) DEFAULT 'general',
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sent_at TIMESTAMP,
            message_id BIGINT
          )
        `);

        await query(`
          INSERT INTO group_announcements
          (message, parse_mode, pin_message, announcement_type)
          VALUES ($1, $2, $3, $4)
        `, [announcementMessage, 'HTML', pinMessage || false, 'randy']);
      } catch (announcementError) {
        console.error('Failed to queue announcement:', announcementError);
        // Don't fail the whole request if announcement fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Randy schedule created successfully',
      scheduleId
    });
  } catch (error) {
    console.error('Randy POST Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
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
  } catch (error) {
    console.error('Randy DELETE Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
