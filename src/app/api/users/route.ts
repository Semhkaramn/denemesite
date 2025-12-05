import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const detailed = searchParams.get('detailed') === 'true';

    // Get detailed user info
    if (userId && detailed) {
      const userResult = await query(`
        SELECT * FROM message_stats WHERE user_id = $1
      `, [userId]);

      if (userResult.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      const user = userResult.rows[0];

      // Get promocodes won
      const promocodesResult = await query(`
        SELECT COUNT(*) as count FROM schedule
        WHERE assigned_user = $1 AND assigned = true
      `, [userId]);

      // Get randy won
      const randyResult = await query(`
        SELECT COUNT(*) as count FROM randy_slots
        WHERE assigned_user = $1 AND assigned = true
      `, [userId]);

      // Get invites made
      const invitesResult = await query(`
        SELECT COUNT(*) as count FROM invited_users
        WHERE inviter_user_id = $1 AND is_active = true
      `, [userId]);

      // Get invited by
      const invitedByResult = await query(`
        SELECT il.user_id, il.username, il.first_name
        FROM invited_users iu
        JOIN invite_links il ON iu.invite_link = il.invite_link
        WHERE iu.invited_user_id = $1
        LIMIT 1
      `, [userId]);

      const invitedBy = invitedByResult.rows.length > 0
        ? invitedByResult.rows[0].username
          ? `@${invitedByResult.rows[0].username}`
          : invitedByResult.rows[0].first_name || 'Unknown'
        : null;

      return NextResponse.json({
        success: true,
        data: {
          ...user,
          promocodes_won: parseInt(promocodesResult.rows[0].count),
          randy_won: parseInt(randyResult.rows[0].count),
          invites_made: parseInt(invitesResult.rows[0].count),
          invited_by: invitedBy
        }
      });
    }

    // Get users list with filters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const period = searchParams.get('period') || 'all';
    const offset = (page - 1) * limit;

    let whereClause = '';
    let periodClause = '';
    const params: unknown[] = [limit, offset];
    let paramCount = 2;

    // Time period filter
    if (period !== 'all') {
      if (period === 'today') {
        periodClause = `last_message_at >= CURRENT_DATE`;
      } else if (period === 'week') {
        periodClause = `last_message_at >= CURRENT_DATE - INTERVAL '7 days'`;
      } else if (period === 'month') {
        periodClause = `last_message_at >= CURRENT_DATE - INTERVAL '30 days'`;
      }
    }

    // Search filter
    if (search) {
      paramCount++;
      const searchCondition = `(
        username ILIKE $${paramCount} OR
        first_name ILIKE $${paramCount} OR
        CAST(user_id AS TEXT) LIKE $${paramCount}
      )`;
      whereClause = searchCondition;
      params.push(`%${search}%`);
    }

    // Combine filters
    const conditions = [whereClause, periodClause].filter(c => c);
    const finalWhereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT *
      FROM message_stats
      ${finalWhereClause}
      ORDER BY message_count DESC
      LIMIT $1 OFFSET $2
    `, params);

    const countParams = params.slice(2); // Skip limit and offset
    const countQuery = `SELECT COUNT(*) as total FROM message_stats ${finalWhereClause}`;
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      success: true,
      data: {
        users: result.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Users GET Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
