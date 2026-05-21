import type { Metadata } from 'next';
import './globals.css';
import { AnimatedBackground } from '../components/AnimatedBackground';

export const metadata: Metadata = {
  title: 'Subscription Manager — Track Your Spending',
  description: 'AI-powered subscription tracking and analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Grotesk:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* suppressHydrationWarning prevents false positives from browser extensions injecting attributes */}
      <body suppressHydrationWarning>
        <AnimatedBackground />
        {children}
      </body>
    </html>
  );
}
