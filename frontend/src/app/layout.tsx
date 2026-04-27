
import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import dynamic from 'next/dynamic';
import '@/styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';

const DynamicClientProviders = dynamic(
  () => import('./ClientProviders').then((mod) => mod.ClientProviders),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Polymarket Copy',
  description: 'Decentralized prediction market built with Next.js and Solidity',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <DynamicClientProviders>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </DynamicClientProviders>
      </body>
    </html>
  );
}