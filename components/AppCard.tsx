import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AppCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

export const AppCard = ({ title, description, icon: Icon, onClick }: AppCardProps) => {
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer border-neutral-800 bg-neutral-900 p-6 transition-all hover:scale-105 hover:border-neutral-700 hover:bg-neutral-800 hover:shadow-lg"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-neutral-800 p-3 transition-colors group-hover:bg-neutral-700">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-neutral-400">{description}</p>
        </div>
      </div>
    </Card>
  );
};
