'use client';

import { useTabsStore } from '@/store/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Home,
  Plus,
  X,
  ArrowLeft,
  Download,
  Info,
  Search,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { exportToCsv } from '@/lib/export';

interface SubheaderTabsProps {
  onExport?: () => any[] | null;
}

export const SubheaderTabs = ({ onExport }: SubheaderTabsProps) => {
  const { tabs, activeTabId, activateTab, closeTab, openTab, goBack } = useTabsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const { toast } = useToast();

  const handleExport = () => {
    if (!onExport) {
      toast({
        title: 'Exportação indisponível',
        description: 'Esta aba não possui dados para exportar.',
        variant: 'destructive',
      });
      return;
    }

    const data = onExport();
    if (!data || data.length === 0) {
      toast({
        title: 'Sem dados',
        description: 'Não há dados para exportar.',
      });
      return;
    }

    const success = exportToCsv(data, `export-${Date.now()}`);
    if (success) {
      toast({
        title: 'Exportado com sucesso',
        description: `${data.length} registros exportados para CSV.`,
      });
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      setSystemStatus({ error: 'Failed to fetch' });
    }
  };

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        toast({
          title: 'Nova aba',
          description: 'Use a busca ou clique em um aplicativo para abrir.',
        });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab?.canClose) {
          closeTab(activeTabId);
        }
      }
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        activateTab('home');
      }
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [activeTabId, tabs]);

  return (
    <>
      <div className="sticky top-16 z-30 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/80">
        <div className="flex items-center gap-2 px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => activateTab('home')}
            title="Home (Alt+H)"
            className="h-9 w-9 text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            <Home className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => toast({ title: 'Nova aba', description: 'Use a busca ou clique em um aplicativo.' })}
            title="Nova Aba (Ctrl+T)"
            className="h-9 w-9 text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const activeTab = tabs.find(t => t.id === activeTabId);
              if (activeTab?.canClose) {
                closeTab(activeTabId);
              }
            }}
            title="Fechar Aba (Ctrl+W)"
            disabled={!tabs.find(t => t.id === activeTabId)?.canClose}
            className="h-9 w-9 text-neutral-300 hover:bg-neutral-800 hover:text-white disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            title="Voltar (Alt+←)"
            className="h-9 w-9 text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleExport}
            title="Exportar CSV"
            className="h-9 w-9 text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setAboutOpen(true);
              fetchSystemStatus();
            }}
            title="Sobre"
            className="h-9 w-9 text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            <Info className="h-4 w-4" />
          </Button>

          <div className="relative ml-2 flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              id="search-input"
              type="text"
              placeholder="Buscar aplicativos... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 bg-neutral-800 border-neutral-700 pl-10 text-sm text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:ring-neutral-600"
            />
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto px-4 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => activateTab(tab.id)}
              className={`group relative flex items-center gap-2 rounded-t-xl px-4 py-2 text-sm font-medium transition-colors ${
                activeTabId === tab.id
                  ? 'bg-neutral-950 text-white'
                  : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300'
              }`}
            >
              {tab.title}
              {tab.canClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-neutral-700 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </button>
          ))}
        </div>
      </div>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Lynx ERP</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Sistema de Gestão Empresarial
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-400">Versão: 1.0.0</p>
              <p className="text-sm text-neutral-400">Stack: Next.js 14 + TypeScript + Tailwind CSS + Zustand</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Atalhos de Teclado</h4>
              <div className="space-y-1 text-sm text-neutral-400">
                <p><kbd className="rounded bg-neutral-800 px-2 py-0.5">Alt+H</kbd> Home</p>
                <p><kbd className="rounded bg-neutral-800 px-2 py-0.5">Ctrl+T</kbd> Nova Aba</p>
                <p><kbd className="rounded bg-neutral-800 px-2 py-0.5">Ctrl+W</kbd> Fechar Aba</p>
                <p><kbd className="rounded bg-neutral-800 px-2 py-0.5">Alt+←</kbd> Voltar</p>
                <p><kbd className="rounded bg-neutral-800 px-2 py-0.5">Ctrl+K</kbd> Buscar</p>
              </div>
            </div>

            {systemStatus && (
              <div className="rounded-xl bg-neutral-950 p-4">
                <h4 className="mb-2 font-medium">Status do Sistema</h4>
                <pre className="text-xs text-neutral-400 overflow-auto">
                  {JSON.stringify(systemStatus, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
