'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Button, message } from 'antd';
import { useState, useEffect, useRef, Suspense } from 'react';
import Login from './Login';
import Register from './Register';
import { useSession, signOut } from 'next-auth/react';
import { UserOutlined } from '@ant-design/icons';
import { Skeleton } from 'antd';

const navItems = [
  {
    label: 'Urchin Blog Home',
    href: '/',
  },
  {
    label: 'Write Blog',
    href: '/newblog',
  },
  {
    label: 'Profile',
    href: '/profile',
  },
];

const UBNavContent = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loginFlag, setLoginFlag] = useState(false);
  const [registerFlag, setRegisterFlag] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status !== 'loading') {
      setLoginFlag(
        status === 'unauthenticated' && searchParams.get('login') === 'true'
      );
    }
  }, [status, searchParams]);

  function clickLogin() {
    setLoginFlag(true);
  }

  function clickRegister() {
    setRegisterFlag(true);
  }

  function onLoginFinished() {
    setLoginFlag(false);
    window.location.href = '/';
  }

  function onRegisterFinished() {
    setRegisterFlag(false);
    // window.location.href = '/';
  }

  async function clickLogout() {
    await signOut({
      redirect: true,
      callbackUrl: '/',
    });
  }

  const handleAvatarClick = () => {
    if (session?.user) {
      fileInputRef.current?.click();
    }
  };

  const processImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        // 创建 canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // 计算裁剪尺寸（取正方形）
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        // 设置 canvas 尺寸为 200x200
        canvas.width = 200;
        canvas.height = 200;

        // 绘制裁剪后的图片
        ctx.drawImage(
          img,
          startX,
          startY,
          size,
          size, // 源图片裁剪区域
          0,
          0,
          200,
          200 // canvas 绘制区域
        );

        // 转换为 JPEG blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image to blob'));
            }
          },
          'image/jpeg',
          0.9 // JPEG 质量
        );

        // 清理
        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user) return;

    try {
      // 处理图片
      const processedBlob = await processImage(file);

      // 创建新的 File 对象
      const processedFile = new File([processedBlob], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('userId', String(session.user.id));

      const response = await fetch('/api/portrait/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        messageApi.success('Avatar updated successfully');
        setAvatarError(false);
        const timestamp = Date.now();
        const imgElement = document.querySelector(
          'img[alt="Avatar"]'
        ) as HTMLImageElement;
        if (imgElement) {
          imgElement.src = `/api/portrait?uid=${session.user.id}&t=${timestamp}`;
        }
        window.location.reload();
      } else {
        const error = await response.text();
        messageApi.error(error || 'Failed to update avatar');
      }
    } catch (error) {
      console.error('Error processing or uploading image:', error);
      messageApi.error(
        'An error occurred while processing or uploading the avatar'
      );
    }

    // 清除文件输入
    e.target.value = '';
  };

  return (
    <>
      {contextHolder}
      <div className="h-16 flex items-center border-b-[1px] border-gray-200 border-solid">
        <div
          className="w-10 h-10 mr-8"
          onClick={() => router.push('/')}
          style={{ cursor: 'pointer' }}
        >
          <svg
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
          >
            <g clipPath="url(#a)">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10.27 14.1a6.5 6.5 0 0 0 3.67-3.45q-1.24.21-2.7.34-.31 1.83-.97 3.1M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.48-1.52a7 7 0 0 1-.96 0H7.5a4 4 0 0 1-.84-1.32q-.38-.89-.63-2.08a40 40 0 0 0 3.92 0q-.25 1.2-.63 2.08a4 4 0 0 1-.84 1.31zm2.94-4.76q1.66-.15 2.95-.43a7 7 0 0 0 0-2.58q-1.3-.27-2.95-.43a18 18 0 0 1 0 3.44m-1.27-3.54a17 17 0 0 1 0 3.64 39 39 0 0 1-4.3 0 17 17 0 0 1 0-3.64 39 39 0 0 1 4.3 0m1.1-1.17q1.45.13 2.69.34a6.5 6.5 0 0 0-3.67-3.44q.65 1.26.98 3.1M8.48 1.5l.01.02q.41.37.84 1.31.38.89.63 2.08a40 40 0 0 0-3.92 0q.25-1.2.63-2.08a4 4 0 0 1 .85-1.32 7 7 0 0 1 .96 0m-2.75.4a6.5 6.5 0 0 0-3.67 3.44 29 29 0 0 1 2.7-.34q.31-1.83.97-3.1M4.58 6.28q-1.66.16-2.95.43a7 7 0 0 0 0 2.58q1.3.27 2.95.43a18 18 0 0 1 0-3.44m.17 4.71q-1.45-.12-2.69-.34a6.5 6.5 0 0 0 3.67 3.44q-.65-1.27-.98-3.1"
                fill="var(--foreground)"
              />
            </g>
            <defs>
              <clipPath id="a">
                <path fill="#fff" d="M0 0h16v16H0z" />
              </clipPath>
            </defs>
          </svg>
        </div>

        {navItems?.map((item) => (
          <Link
            key={item?.href}
            href={item?.href}
            className={`ml-4 pt-2 leading-13 border-solid border-b-4 ${item?.href === pathname ? 'border-blue-600 ' : 'border-transparent'}`}
          >
            {item?.label}
          </Link>
        ))}

        <section className="ml-auto flex items-center">
          {status === 'loading' ? (
            <div className="flex items-center gap-2">
              <Skeleton.Avatar active shape="circle" size={32} />
              <div className="mr-4 ml-4">
                <Skeleton.Input
                  active
                  size="small"
                  className="w-12! min-w-12!"
                />
              </div>

              <div className="w-20">
                <Skeleton.Button active shape="square" block />
              </div>
            </div>
          ) : session?.user ? (
            <>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleAvatarClick}
                >
                  <Image
                    src={
                      avatarError
                        ? '/deletex.png'
                        : `/api/portrait?uid=${session.user.id}&t=${Date.now()}`
                    }
                    alt="Avatar"
                    width={32}
                    height={32}
                    className="object-cover"
                    onError={() => setAvatarError(true)}
                    onLoad={() => setAvatarError(false)}
                    unoptimized
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <span className="mr-8 ml-4 cursor-default">
                  {session.user.name}
                </span>
              </div>
              <Button onClick={clickLogout} className="w-20">
                Logout
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                  <UserOutlined style={{ fontSize: '30px', color: '#08c' }} />
                </div>
                <span
                  className="mr-8 ml-4 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    clickLogin();
                  }}
                >
                  Login
                </span>
              </div>
              <Button type="primary" onClick={clickRegister} className="w-20">
                Register
              </Button>
            </>
          )}
        </section>
      </div>

      <Login
        isShow={loginFlag}
        onClose={onLoginFinished}
        messageApi={messageApi}
      />

      <Register
        isShow={registerFlag}
        onClose={onRegisterFinished}
        messageApi={messageApi}
      />
    </>
  );
};

const UBNav = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UBNavContent />
    </Suspense>
  );
};

export default UBNav;
