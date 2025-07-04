'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import MDEditor from '@uiw/react-md-editor';
import { req } from '@/utils/RequestConfig';
import { AxiosError } from 'axios';

interface Blog {
  bid: number;
  title: string;
  content: string;
  num_view: number;
  create_time: string;
}

export default function MyBlogs() {
  const { data: session, status } = useSession();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return; // Wait for session to load

    if (!session?.user?.id) {
      setError('User not logged in.');
      setLoading(false);
      return;
    }

    const fetchMyBlogs = () => {
      req({
        url: `/api/blogs?uid=${session.user.id}`,
        method: 'GET',
      })
        .then(({ data }) => {
          setBlogs(data.blogs || []);
        })
        .catch((e: unknown) => {
          console.error('Error fetching my blogs:', e);
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

    fetchMyBlogs();
  }, [session, status]);

  if (loading)
    return (
      <div className="p-5 text-[#333] dark:text-white">Loading my blogs...</div>
    );
  if (error) return <div className="p-5 text-red-500">Error: {error}</div>;
  if (blogs.length === 0)
    return (
      <div className="p-5 text-[#333] dark:text-white">No blogs found.</div>
    );

  return (
    <div className="p-5 text-[#333] dark:text-white">
      <h1 className="text-2xl font-bold mb-5">My Blogs</h1>
      {blogs.map((blog) => (
        <Link
          key={blog.bid}
          href={`/blog/${blog.bid}`}
          className="block mb-5 pb-1 border-b border-gray-200 no-underline text-inherit transition-colors duration-200 relative"
        >
          <div className="text-xs text-gray-500 clearfix">
            <h2 className="text-lg font-bold mb-1 float-left text-[#333] dark:text-white">
              {blog.title}
            </h2>
            <span className="float-right mt-2 text-[#333] dark:text-white">
              {new Date(blog.create_time).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
              })}
            </span>
            <span className="mr-8 float-right mt-2 text-[#333] dark:text-white">
              Views: {blog.num_view}
            </span>
          </div>
          <div className="h-[200px] overflow-hidden relative">
            <MDEditor.Markdown
              source={blog.content}
              style={{
                whiteSpace: 'pre-wrap',
                background:
                  typeof window !== 'undefined' &&
                  window.matchMedia &&
                  window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? '#666'
                    : '#aaa',
                height: '100%',
              }}
              className="text-[#333] dark:text-white h-full"
            />
            <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-white dark:to-zinc-900/90" />
          </div>
        </Link>
      ))}
    </div>
  );
}
