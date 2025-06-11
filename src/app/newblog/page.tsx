'use client';

import MDEditor, { commands } from '@uiw/react-md-editor';
import { useState } from 'react';
import { Input, Button, Modal, message } from 'antd';
import { useSession } from 'next-auth/react';
import { req } from '@/utils/RequestConfig';
import { AxiosError } from 'axios';

export default function BlogPage() {
  const [value, setValue] = useState('**Hello world!!!**');
  const [isPublishModalVisible, setIsPublishModalVisible] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [messageApi, contextHolder] = message.useMessage();
  const { data: session } = useSession();

  const handlePublish = () => {
    setIsPublishModalVisible(true);
  };

  const handleConfirmPublish = () => {
    if (!articleTitle.trim()) {
      messageApi.error('Article title cannot be empty!');
      return;
    }
    if (!value.trim()) {
      messageApi.error('Article content cannot be empty!');
      return;
    }

    if (!session?.user?.id) {
      messageApi.error('User not logged in. Please log in to publish.');
      return;
    }

    req({
      url: '/api/blog',
      method: 'POST',
      data: {
        uid: session.user.id,
        title: articleTitle,
        content: value,
        status: 1,
      },
    })
      .then(({ data }) => {
        if (data.success) {
          messageApi.success('Article published successfully!');
          setIsPublishModalVisible(false);
          setArticleTitle('');
          setValue('**Hello world!!!**');
        } else {
          messageApi.error(
            `Failed to publish article: ${data.error || 'Unknown error'}`
          );
        }
      })
      .catch((error: unknown) => {
        console.error('Error publishing article:', error);
        const axiosError = error as AxiosError<{ error: string }>;
        messageApi.error(
          axiosError.response?.data?.error ||
            axiosError.message ||
            'An unexpected error occurred during publishing.'
        );
      });
  };

  const handleCancelPublish = () => {
    setIsPublishModalVisible(false);
    setArticleTitle('');
  };

  const publishCommand = {
    name: 'publish',
    keyCommand: 'publish',
    buttonProps: { 'aria-label': 'publish' },
    icon: (
      <span
        onClick={handlePublish}
        style={{
          padding: '0 8px',
          height: '28px',
          fontSize: '14px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
        }}
      >
        Publish
      </span>
    ),
  };

  return (
    <div className="ch">
      {contextHolder}
      <MDEditor
        value={value}
        onChange={(val) => setValue(val || '')}
        height="100%"
        commands={[...commands.getCommands(), publishCommand]}
      />

      <Modal
        title="Publish Blog"
        open={isPublishModalVisible}
        onOk={handleConfirmPublish}
        onCancel={handleCancelPublish}
        footer={[
          <Button key="back" onClick={handleCancelPublish}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleConfirmPublish}>
            Publish
          </Button>,
        ]}
      >
        <Input
          placeholder="Enter title"
          value={articleTitle}
          onChange={(e) => setArticleTitle(e.target.value)}
          style={{ marginBottom: '20px' }}
        />
      </Modal>
    </div>
  );
}
