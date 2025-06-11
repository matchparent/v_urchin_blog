import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bid: string }> }
) {
  try {
    const { bid } = await context.params;
    const bidNum = parseInt(bid, 10);

    if (isNaN(bidNum)) {
      return NextResponse.json({ message: 'Invalid blog ID' }, { status: 400 });
    }

    const blog = await prisma.ub_blog.findUnique({
      where: {
        bid: bidNum,
      },
      select: {
        bid: true,
        title: true,
        content: true,
        num_view: true,
        create_time: true,
      },
    });

    if (!blog) {
      return NextResponse.json({ message: 'Blog not found' }, { status: 404 });
    }

    // Increment num_view
    await prisma.ub_blog.update({
      where: {
        bid: bidNum,
      },
      data: {
        num_view: {
          increment: 1,
        },
      },
    });

    // Return the updated blog data (or original if you prefer not to re-fetch)
    // For simplicity, we'll return the original fetched blog, but you could re-fetch to show the incremented view immediately
    const updatedBlog = { ...blog, num_view: blog.num_view + 1 };
    return NextResponse.json(updatedBlog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
