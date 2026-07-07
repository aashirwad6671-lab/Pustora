import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pustora Admin Panel — Control Centre',
  description: 'Internal admin dashboard for Pustora quick-commerce platform — manage products, orders, inventory, and users.',
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
