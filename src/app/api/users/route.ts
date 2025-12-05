import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: unknown[] = [limit, offset];

    if (search) {
      // Search by username, first_name or user_id
      whereClause = `WHERE
        username ILIKE $3 OR
        first_name ILIKE $3 OR
        CAST(user_id AS TEXT) LIKE $3
      `;
      params.push(`%${search}%`);
    }

    const result = await query(`
      SELECT *
      FROM message_stats
      ${whereClause}
      ORDER BY message_count DESC
      LIMIT $1 OFFSET $2
    `, params);

    const countQuery = search
      ? `SELECT COUNT(*) as total FROM message_stats ${whereClause}`
      : 'SELECT COUNT(*) as total FROM message_stats';

    const countParams = search ? [`%${search}%`] : [];
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
