import { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
}

interface TabFormContainerProps {
  tabs: TabItem[];
  defaultTab?: string;
  className?: string;
}

export function TabFormContainer({ tabs, defaultTab, className }: TabFormContainerProps) {
  return (
    <Tabs defaultValue={defaultTab || tabs[0]?.value} className={cn("w-full", className)}>
      <TabsList className="grid w-full bg-neutral-900 border border-neutral-800" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="text-neutral-400 data-[state=active]:text-white data-[state=active]:bg-neutral-800"
          >
            <div className="flex items-center gap-2">
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </div>
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          <Card className="border-neutral-800 bg-neutral-900 p-6">
            {tab.content}
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
