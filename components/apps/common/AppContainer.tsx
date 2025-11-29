import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AppContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function AppContainer({ children, title, description, className }: AppContainerProps) {
  return (
    <div className="container mx-auto space-y-6 p-6 md:p-8">
      {(title || description) && (
        <div className="space-y-1">
          {title && <h1 className="text-2xl font-bold text-white">{title}</h1>}
          {description && <p className="text-neutral-400">{description}</p>}
        </div>
      )}
      <Card className={cn("border-neutral-800 bg-neutral-900 p-6", className)}>
        {children}
      </Card>
    </div>
  );
}
