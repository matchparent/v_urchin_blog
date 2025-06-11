const prod = process.env.NODE_ENV === 'production';

const nextConfig = {
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/antd/ },
      { message: /antd v5 support React is 16 ~ 18/ },
    ];
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: prod ? 'https' : 'http',
        hostname: prod ? 'yourdomain.vercel.app' : 'localhost',
        port: prod ? '' : '3000',
        pathname: '/api/**',
      },
    ],
  },
};
export default nextConfig;
