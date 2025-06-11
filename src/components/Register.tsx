'use client';

import { Button, Input } from 'antd';
import Link from 'next/link';
import styles from './Register.module.scss';
import { UserOutlined, LockOutlined, CloseOutlined } from '@ant-design/icons';
import { ChangeEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import type { MessageInstance } from 'antd/es/message/interface';
import { req } from '@/utils/RequestConfig';
import { AxiosError } from 'axios';

interface Iprops {
  isShow: boolean;
  onClose: () => void;
  messageApi: MessageInstance;
}

export default function Register(props: Iprops) {
  const { isShow = false, onClose, messageApi } = props;
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  function onClickClose() {
    onClose();
  }

  function onChangeForm(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  function onClickRegister() {
    // Form validation
    if (!form.email) {
      messageApi.open({
        type: 'error',
        content: "Email can't be empty",
      });
      return;
    }
    if (!form.password) {
      messageApi.open({
        type: 'error',
        content: "Password can't be empty",
      });
      return;
    }
    if (!form.confirmPassword) {
      messageApi.open({
        type: 'error',
        content: 'Please confirm your password',
      });
      return;
    }
    if (form.password !== form.confirmPassword) {
      messageApi.open({
        type: 'error',
        content: "Passwords don't match",
      });
      return;
    }

    // Send registration request using axios
    req({
      url: '/api/auth/register',
      method: 'POST',
      data: {
        email: form.email,
        password: form.password,
        nickname: form.email,
      },
    })
      .then(({ data }) => {
        if (data.success) {
          // 注册成功后自动登录
          return signIn('credentials', {
            redirect: true,
            username: form.email,
            password: form.password,
            callbackUrl: '/',
          });
        } else {
          messageApi.open({
            type: 'error',
            content: data.error || 'Registration failed',
          });
          return Promise.reject(); // 中断 Promise 链
        }
      })
      .then((loginResult) => {
        if (loginResult?.ok) {
          messageApi.open({
            type: 'success',
            content: 'Registration and login successful!',
          });
          onClose();
        } else {
          messageApi.open({
            type: 'error',
            content:
              loginResult?.error ||
              'Registration successful but login failed. Please try logging in manually.',
          });
        }
      })
      .catch((error) => {
        if (error) {
          // 只有在有实际错误时才显示错误消息
          console.error('Registration error:', error);
          const axiosError = error as AxiosError<{ error: string }>;
          messageApi.open({
            type: 'error',
            content:
              axiosError.response?.data?.error ||
              error.message ||
              'An error occurred during registration',
          });
        }
      });
  }

  return isShow ? (
    <div className={styles.mask}>
      <main>
        <div>
          <CloseOutlined
            onClick={onClickClose}
            style={{
              width: '20px',
              height: '20px',
              float: 'right',
              cursor: 'pointer',
              margin: '10px',
              color: '#333',
            }}
          />
          <h3>Register</h3>
        </div>

        <div>
          <Input
            type="email"
            placeholder="Email"
            name="email"
            value={form.email}
            prefix={<UserOutlined />}
            onChange={onChangeForm}
            className={styles.input}
          />
          <Input
            type="password"
            name="password"
            value={form.password}
            placeholder="Password"
            onChange={onChangeForm}
            className={styles.input}
            prefix={<LockOutlined />}
          />
          <Input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            placeholder="Confirm Password"
            onChange={onChangeForm}
            className={styles.input}
            prefix={<LockOutlined />}
          />
        </div>

        <div>
          <Button type="primary" onClick={onClickRegister} block>
            Register
          </Button>
        </div>
        <div>
          <span>
            Registering means agreeing with{' '}
            <Link href="https://www.google.com" target="blank">
              Agreement
            </Link>
          </span>
        </div>
      </main>
    </div>
  ) : null;
}
