'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link'; // Import Link for navigation
import MDEditor from '@uiw/react-md-editor'; // Import MDEditor
import { req } from '@/utils/RequestConfig'; // Import req
import { AxiosError } from 'axios'; // Import AxiosError
import { Pagination } from 'antd'; // Import Pagination

interface Blog {
  bid: number;
  title: string;
  content: string;
  num_view: number;
  create_time: string;
}

export default function Home() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // Current page state
  const [totalBlogs, setTotalBlogs] = useState(0); // Total blogs count
  const pageSize = 4; // Blogs per page

  useEffect(() => {
    const fetchBlogs = () => {
      setLoading(true);
      req({
        url: `/api/blogs?page=${currentPage}&limit=${pageSize}`,
        method: 'GET',
      })
        .then(({ data }) => {
          setBlogs(data.blogs);
          setTotalBlogs(data.totalBlogs);
        })
        .catch((e: unknown) => {
          console.error('Error fetching blogs:', e);
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
    fetchBlogs();
  }, [currentPage]); // Re-fetch blogs when currentPage changes

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading)
    return (
      <div className="p-5 text-[#333] dark:text-white">Loading blogs...</div>
    );
  if (error) return <div className="p-5 text-red-500">Error: {error}</div>;
  if (blogs.length === 0 && totalBlogs === 0)
    // Check totalBlogs as well
    return (
      <div className="p-5 text-[#333] dark:text-white">No blogs found.</div>
    );

  return (
    <div className="p-5 text-[#333] dark:text-white">
      {blogs.map((blog) => (
        <div
          key={blog.bid}
          className="block mb-5 pb-4 border-b border-gray-200 no-underline text-inherit transition-colors duration-200"
        >
          <div className="text-xs text-gray-500 clearfix">
            <Link
              href={`/blog/${blog.bid}`}
              className="text-lg font-bold mb-1 float-left text-blue-500 border-b-2 border-blue-500 border-solid"
            >
              {blog.title}
            </Link>
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
          <MDEditor.Markdown
            source={blog.content}
            style={{ whiteSpace: 'pre-wrap', background: 'transparent' }}
            className="text-[#333] dark:text-white"
          />
        </div>
      ))}
      {totalBlogs > pageSize && (
        <div className="mt-8 flex justify-center">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalBlogs}
            onChange={handlePageChange}
            showSizeChanger={false} // Disable page size changer
          />
        </div>
      )}
    </div>
  );
}
