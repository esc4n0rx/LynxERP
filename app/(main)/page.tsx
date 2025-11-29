'use client';

import { useEffect, useState } from 'react';
import { useTabsStore } from '@/store/tabs';
import { useSessionStore } from '@/store/session';
import { ModulesAPI, Module } from '@/lib/api/modules';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppCard } from '@/components/AppCard';
import { SubheaderTabs } from '@/components/SubheaderTabs';
import { Edit, Plus, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ModuleFormModal } from '@/components/ModuleFormModal';
import { AppLoader } from '@/components/apps/AppLoader';

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

function ModuleCard({
  module,
  isMaster,
  level = 0,
  onEdit,
}: {
  module: Module;
  isMaster: boolean;
  level?: number;
  onEdit?: (module: Module) => void;
}) {
  const { openTab } = useTabsStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = getIconComponent(module.icone);

  const hasChildren = (module.children && module.children.length > 0) ||
                      (module.apps && module.apps.length > 0);

  const handleAppClick = (appCode: string, appName: string, appIcon?: string) => {
    openTab(appCode, appName, appIcon || 'Box');
  };

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(module);
  };

  // Tamanhos baseados no nível
  const cardPadding = level === 0 ? 'p-6' : level === 1 ? 'p-4' : 'p-3';
  const iconSize = level === 0 ? 'h-6 w-6' : level === 1 ? 'h-5 w-5' : 'h-4 w-4';
  const iconPadding = level === 0 ? 'p-3' : level === 1 ? 'p-2.5' : 'p-2';
  const titleSize = level === 0 ? 'text-lg' : level === 1 ? 'text-base' : 'text-sm';
  const descSize = level === 0 ? 'text-sm' : 'text-xs';

  return (
    <Card className={cn(
      "border-neutral-800 bg-neutral-900 relative transition-colors",
      cardPadding,
      level > 0 && "bg-neutral-900/60"
    )}>
      {isMaster && level === 0 && (
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-neutral-800"
          onClick={handleEdit}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}

      <div
        className={cn(
          "flex items-center gap-3",
          hasChildren && "cursor-pointer",
          level === 0 ? "mb-4" : "mb-2"
        )}
        onClick={handleToggle}
      >
        <div className={cn("rounded-xl bg-neutral-800", iconPadding)}>
          <IconComponent className={cn("text-white", iconSize)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold text-white", titleSize)}>{module.nome}</h3>
          {module.descricao && (
            <p className={cn("text-neutral-400 truncate", descSize)}>{module.descricao}</p>
          )}
        </div>
        {hasChildren && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-neutral-800 shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {isExpanded && (
        <>
          {module.apps && module.apps.length > 0 && (
            <div className={cn(
              "grid gap-2 mb-3",
              level === 0 ? "sm:grid-cols-2" : "grid-cols-1"
            )}>
              {module.apps.map((app) => (
                <AppCard
                  key={app.internal_code}
                  title={app.name}
                  description={app.description || ''}
                  icon={getIconComponent(app.icon)}
                  onClick={() => handleAppClick(app.internal_code, app.name, app.icon)}
                />
              ))}
            </div>
          )}

          {module.children && module.children.length > 0 && (
            <div className={cn(
              "space-y-2",
              level === 0 && "mt-4"
            )}>
              {module.children.map((child) => (
                <ModuleCard
                  key={child.uuid}
                  module={child}
                  isMaster={isMaster}
                  level={level + 1}
                  onEdit={onEdit}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function HomeContent() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const { token, user } = useSessionStore();
  const { toast } = useToast();
  const isMaster = user?.role === 'master';

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setShowModuleModal(true);
  };

  const handleCloseModal = (open: boolean) => {
    setShowModuleModal(open);
    if (!open) {
      setEditingModule(null);
    }
  };

  const fetchModules = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await ModulesAPI.getModulesTree(token);
      setModules(response.tree);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar módulos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [token, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto flex h-96 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-neutral-400">Carregando módulos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-6 md:p-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Módulos do Sistema</h2>
          {isMaster && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowModuleModal(true)}
            >
              <Plus className="h-4 w-4" />
              Novo Módulo
            </Button>
          )}
        </div>

        {modules.length === 0 ? (
          <Card className="border-neutral-800 bg-neutral-900 p-12 text-center">
            <p className="text-neutral-400">Nenhum módulo encontrado</p>
            {isMaster && (
              <p className="mt-2 text-sm text-neutral-500">
                Clique em "Novo Módulo" para começar
              </p>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {modules.map((module) => (
              <ModuleCard
                key={module.uuid}
                module={module}
                isMaster={isMaster}
                level={0}
                onEdit={handleEditModule}
              />
            ))}
          </div>
        )}
      </section>

      <ModuleFormModal
        open={showModuleModal}
        onOpenChange={handleCloseModal}
        module={editingModule}
        onSuccess={fetchModules}
      />
    </div>
  );
}

export default function HomePage() {
  const { tabs, activeTabId } = useTabsStore();

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Mostra home se não há tab ativa ou se a tab é 'home'
  const shouldShowHome = !activeTab || activeTab.componentKey === 'home';

  return (
    <>
      <div className="fixed top-16 left-0 right-0 z-30">
        <SubheaderTabs />
      </div>
      <div className="pt-[120px]">
        {shouldShowHome ? (
          <HomeContent />
        ) : (
          <AppLoader internalCode={activeTab.componentKey} />
        )}
      </div>
    </>
  );
}
