import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    // 获取用户 session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // 获取请求体数据
    const { nickname, date_birth } = await request.json();

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
        uid: session.user.id,
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
