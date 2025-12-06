import { NextFederationPlugin } from '@module-federation/nextjs-mf';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/_next/static/chunks/remoteEntry.js',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      const shellUrl = process.env.NEXT_PUBLIC_SHELL_MFE_URL || 'http://localhost:3011';
      config.plugins.push(
        new NextFederationPlugin({
          name: 'wellness',
          filename: 'static/chunks/remoteEntry.js',
          exposes: {
            './Dashboard': './src/components/Dashboard.tsx'
          },
          remotes: {
            shell: `shell@${shellUrl}/_next/static/chunks/remoteEntry.js`,
          },
          shared: {
            react: { singleton: true, requiredVersion: false },
            'react-dom': { singleton: true, requiredVersion: false },
            '@chakra-ui/react': { singleton: true, requiredVersion: false },
            '@emotion/react': { singleton: true, requiredVersion: false },
            '@emotion/styled': { singleton: true, requiredVersion: false },
            'framer-motion': { singleton: true, requiredVersion: false },
          },
        })
      );
    }
    return config;
  },
};

export default nextConfig;


