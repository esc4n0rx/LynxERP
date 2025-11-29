'use client';

import { Suspense } from 'react';
import { loadApp } from '@/lib/appLoader';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface AppLoaderProps {
  internalCode: string;
}

function AppLoadingFallback() {
  return (
    <div className="container mx-auto p-6">
      <Card className="border-neutral-800 bg-neutral-900 p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-neutral-400">Carregando aplicativo...</p>
        </div>
      </Card>
    </div>
  );
}

export function AppLoader({ internalCode }: AppLoaderProps) {
  const AppComponent = loadApp(internalCode);

  return (
    <Suspense fallback={<AppLoadingFallback />}>
      <AppComponent />
    </Suspense>
  );
}
