import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// 定义评论类型
interface CommentWithRelations {
  rid: number;
  uid: string;
  bid: number;
  content: string;
  rbid: number | null;
  rtuid: string | null;
  create_time: Date | null;
  user?: { uid: string; nickname: string | null };
  replyToUser?: { uid: string; nickname: string | null } | null;
}

// 定义分组后的评论类型
interface GroupedComment extends CommentWithRelations {
  replies: CommentWithRelations[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bid = searchParams.get('bid');

    if (!bid) {
      return NextResponse.json(
        { error: 'Blog ID is required' },
        { status: 400 }
      );
    }

    // 获取所有评论及相关用户信息
    const comments = await prisma.ub_reply.findMany({
      where: {
        bid: parseInt(bid),
      },
      orderBy: {
        create_time: 'asc',
      },
      include: {
        // 获取评论发布者的信息 (根据 prisma/schema.prisma 关联 user 表)
        user: {
          select: {
            uid: true,
            nickname: true,
          },
        },
        // 获取回复对象用户的信息 (根据 prisma/schema.prisma 关联 user 表)
        replyToUser: {
          select: {
            uid: true,
            nickname: true,
          },
        },
      },
    });

    // 将评论按 rbid 分组，rbid 为空的是一级评论
    const groupedComments: { [key: number]: GroupedComment } = {};
    comments.forEach((comment: CommentWithRelations) => {
      if (!comment.rbid) {
        // 一级评论
        groupedComments[comment.rid] = { ...comment, replies: [] };
      } else {
        // 二级评论，添加到对应的一级评论下
        if (groupedComments[comment.rbid]) {
          groupedComments[comment.rbid].replies.push(comment);
        }
      }
    });

    // 转换成数组并按时间排序一级评论
    const result = Object.values(groupedComments).sort(
      (a: GroupedComment, b: GroupedComment) =>
        new Date(a.create_time as Date).getTime() -
        new Date(b.create_time as Date).getTime()
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { bid, content, rbid, rtuid } = await request.json();

    if (!bid || !content) {
      return NextResponse.json(
        { error: 'Blog ID and content are required' },
        { status: 400 }
      );
    }

    const newComment = await prisma.ub_reply.create({
      data: {
        uid: session.user.id,
        bid: parseInt(bid),
        content: content,
        rbid: rbid || null,
        rtuid: rtuid || null,
        create_time: new Date(),
      },
    });

    return NextResponse.json(newComment);
  } catch (error) {
    console.error('Error posting comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
