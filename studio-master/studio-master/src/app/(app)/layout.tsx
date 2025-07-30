
"use client";

import * as React from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AuthProvider } from '@/app/(app)/auth-provider';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <main className="flex-1 flex flex-col items-center py-8 px-2 sm:px-4 md:px-6">
            <div className="container w-full max-w-screen-2xl">
              {children}
            </div>
          </main>
        </div>
      </AuthProvider>
  );
}
