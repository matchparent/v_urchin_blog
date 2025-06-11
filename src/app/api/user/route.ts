// file name have to be route.ts/js
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import md5 from 'md5';

import { signIn } from 'next-auth/react';

export async function GET(req: NextRequest) {
  //   const searchParams = req.nextUrl.searchParams;
  //   const name = searchParams.get('name');
  return NextResponse.json({
    status: 200,
    data: 'success',
  });
}

export async function POST(req: NextRequest) {
  //   const formData = await req.formData();
  //   const name = formData.get('name');
  //   const pass = formData.get('pass');

  const body = await req.json();
  const res = await signIn('credentials', {
    redirect: false,
    name: body.name,
    password: body.pass,
  });
  return NextResponse.json({
    status: 200,
    data: 'success-post-' + md5(body.pass),
  });
}

// NextApiRequest/NextApiResponse 只能用于 pages/api 目录下的 API 路由。
// app/api 目录下只能用 NextRequest/NextResponse 并导出 GET/POST 等方法。
// src/pages/api/user/login.ts

// import type { NextApiRequest, NextApiResponse } from 'next';

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   res.status(200).json({
//     status: 200,
//     data: 'success',
//   });
// }
