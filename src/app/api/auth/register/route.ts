import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { currentUser, newUsername, newPassword } = await request.json();

    if (!currentUser || !newUsername || !newPassword) {
      return NextResponse.json(
        { error: 'Tüm alanlar gerekli' },
        { status: 400 }
      );
    }

    // Mevcut kullanıcının yeni kullanıcı oluşturma yetkisi var mı kontrol et
    const currentUserResult = await query(
      'SELECT can_create_users FROM admin_users WHERE LOWER(username) = LOWER($1)',
      [currentUser]
    );

    if (currentUserResult.rows.length === 0 || !currentUserResult.rows[0].can_create_users) {
      return NextResponse.json(
        { error: 'Yeni kullanıcı oluşturma yetkiniz yok' },
        { status: 403 }
      );
    }

    // Kullanıcı adının daha önce kullanılmadığını kontrol et
    const existingUser = await query(
      'SELECT id FROM admin_users WHERE LOWER(username) = LOWER($1)',
      [newUsername]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Bu kullanıcı adı zaten kullanılıyor' },
        { status: 409 }
      );
    }

    // Yeni kullanıcıyı oluştur
    await query(
      'INSERT INTO admin_users (username, password, can_create_users) VALUES ($1, $2, $3)',
      [newUsername, newPassword, false]
    );

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
