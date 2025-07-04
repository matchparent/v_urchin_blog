'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MDEditor from '@uiw/react-md-editor';
import Link from 'next/link';
import { req } from '@/utils/RequestConfig';
import { AxiosError } from 'axios';
import { Input, Button, message, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface Blog {
  bid: number;
  title: string;
  content: string;
  num_view: number;
  create_time: string;
}

interface CommentUser {
  uid: string;
  nickname: string | null;
}

interface ReplyComment {
  rid: number;
  uid: string;
  bid: number;
  content: string;
  rbid: number;
  rtuid: string;
  create_time: string;
  userNickname: string;
  replyToUserNickname?: string;
}

interface TopLevelComment {
  rid: number;
  uid: string;
  bid: number;
  content: string;
  rbid: null;
  rtuid: null;
  create_time: string;
  userNickname: string;
  replies: ReplyComment[];
}

export default function BlogDetailPage() {
  const params = useParams();
  const bid = params.bid as string;
  const { data: session } = useSession();
  const router = useRouter();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<TopLevelComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState<string>('');
  const [replyTo, setReplyTo] = useState<{
    rbid: number | null;
    rtuid: string | null;
    rtuname: string | null;
  }>({ rbid: null, rtuid: null, rtuname: null });
  const [postingComment, setPostingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [highlightInput, setHighlightInput] = useState(false);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!bid) {
      setLoading(false);
      return;
    }

    fetchBlog();
    fetchComments();
  }, [bid]);

  const fetchBlog = () => {
    req({
      url: `/api/blog/${bid}`,
      method: 'GET',
    })
      .then(({ data }) => {
        setBlog(data);
      })
      .catch((e: unknown) => {
        console.error('Error fetching blog:', e);
        const axiosError = e as AxiosError<{ message: string }>;
        setError(
          axiosError.response?.data?.message ||
            axiosError.message ||
            'An unknown error occurred'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchComments = () => {
    req({
      url: `/api/comments?bid=${bid}`,
      method: 'GET',
    })
      .then(({ data }) => {
        setComments(data);
      })
      .catch((e: unknown) => {
        console.error('Error fetching comments:', e);
        messageApi.error('Failed to load comments.');
      });
  };

  const handleReplyClick = (comment: TopLevelComment | ReplyComment) => {
    const isTopLevel = 'replies' in comment; // Check if it's a TopLevelComment
    setReplyTo({
      rbid: isTopLevel ? comment.rid : comment.rbid,
      rtuid: comment.uid,
      rtuname: comment.userNickname ?? comment.uid ?? null,
    });
    setCommentContent(''); // Clear current content when replying
    commentInputRef.current?.focus();

    // Activate highlight for 3 seconds
    setHighlightInput(true);
    setTimeout(() => {
      setHighlightInput(false);
    }, 3000);
  };

  const handleCancelReply = () => {
    setReplyTo({ rbid: null, rtuid: null, rtuname: null });
    setCommentContent('');
  };

  const handlePostComment = () => {
    if (!session?.user?.id) {
      router.push(`/blog/${bid}?login=true`);
      return;
    }
    if (!commentContent.trim()) {
      messageApi.warning('Comment content cannot be empty.');
      return;
    }

    setPostingComment(true);

    const payload = {
      bid: parseInt(bid),
      content: commentContent.trim(),
      rbid: replyTo.rbid,
      rtuid: replyTo.rtuid,
      uid: session?.user?.id,
    };

    req({
      url: '/api/comments',
      method: 'POST',
      data: payload,
    })
      .then(() => {
        messageApi.success('Comment posted successfully!');
        setCommentContent('');
        setReplyTo({ rbid: null, rtuid: null, rtuname: null });
        fetchComments(); // Refresh comments
      })
      .catch((e: unknown) => {
        console.error('Error posting comment:', e);
        messageApi.error('Failed to post comment.');
      })
      .finally(() => {
        setPostingComment(false);
      });
  };

  const renderComment = (comment: TopLevelComment | ReplyComment) => (
    <div
      key={comment.rid}
      className="mb-4 p-3 border rounded-md bg-gray-50 dark:bg-gray-800"
    >
      <div className="flex items-center mb-2">
        <Avatar
          src={comment.uid ? `/api/portrait?uid=${comment.uid}` : undefined}
          icon={<UserOutlined />}
          className="mr-4"
          onError={() => {
            console.error(`Failed to load avatar for user: ${comment.uid}`);
            return true;
          }}
        />
        <span className="font-bold text-base text-[#333] dark:text-white ml-2">
          {comment.userNickname || 'Anonymous'}
        </span>
        {comment.rtuid && comment.replyToUserNickname && (
          <span className="ml-2 text-gray-500 text-sm">
            reply to{' '}
            <span className="font-bold">
              {comment.replyToUserNickname || 'Anonymous'}
            </span>
            :
          </span>
        )}
        <span className="ml-auto text-xs text-gray-500">
          {dayjs(comment.create_time).format('YYYY-MM-DD HH:mm')}
        </span>
      </div>
      <p className="text-[#333] dark:text-white text-sm ml-10">
        {comment.content}
      </p>
      <div className="ml-10 mt-2">
        <Button
          type="link"
          size="small"
          onClick={() => handleReplyClick(comment)}
        >
          Reply
        </Button>
      </div>
    </div>
  );

  if (loading)
    return (
      <div className="p-5 text-[#333] dark:text-white">Loading blog...</div>
    );
  if (error) return <div className="p-5 text-red-500">Error: {error}</div>;
  if (!blog)
    return (
      <div className="p-5 text-[#333] dark:text-white">Blog not found.</div>
    );

  return (
    <div className="p-5 text-[#333] dark:text-white">
      {contextHolder}
      <style jsx global>{`
        @keyframes blink-border {
          0% {
            border-color: #d9d9d9;
          }
          50% {
            border-color: #1890ff;
          }
          100% {
            border-color: #d9d9d9;
          }
        }
        .comment-input-blink.ant-input-focused {
          animation: none !important;
        }
        /* .comment-input-blink { */
        /*   border-width: 1px; */
        /*   border-style: solid; */
        /* } */
        .comment-input-blink-active {
          animation: blink-border 1.5s infinite alternate;
          border-width: 1px;
          border-style: solid;
        }
        .ant-input-outlined {
          border-width: 5px;
        }
      `}</style>
      <Link
        href="/"
        className="text-blue-500 hover:underline mb-4 inline-block"
      >
        &larr; Back to Blogs
      </Link>
      <h1 className="text-2xl font-bold mb-2">{blog.title}</h1>
      <div className="flex items-center text-xs text-gray-500 mb-4">
        <span className="mr-4">Views: {blog.num_view}</span>
        <span>
          Published:{' '}
          {new Date(blog.create_time).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
          })}
        </span>
      </div>
      <MDEditor.Markdown
        source={blog.content}
        style={{ whiteSpace: 'pre-wrap', background: 'transparent' }}
        className="text-[#333] dark:text-white"
      />

      <hr className="my-4" />

      <h2 className="text-xl font-bold mb-4">Comments</h2>
      <div className="mb-6">
        <TextArea
          ref={commentInputRef}
          rows={4}
          placeholder={
            replyTo.rtuname
              ? `Reply to ${replyTo.rtuname}:`
              : 'Leave your comments here ... '
          }
          maxLength={200} // Increased max length for comments
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          className={highlightInput ? 'comment-input-blink-active' : ''}
        />
        <div className="mt-2 flex justify-between items-center">
          <Button
            type="primary"
            onClick={handlePostComment}
            loading={postingComment}
          >
            Post Comment
          </Button>
          {replyTo.rtuname && (
            <Button type="default" onClick={handleCancelReply} className="ml-2">
              Cancel Reply
            </Button>
          )}
        </div>
      </div>

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="text-gray-500">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.rid} className="mb-6">
              {renderComment(comment)}
              {comment.replies.length > 0 && (
                <div className="ml-8 mt-4 border-l pl-4 border-gray-200 dark:border-gray-700">
                  {comment.replies.map((reply) => renderComment(reply))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
