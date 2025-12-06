import { NextFederationPlugin } from '@module-federation/nextjs-mf';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  webpack: (config, { buildId }) => {
    config.plugins.push(
      new NextFederationPlugin({
        name: 'wellness',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './Dashboard': './src/components/Dashboard.tsx'
        },
        remotes: {
          // Shell is the existing medi-aide-frontend in dev
          shell: `shell@http://localhost:3001/_next/static/chunks/remoteEntry.js`,
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
    return config;
  },
};

export default nextConfig;


