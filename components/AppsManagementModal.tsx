'use client';

import { useState, useEffect } from 'react';
import { AppsAPI, App } from '@/lib/api/apps';
import { useSessionStore } from '@/store/session';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, RefreshCw, Power, PowerOff } from 'lucide-react';
import * as Icons from 'lucide-react';

type LucideIcon = keyof typeof Icons;

function getIconComponent(iconName?: string) {
  if (!iconName) return Icons.Box;

  const iconKey = iconName
    .split('-')
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('') as LucideIcon;

  return Icons[iconKey] || Icons.Box;
}

interface AppsManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppsManagementModal({ open, onOpenChange }: AppsManagementModalProps) {
  const [apps, setApps] = useState<App[]>([]);
  const [filteredApps, setFilteredApps] = useState<App[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRediscovering, setIsRediscovering] = useState(false);
  const { token } = useSessionStore();
  const { toast } = useToast();

  const fetchApps = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await AppsAPI.getApps(token, true);
      setApps(response.apps);
      setFilteredApps(response.apps);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar apps',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchApps();
    }
  }, [open, token]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = apps.filter(
        (app) =>
          app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.internal_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredApps(filtered);
    } else {
      setFilteredApps(apps);
    }
  }, [searchQuery, apps]);

  const handleToggleApp = async (app: App) => {
    if (!token) return;

    try {
      if (app.enabled) {
        await AppsAPI.deactivateApp(token, app.internal_code);
        toast({
          title: 'App desativado',
          description: `${app.name} foi desativado com sucesso`,
        });
      } else {
        const response = await AppsAPI.activateApp(token, app.internal_code);
        toast({
          title: 'App ativado',
          description: `${app.name} foi ativado com ${response.routes_loaded} rotas`,
        });
      }

      await fetchApps();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar status do app',
        variant: 'destructive',
      });
    }
  };

  const handleRediscover = async () => {
    if (!token) return;

    try {
      setIsRediscovering(true);
      const response = await AppsAPI.rediscoverApps(token);
      toast({
        title: 'Redescoberta concluída',
        description: `Descobertos: ${response.stats.discovered}, Registrados: ${response.stats.registered}, Atualizados: ${response.stats.updated}`,
      });

      await fetchApps();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao redescobrir apps',
        variant: 'destructive',
      });
    } finally {
      setIsRediscovering(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-neutral-900 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-white">Gerenciamento de Apps</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Descubra, ative ou desative apps do sistema
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Buscar apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-neutral-950 border-neutral-800 text-white"
            />
          </div>
          <Button
            onClick={handleRediscover}
            disabled={isRediscovering}
            variant="outline"
            className="gap-2"
          >
            {isRediscovering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Redescobrir
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <p className="text-neutral-400">Carregando apps...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-neutral-400">
                {searchQuery ? 'Nenhum app encontrado' : 'Nenhum app disponível'}
              </p>
            </div>
          ) : (
            filteredApps.map((app) => {
              const IconComponent = getIconComponent(app.icon);

              return (
                <Card
                  key={app.internal_code}
                  className="border-neutral-800 bg-neutral-950 p-4 flex items-center gap-4"
                >
                  <div className="rounded-lg bg-neutral-900 p-2">
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white truncate">{app.name}</h4>
                      <Badge
                        variant={app.enabled ? 'default' : 'secondary'}
                        className={
                          app.enabled
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-neutral-800 text-neutral-400'
                        }
                      >
                        {app.enabled ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 font-mono">{app.internal_code}</p>
                    {app.description && (
                      <p className="text-sm text-neutral-400 mt-1 line-clamp-1">
                        {app.description}
                      </p>
                    )}
                    <p className="text-xs text-neutral-500 mt-1">
                      {app.routes_count} rotas • v{app.version}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleToggleApp(app)}
                    variant={app.enabled ? 'outline' : 'default'}
                    size="sm"
                    className="gap-2 shrink-0"
                  >
                    {app.enabled ? (
                      <>
                        <PowerOff className="h-4 w-4" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4" />
                        Ativar
                      </>
                    )}
                  </Button>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
