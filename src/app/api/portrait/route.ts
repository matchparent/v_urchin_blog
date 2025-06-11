import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUid = searchParams.get('uid');

    if (!targetUid) {
      return new NextResponse('User ID is required', { status: 400 });
    }

    const user = await prisma.db_user.findUnique({
      where: { uid: targetUid },
      select: { img: true },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (!user.img) {
      return new NextResponse('', {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store, must-revalidate', // 禁用缓存
        },
      });
    }

    // 如果数据是 Uint8Array，需要先转换为字符串
    let base64Str = '';

    if (Buffer.isBuffer(user.img)) {
      base64Str = (user.img as Buffer).toString('utf8');
    } else {
      base64Str = Buffer.from(user.img as Uint8Array).toString('utf8');
    }

    // 检查是否是有效的 base64 字符串
    if (!base64Str.startsWith('/9j/')) {
      console.error('Invalid image data format');
      return new NextResponse('Invalid image data', { status: 400 });
    }

    try {
      // 直接解码 base64 字符串
      const imageBuffer = Buffer.from(base64Str, 'base64');

      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/jpeg', // 改为 jpeg，因为数据是 JPEG 格式
          'Cache-Control': 'no-store, must-revalidate', // 禁用缓存
        },
      });
    } catch (error) {
      console.error('Error decoding base64:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error fetching avatar:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
