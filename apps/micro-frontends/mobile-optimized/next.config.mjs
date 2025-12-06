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
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      const shellUrl = process.env.NEXT_PUBLIC_SHELL_MFE_URL || 'http://localhost:3011';
      config.plugins.push(
        new NextFederationPlugin({
          name: 'mobile',
          filename: 'static/chunks/remoteEntry.js',
          exposes: { './Dashboard': './src/components/Dashboard.tsx' },
          remotes: {
            shell: `shell@${shellUrl}/_next/static/chunks/remoteEntry.js`,
          },
          shared: {
            react: { singleton: true },
            'react-dom': { singleton: true },
            '@chakra-ui/react': { singleton: true },
            '@emotion/react': { singleton: true },
            '@emotion/styled': { singleton: true },
            'framer-motion': { singleton: true },
          },
        })
      );
    }
    return config;
  },
};

export default nextConfig;



