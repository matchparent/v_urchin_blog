'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import BasicInfo from '@/components/BasicInfo';
import ChangePass from '@/components/ChangePass';
import MyBlogs from '@/components/MyBlogs';

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
  {
    key: 'basic-info',
    label: 'Basic Information',
    // icon: <MailOutlined />,
  },
  {
    type: 'divider',
  },
  {
    key: 'change-pass',
    label: 'Change Password',
    // icon: <AppstoreOutlined />,
  },
  {
    type: 'divider',
  },
  {
    key: 'my-blogs',
    label: 'My Blogs',
    // icon: <AppstoreOutlined />,
  },
];

const ProfilePageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentTheme, setCurrentTheme] = useState<
    'dark' | 'light' | undefined
  >(undefined);

  // 根据 URL 参数 selection 设置初始选中的菜单项
  const getInitialSelectedKey = () => {
    const selection = searchParams.get('selection');
    const validKeys = ['basic-info', 'change-pass', 'my-blogs'];

    // 如果 selection 参数存在且匹配某个菜单项，则选中该项
    if (selection && validKeys.includes(selection)) {
      return selection;
    }

    // 否则默认选中 basic-info
    return 'basic-info';
  };

  const [selectedKey, setSelectedKey] = useState<string>(
    getInitialSelectedKey()
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');
      };

      handleChange();
      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, []);

  const onClick: MenuProps['onClick'] = (e) => {
    setSelectedKey(e.key as string);
    // 更新 URL 参数以反映当前选中的菜单项
    router.push(`/profile?selection=${e.key}`);
  };

  if (currentTheme === undefined) {
    return <div>Loading ...</div>;
  }

  const renderContent = () => {
    switch (selectedKey) {
      case 'basic-info':
        return <BasicInfo />;
      case 'change-pass':
        return <ChangePass />;
      case 'my-blogs':
        return <MyBlogs />;
      default:
        return <BasicInfo />;
    }
  };

  return (
    <main className="ch flex flex-row">
      <style>
        {`
        .ant-menu-dark{
          color: rgba(255, 255, 255, 1);
          background: #0a0a0a;
        }
        `}
      </style>
      <Menu
        onClick={onClick}
        style={{
          width: 180,
          borderRight: '1px solid oklch(92.8% 0.006 264.531)',
        }}
        defaultSelectedKeys={[selectedKey]}
        mode="inline"
        items={items}
        theme={currentTheme}
      />
      <div style={{ flexGrow: 1, padding: '20px' }}>{renderContent()}</div>
    </main>
  );
};

const ProfilePage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
};

export default ProfilePage;
