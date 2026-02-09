import type { Metadata } from 'next';
import './globals.css';
import { FilterProvider } from '@/components/providers/FilterProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';

export const metadata: Metadata = {
  title: 'MHC Rounds Dashboard',
  description: 'Healthcare facility rounds monitoring dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <FilterProvider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </FilterProvider>
      </body>
    </html>
  );
}
