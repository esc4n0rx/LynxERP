import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  status?: 'ok' | 'warning' | 'error';
}

export const StatsCard = ({ label, value, icon: Icon, status = 'ok' }: StatsCardProps) => {
  const statusColors = {
    ok: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };

  return (
    <div className="flex items-center gap-3 rounded-xl bg-neutral-950 p-4">
      <div className={`rounded-lg bg-neutral-800 p-2 ${statusColors[status]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="font-medium text-white">{value}</p>
      </div>
    </div>
  );
};
