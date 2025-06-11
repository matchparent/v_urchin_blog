// src/lib/auth.ts

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import md5 from 'md5';

// 扩展 Session 类型
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

const prisma = new PrismaClient();
const maxAge = 30 * 24 * 60 * 60;

async function verifyUser(email: string, password: string) {
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
      return { error: 'User not found' };
    }

    // 直接比较 MD5 值
    const hashedPassword = md5(password);
    if (hashedPassword !== user.pwd) {
      console.log('orz - invalid pass');
      return { error: 'Invalid password' };
    }

    // 返回除密码外的所有字段
    const { pwd, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      id: user.uid,
      name: user.nickname || user.email,
    };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Internal server error' };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const result = await verifyUser(
          credentials.username,
          credentials.password
        );
        if ('error' in result) {
          throw new Error(result.error);
        }
        return result;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: maxAge, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        // 从数据库获取最新的用户信息
        try {
          const user = await prisma.db_user.findUnique({
            where: {
              uid: token.id as string,
            },
            select: {
              uid: true,
              email: true,
              nickname: true,
            },
          });

          if (user) {
            session.user.id = user.uid;
            session.user.email = user.email;
            session.user.name = user.nickname || user.email;
          }
        } catch (error) {
          console.error('Error fetching user info for session:', error);
          // 如果获取失败，使用 token 中的基本信息
          session.user.id = token.id as string;
        }
      }
      return session;
    },
  },
  jwt: {
    maxAge: maxAge, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '?login=true', // 自定义登录页面
    error: '/auth/error', // 添加错误页面
  },
  events: {
    async signIn({ user }) {
      // 登录时立即更新 session
      await fetch('/api/auth/session', { method: 'GET' });
    },
  },
};
