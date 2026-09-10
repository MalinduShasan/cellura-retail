import './globals.css';

export const metadata = {
  title: 'Cellura Retail | Premium Smartphone Commerce',
  description: 'Mobile-first smartphone catalog and inventory platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}