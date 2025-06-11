import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('uid'); // Get uid from query params

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
    });

    return NextResponse.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
