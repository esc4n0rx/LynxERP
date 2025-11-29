'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/session';
import { Header } from '@/components/Header';
import { SubheaderTabs } from '@/components/SubheaderTabs';
import { FooterBar } from '@/components/FooterBar';
import { BlurBackground } from '@/components/BlurBackground';
import { Toaster } from '@/components/ui/toaster';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, validateSession } = useSessionStore();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      if (!isAuthenticated) {
        router.push('/login');
        setIsValidating(false);
        return;
      }

      const isValid = await validateSession();

      if (!isValid) {
        router.push('/login');
      }

      setIsValidating(false);
    };

    checkSession();
  }, [isAuthenticated, router, validateSession]);

  if (!isAuthenticated || isValidating) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white">
      <BlurBackground />
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <SubheaderTabs />
        <main className="flex-1">
          {children}
        </main>
        <FooterBar />
      </div>
      <Toaster />
    </div>
  );
}
