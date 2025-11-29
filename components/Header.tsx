'use client';

import { useState } from 'react';
import { useSessionStore } from '@/store/session';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Package, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppsManagementModal } from '@/components/AppsManagementModal';
import { LogsManagementModal } from '@/components/LogsManagementModal';

export const Header = () => {
  const { user, logout } = useSessionStore();
  const router = useRouter();
  const [showAppsModal, setShowAppsModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/80">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Lynx
          </h1>
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            ERP
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-2 transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-700">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-neutral-800 text-sm text-white">
                  {user?.nome?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-neutral-300">
                {user?.nome || 'User'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-neutral-800">
            <DropdownMenuLabel className="text-neutral-300">
              {user?.email || user?.login}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-neutral-800" />
            <DropdownMenuItem className="text-neutral-300 focus:bg-neutral-800 focus:text-white">
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            {(user?.role === 'master' || user?.role === 'admin') && (
              <>
                <DropdownMenuItem
                  onClick={() => setShowAppsModal(true)}
                  className="text-neutral-300 focus:bg-neutral-800 focus:text-white"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Gerenciamento de Apps
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowLogsModal(true)}
                  className="text-neutral-300 focus:bg-neutral-800 focus:text-white"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Gerenciamento de Logs
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator className="bg-neutral-800" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-neutral-300 focus:bg-neutral-800 focus:text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AppsManagementModal open={showAppsModal} onOpenChange={setShowAppsModal} />
      <LogsManagementModal open={showLogsModal} onOpenChange={setShowLogsModal} />
    </header>
  );
};
