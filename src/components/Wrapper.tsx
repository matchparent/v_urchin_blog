'use client';
import { SessionProvider } from 'next-auth/react';
import UBNav from '@/components/UBNav';

export default function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="mw">
        <UBNav />
        <main>{children}</main>
      </div>
    </SessionProvider>
  );
}
