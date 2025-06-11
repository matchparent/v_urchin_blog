import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { uid, title, content, status } = await request.json();

    if (!uid || !title || !content) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newBlog = await prisma.ub_blog.create({
      data: {
        uid,
        title,
        content,
        status: status || 1, // Default to 1 if not provided
      },
    });

    return NextResponse.json({ success: true, newBlog }, { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
