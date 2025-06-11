'use client';

import { useState, useEffect, useRef } from 'react';
import { Input, Button, message, DatePicker } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import dayjs from 'dayjs';
import { req } from '@/utils/RequestConfig';

interface UserInfo {
  nickname: string;
  date_birth: string;
  email: string;
}

export default function BasicInfo() {
  const { data: session } = useSession();
  const [userInfo, setUserInfo] = useState<UserInfo>({
    nickname: '',
    date_birth: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateFormat = 'YYYY-MM-DD';

  console.log(userInfo.date_birth);

  // 获取用户信息
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserInfo();
    }
  }, [session?.user?.id]);

  const fetchUserInfo = () => {
    req({
      url: '/api/user/info',
      method: 'GET',
    })
      .then(({ data }) => {
        setUserInfo({
          nickname: data.nickname || '',
          date_birth: data.date_birth
            ? new Date(data.date_birth).toISOString().split('T')[0]
            : '',
          email: data.email || '',
        });
      })
      .catch((error) => {
        console.error('Error fetching user info:', error);
      });
  };

  // 处理头像上传
  const processImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        canvas.width = 200;
        canvas.height = 200;

        ctx.drawImage(img, startX, startY, size, size, 0, 0, 200, 200);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image to blob'));
            }
          },
          'image/jpeg',
          0.9
        );

        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
    });
  };

  const handleAvatarClick = () => {
    if (session?.user) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user) return;

    processImage(file)
      .then((processedBlob) => {
        const processedFile = new File([processedBlob], 'avatar.jpg', {
          type: 'image/jpeg',
        });

        const formData = new FormData();
        formData.append('file', processedFile);

        return req({
          url: '/api/portrait/upload',
          method: 'POST',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      })
      .then(() => {
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
      })
      .catch((error) => {
        console.error('Error processing or uploading image:', error);
        messageApi.error(
          'An error occurred while processing or uploading the avatar'
        );
      });

    e.target.value = '';
  };

  // 处理表单提交
  const handleSubmit = () => {
    if (!session?.user?.id) {
      messageApi.error('User not logged in');
      return;
    }

    setLoading(true);

    req({
      url: '/api/user/update',
      method: 'PUT',
      data: {
        nickname: userInfo.nickname,
        date_birth: userInfo.date_birth,
      },
    })
      .then(() => {
        messageApi.success('Profile updated successfully');
        // 更新成功后重载页面
        window.location.reload();
      })
      .catch((error) => {
        console.error('Error updating profile:', error);
        messageApi.error('An error occurred while updating profile');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleInputChange = (field: keyof UserInfo, value: string) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {contextHolder}

      <div className="space-y-6">
        {/* 头像部分 */}
        <div className="flex flex-col items-center space-y-4">
          <div
            className="w-20 h-20 rounded-full overflow-hidden border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleAvatarClick}
          >
            {session?.user?.id ? (
              <Image
                src={
                  avatarError
                    ? '/deletex.png'
                    : `/api/portrait?uid=${session.user.id}&t=${Date.now()}`
                }
                alt="Avatar"
                width={80}
                height={80}
                className="object-cover"
                onError={() => setAvatarError(true)}
                onLoad={() => setAvatarError(false)}
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <UserOutlined style={{ fontSize: '40px', color: '#ccc' }} />
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* 昵称输入 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nickname
          </label>
          <Input
            value={userInfo.nickname}
            onChange={(e) => handleInputChange('nickname', e.target.value)}
            placeholder="Enter your nickname"
            size="large"
          />
        </div>

        {/* 生日输入 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Birthday
          </label>
          {/* <Input
            type="date"
            value={userInfo.date_birth}
            onChange={(e) => handleInputChange('date_birth', e.target.value)}
            size="large"
            placeholder="Select your birthday"
          /> */}
          <DatePicker
            onChange={(
              date: dayjs.Dayjs | null,
              dateString: string | string[]
            ) =>
              handleInputChange(
                'date_birth',
                Array.isArray(dateString) ? dateString[0] : dateString
              )
            }
            className="w-full"
            size="large"
            value={
              userInfo.date_birth
                ? dayjs(userInfo.date_birth, dateFormat)
                : null
            }
            format={dateFormat}
          />
        </div>

        {/* 提交按钮 */}
        <div className="pt-4">
          <Button
            type="primary"
            size="large"
            onClick={handleSubmit}
            loading={loading}
            block
          >
            Update Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
