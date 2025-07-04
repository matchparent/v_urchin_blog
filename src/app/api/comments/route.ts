import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// 定义评论类型
interface CommentWithUser {
  rid: number;
  uid: string;
  bid: number;
  content: string;
  rbid: number | null;
  rtuid: string | null;
  create_time: Date | null;
  userNickname: string;
  replyToUserNickname?: string;
}

// 定义分组后的评论类型
interface GroupedComment extends CommentWithUser {
  replies: CommentWithUser[];
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

    // 获取所有评论
    const comments = await prisma.ub_reply.findMany({
      where: {
        bid: parseInt(bid),
      },
      orderBy: {
        create_time: 'asc',
      },
    });

    // 获取所有相关的用户 ID
    const userIds = new Set<string>();
    comments.forEach((comment) => {
      userIds.add(comment.uid);
      if (comment.rtuid) {
        userIds.add(comment.rtuid);
      }
    });

    // 批量获取用户信息
    const users = await prisma.db_user.findMany({
      where: {
        uid: {
          in: Array.from(userIds),
        },
      },
      select: {
        uid: true,
        nickname: true,
      },
    });

    // 创建用户昵称映射
    const userNicknameMap = new Map<string, string>();
    users.forEach((user) => {
      userNicknameMap.set(user.uid, user.nickname);
    });

    // 为评论添加用户信息
    const commentsWithUser: CommentWithUser[] = comments.map((comment) => ({
      ...comment,
      userNickname: userNicknameMap.get(comment.uid) || 'Unknown User',
      replyToUserNickname: comment.rtuid
        ? userNicknameMap.get(comment.rtuid)
        : undefined,
    }));

    // 将评论按 rbid 分组，rbid 为空的是一级评论
    const groupedComments: { [key: number]: GroupedComment } = {};
    commentsWithUser.forEach((comment: CommentWithUser) => {
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
    const { uid, bid, content, rbid, rtuid } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    if (!bid || !content) {
      return NextResponse.json(
        { error: 'Blog ID and content are required' },
        { status: 400 }
      );
    }

    const newComment = await prisma.ub_reply.create({
      data: {
        uid: uid,
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
