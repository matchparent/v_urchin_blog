import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!file) {
      return new NextResponse('No file provided', { status: 400 });
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return new NextResponse('File must be an image', { status: 400 });
    }

    // 验证文件大小（限制为 2MB）
    if (file.size > 2 * 1024 * 1024) {
      return new NextResponse('File size must be less than 2MB', {
        status: 400,
      });
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 验证是否是有效的 JPEG 文件（检查文件头）
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
      return new NextResponse('Invalid image format. Please use JPEG images.', {
        status: 400,
      });
    }

    // 转换为 base64 字符串
    const base64 = buffer.toString('base64');

    // 更新用户头像
    await prisma.db_user.update({
      where: { uid: userId },
      data: { img: Buffer.from(base64) },
    });

    return new NextResponse('Avatar updated successfully', { status: 200 });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
