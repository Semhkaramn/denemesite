import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    // admin_users tablosunu oluştur (eğer yoksa)
    await query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        can_create_users BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // İlk kullanıcıyı kontrol et
    const existingUser = await query(
      'SELECT id FROM admin_users WHERE LOWER(username) = LOWER($1)',
      ['semhkaramn']
    );

    if (existingUser.rows.length === 0) {
      // İlk kullanıcıyı ekle
      await query(
        'INSERT INTO admin_users (username, password, can_create_users) VALUES ($1, $2, $3)',
        ['semhkaramn', 'Abuzittin74.', true]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
