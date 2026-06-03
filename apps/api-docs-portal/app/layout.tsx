import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Medi-Aide API Documentation',
  description: 'Enterprise Healthcare Platform API Documentation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
