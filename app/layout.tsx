import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Debitinfo.GE — Design Demos & Comments',
  description: 'View design demos and leave pinpoint feedback directly on the page.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased selection:bg-blue-600 selection:text-white bg-slate-900 text-slate-100 h-screen w-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
