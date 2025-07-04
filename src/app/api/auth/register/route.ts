import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import md5 from 'md5';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password, nickname } = await request.json();

    // Validate input
    if (!email || !password || !nickname) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.db_user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password using md5
    const hashedPassword = md5(password);

    // Create new user
    const user = await prisma.db_user.create({
      data: {
        email,
        pwd: hashedPassword,
        nickname,
        job: '',
        intro: '',
        motto: '',
        date_birth: new Date(),
      },
      select: {
        uid: true,
        email: true,
        nickname: true,
        job: true,
        intro: true,
        motto: true,
        date_birth: true,
      },
    });

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, oldPassword, newPassword } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 定义受限制的 UID 列表
    const restrictedUids = [
      '5e10898e-fd80-11ef-8c68-2d8a2d43c71f',
      '946e251c-fbf1-11ef-8c68-2d8a2d43c71f',
      'aa4151da-fbb9-11ef-8c68-2d8a2d43c71f',
    ];

    // 检查当前用户的 UID 是否在受限制列表中
    if (restrictedUids.includes(userId)) {
      return NextResponse.json(
        { error: 'Password of this account cannot be modified' },
        { status: 403 }
      );
    }

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Old password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Verify old password
    const user = await prisma.db_user.findUnique({
      where: {
        uid: userId,
      },
      select: {
        pwd: true,
      },
    });

    if (!user || md5(oldPassword) !== user.pwd) {
      return NextResponse.json(
        { error: 'Incorrect old password' },
        { status: 401 }
      );
    }

    const hashedPassword = md5(newPassword);

    await prisma.db_user.update({
      where: {
        uid: userId,
      },
      data: {
        pwd: hashedPassword,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Password updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}
