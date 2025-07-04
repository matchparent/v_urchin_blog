import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import md5 from 'md5';
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  try {
    // 查找用户，返回指定字段
    const user = await prisma.db_user.findFirst({
      where: {
        email: email,
      },
      select: {
        uid: true,
        email: true,
        pwd: true,
        nickname: true,
        job: true,
        intro: true,
        motto: true,
        date_birth: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 直接比较 MD5 值
    const hashedPassword = md5(password);
    if (hashedPassword !== user.pwd) {
      console.log('orz - invalid pass');
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // 返回除密码外的所有字段
    const { pwd, ...userWithoutPassword } = user;
    return NextResponse.json(
      {
        success: true,
        user: {
          ...userWithoutPassword,
          id: user.uid,
          name: user.nickname || user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
