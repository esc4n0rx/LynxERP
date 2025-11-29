'use client';

import { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/session';
import { useToast } from '@/hooks/use-toast';
import { LogsAPI, LogEntry, LogsSummary, LogsFilters } from '@/lib/api/logs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Search, AlertCircle, Info, AlertTriangle, Bug, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogsManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LOG_LEVEL_CONFIG = {
  DEBUG: { color: 'text-neutral-400', bg: 'bg-neutral-800', icon: Bug },
  INFO: { color: 'text-blue-400', bg: 'bg-blue-950', icon: Info },
  WARNING: { color: 'text-yellow-400', bg: 'bg-yellow-950', icon: AlertTriangle },
  ERROR: { color: 'text-red-400', bg: 'bg-red-950', icon: AlertCircle },
  CRITICAL: { color: 'text-red-600', bg: 'bg-red-900', icon: Zap },
};

export function LogsManagementModal({ open, onOpenChange }: LogsManagementModalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<LogsSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const [filters, setFilters] = useState<LogsFilters>({
    limit: 50,
    offset: 0,
  });

  const { token } = useSessionStore();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // Limpar dados ao mudar de aba
      setLogs([]);
      setSummary([]);

      if (activeTab === 'all') {
        fetchLogs();
      } else if (activeTab === 'errors') {
        fetchRecentErrors();
      } else if (activeTab === 'summary') {
        fetchSummary();
      }
    }
  }, [open, activeTab]);

  const fetchLogs = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await LogsAPI.getLogs(token, filters);
      setLogs(response.logs || []);
    } catch (error: any) {
      setLogs([]);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao buscar logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentErrors = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await LogsAPI.getRecentErrors(token, 50);
      setLogs(response.logs || []);
    } catch (error: any) {
      setLogs([]);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao buscar erros recentes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await LogsAPI.getSummary(token);
      setSummary(response.summary || []);
    } catch (error: any) {
      setSummary([]);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao buscar resumo',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'all') {
      fetchLogs();
    } else if (activeTab === 'errors') {
      fetchRecentErrors();
    } else if (activeTab === 'summary') {
      fetchSummary();
    }
  };

  const handleApplyFilters = () => {
    fetchLogs();
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Gerenciamento de Logs</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos os Logs</TabsTrigger>
            <TabsTrigger value="errors">Erros Recentes</TabsTrigger>
            <TabsTrigger value="summary">Resumo</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="flex-1 flex flex-col overflow-hidden space-y-4">
            {/* Filtros */}
            <div className="grid gap-4 sm:grid-cols-4 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
              <div className="space-y-2">
                <Label className="text-neutral-300">App Code</Label>
                <Input
                  value={filters.app_code || ''}
                  onChange={(e) => setFilters({ ...filters, app_code: e.target.value || undefined })}
                  placeholder="Ex: vendas-pedidos"
                  className="bg-neutral-950 border-neutral-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-300">Nível</Label>
                <Select
                  value={filters.level || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, level: value === 'all' ? undefined : value as any })}
                >
                  <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
                    <SelectItem value="all" className="text-white focus:bg-neutral-800">Todos</SelectItem>
                    <SelectItem value="DEBUG" className="text-white focus:bg-neutral-800">DEBUG</SelectItem>
                    <SelectItem value="INFO" className="text-white focus:bg-neutral-800">INFO</SelectItem>
                    <SelectItem value="WARNING" className="text-white focus:bg-neutral-800">WARNING</SelectItem>
                    <SelectItem value="ERROR" className="text-white focus:bg-neutral-800">ERROR</SelectItem>
                    <SelectItem value="CRITICAL" className="text-white focus:bg-neutral-800">CRITICAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-300">Limite</Label>
                <Input
                  type="number"
                  value={filters.limit || 50}
                  onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) || 50 })}
                  className="bg-neutral-950 border-neutral-800 text-white"
                />
              </div>

              <div className="flex items-end">
                <Button onClick={handleApplyFilters} className="w-full gap-2">
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </div>

            {/* Lista de Logs */}
            <div className="flex-1 overflow-auto border border-neutral-800 rounded-lg">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                  <p className="text-neutral-400">Carregando logs...</p>
                </div>
              ) : !logs || logs.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-neutral-400">Nenhum log encontrado</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800">
                  {logs.map((log) => {
                    const config = LOG_LEVEL_CONFIG[log.level];
                    const Icon = config.icon;
                    return (
                      <div key={log.uuid} className="p-4 hover:bg-neutral-900/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg shrink-0", config.bg)}>
                            <Icon className={cn("h-4 w-4", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn("font-semibold text-sm", config.color)}>
                                {log.level}
                              </span>
                              {log.app_code && (
                                <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                                  {log.app_code}
                                </span>
                              )}
                              <span className="text-xs text-neutral-500 ml-auto">
                                {formatTimestamp(log.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-white break-words">{log.message}</p>
                            {log.user_name && (
                              <p className="text-xs text-neutral-400 mt-1">
                                Usuário: {log.user_name}
                              </p>
                            )}
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs text-neutral-400 cursor-pointer hover:text-neutral-300">
                                  Metadados
                                </summary>
                                <pre className="text-xs text-neutral-400 mt-1 p-2 bg-neutral-950 rounded overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="errors" className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <p className="text-neutral-400">Carregando erros...</p>
              </div>
            ) : !logs || logs.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-neutral-400">Nenhum erro encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-lg">
                {logs.map((log) => {
                  const config = LOG_LEVEL_CONFIG[log.level];
                  const Icon = config.icon;
                  return (
                    <div key={log.uuid} className="p-4 hover:bg-neutral-900/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg shrink-0", config.bg)}>
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("font-semibold text-sm", config.color)}>
                              {log.level}
                            </span>
                            {log.app_code && (
                              <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                                {log.app_code}
                              </span>
                            )}
                            <span className="text-xs text-neutral-500 ml-auto">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-white break-words">{log.message}</p>
                          {log.user_name && (
                            <p className="text-xs text-neutral-400 mt-1">
                              Usuário: {log.user_name}
                            </p>
                          )}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-neutral-400 cursor-pointer hover:text-neutral-300">
                                Metadados
                              </summary>
                              <pre className="text-xs text-neutral-400 mt-1 p-2 bg-neutral-950 rounded overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <p className="text-neutral-400">Carregando resumo...</p>
              </div>
            ) : !summary || summary.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-neutral-400">Nenhum dado disponível</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {summary.map((item) => (
                  <div
                    key={item.app_code}
                    className="p-4 border border-neutral-800 rounded-lg bg-neutral-900"
                  >
                    <h3 className="font-semibold text-white mb-3">{item.app_code}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-400">Total</span>
                        <span className="font-medium text-white">{item.total_logs}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-red-400">Errors</span>
                        <span className="font-medium text-red-400">{item.errors}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-yellow-400">Warnings</span>
                        <span className="font-medium text-yellow-400">{item.warnings}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-400">Info</span>
                        <span className="font-medium text-blue-400">{item.info}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-400">Debug</span>
                        <span className="font-medium text-neutral-400">{item.debug}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
