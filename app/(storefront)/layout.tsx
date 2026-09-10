import '@/app/globals.css';

export const metadata = {
  title: 'Cellura Retail | Premium Smartphone Commerce',
  description: 'Ultra-fast retail storefront and inventory platform',
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