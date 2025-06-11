'use client';

import { useState } from 'react';
import { Input, Button, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { req } from '@/utils/RequestConfig';
import { AxiosError } from 'axios';

export default function ChangePass() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [messageApi, contextHolder] = message.useMessage();
  const { data: session } = useSession();

  const handleSubmit = () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      messageApi.error('All fields are required!');
      return;
    }
    if (newPassword.length < 6) {
      messageApi.error('New password must be at least 6 characters long!');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      messageApi.error('New passwords do not match!');
      return;
    }

    if (!session?.user?.id) {
      messageApi.error('User not logged in.');
      return;
    }

    req({
      url: '/api/auth/register',
      method: 'PUT',
      data: {
        oldPassword,
        newPassword,
      },
    })
      .then(({ data }) => {
        if (data.success) {
          messageApi.success(data.message || 'Password updated successfully!');
          setOldPassword('');
          setNewPassword('');
          setConfirmNewPassword('');
        } else {
          messageApi.error(data.error || 'Failed to update password.');
        }
      })
      .catch((error: unknown) => {
        console.error('Error updating password:', error);
        const axiosError = error as AxiosError<{ error: string }>;
        messageApi.error(
          axiosError.response?.data?.error ||
            axiosError.message ||
            'An unexpected error occurred.'
        );
      });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      {contextHolder}
      <Input.Password
        placeholder="Old Password"
        prefix={<LockOutlined />}
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        style={{ marginBottom: '15px' }}
      />
      <Input.Password
        placeholder="New Password (min 6 characters)"
        prefix={<LockOutlined />}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={{ marginBottom: '15px' }}
      />
      <Input.Password
        placeholder="Confirm New Password"
        prefix={<LockOutlined />}
        value={confirmNewPassword}
        onChange={(e) => setConfirmNewPassword(e.target.value)}
        style={{ marginBottom: '20px' }}
      />
      <Button type="primary" onClick={handleSubmit} block>
        Submit
      </Button>
    </div>
  );
}
