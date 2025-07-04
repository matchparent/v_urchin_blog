import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    // 获取请求体数据
    const { userId, nickname, date_birth } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 验证必填字段
    if (!nickname) {
      return NextResponse.json(
        { error: 'Nickname is required' },
        { status: 400 }
      );
    }

    // 更新用户信息
    const updatedUser = await prisma.db_user.update({
      where: {
        uid: userId,
      },
      data: {
        nickname: nickname,
        date_birth: date_birth ? new Date(date_birth) : null,
      },
      select: {
        uid: true,
        email: true,
        nickname: true,
        date_birth: true,
      },
    });

    // 触发 session 更新，确保前端获取到最新的用户信息
    try {
      await fetch(`${request.nextUrl.origin}/api/auth/session`, {
        method: 'GET',
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      });
    } catch (error) {
      console.error('Error updating session:', error);
      // 即使 session 更新失败，也不影响用户信息更新的成功
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
