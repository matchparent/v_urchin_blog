'use client';

import { Button, Input } from 'antd';
import Link from 'next/link';
import styles from './Login.module.scss';
import { UserOutlined, LockOutlined, CloseOutlined } from '@ant-design/icons';
import { ChangeEvent, useState } from 'react';
// import { req } from '@/utils/RequestConfig';
import { signIn } from 'next-auth/react';
import type { MessageInstance } from 'antd/es/message/interface';

interface Iprops {
  isShow: boolean;
  onClose: () => void;
  messageApi: MessageInstance;
}

export default function Login(props: Iprops) {
  const { isShow = false, onClose, messageApi } = props;
  const [form, setform] = useState({
    name: 'qwer@qw.er',
    pass: 'qwer1234',
  });

  function onClickClose() {
    onClose();
  }

  async function onClickLogin() {
    if (!form?.name) {
      messageApi.open({
        type: 'warning',
        content: "Username can't be empty",
      });
      return;
    }
    if (!form?.pass) {
      messageApi.open({
        type: 'warning',
        content: "Password can't be empty",
      });
      return;
    }

    try {
      const res = await signIn('credentials', {
        redirect: false,
        username: form.name.trim(),
        password: form.pass.trim(),
        callbackUrl: '/',
      });

      if (res?.ok) {
        messageApi.open({
          type: 'success',
          content: 'Login successful',
        });
        onClose();
      } else {
        // 显示后端返回的错误信息
        messageApi.open({
          type: 'error',
          content: res?.error || 'Login failed',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      messageApi.open({
        type: 'error',
        content: 'An error occurred during login',
      });
    }
  }

  function onChangeName(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setform({ ...form, [name]: value });
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
          <h3>Login</h3>
        </div>

        <div>
          <Input
            type="text"
            placeholder="username"
            name="name"
            value={form.name}
            prefix={<UserOutlined />}
            onChange={onChangeName}
            className={styles.input}
            onPressEnter={onClickLogin}
          />
          <Input
            type="password"
            name="pass"
            value={form.pass}
            placeholder="password"
            onChange={onChangeName}
            className={styles.input}
            prefix={<LockOutlined />}
            onPressEnter={onClickLogin}
          />
        </div>

        <div>
          <Button type="primary" onClick={onClickLogin} block>
            Login
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
