import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('uid'); // Get uid from query params
    const pageParam = searchParams.get('page');
    const page = parseInt(pageParam ?? '1'); // ✅ null 合并运算符保证类型安全

    const limitParam = searchParams.get('limit');
    const limit = parseInt(limitParam ?? '4'); // ✅ 同理// Default to 4 blogs per page

    const skip = (page - 1) * limit;

    const whereClause: { status: number; uid?: string } = { status: 1 };
    if (userId) {
      whereClause.uid = userId;
    }

    const blogs = await prisma.ub_blog.findMany({
      where: whereClause,
      select: {
        bid: true,
        title: true,
        content: true,
        num_view: true,
        create_time: true,
      },
      orderBy: {
        create_time: 'desc',
      },
      skip: skip,
      take: limit,
    });

    const totalBlogs = await prisma.ub_blog.count({
      where: whereClause,
    });

    return NextResponse.json({ blogs, totalBlogs });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
