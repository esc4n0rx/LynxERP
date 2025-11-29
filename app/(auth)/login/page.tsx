'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/session';
import { BlurBackground } from '@/components/BlurBackground';
import { StatsCard } from '@/components/StatsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Database, Server, Package, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function LoginPage() {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [showSessionConflict, setShowSessionConflict] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useSessionStore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }

    fetch('/api/health')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(() => setSystemStatus({ status: 'error', service: 'Unknown', version: '1.0.0' }));
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent, action?: 'new_session' | 'invalidate_previous') => {
    e.preventDefault();

    if (!loginInput || !password) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await login(loginInput, password, action);

      if (response.session_conflict) {
        setShowSessionConflict(true);
        toast({
          title: 'Sessão Ativa Detectada',
          description: `Você possui ${response.active_sessions || 1} sessão(ões) ativa(s). Escolha como prosseguir.`,
          variant: 'default',
        });
      } else if (response.success) {
        toast({
          title: 'Login realizado',
          description: 'Bem-vindo ao Lynx ERP',
        });
        router.push('/');
      } else {
        toast({
          title: 'Erro de autenticação',
          description: response.message || 'Credenciais inválidas',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao conectar com o servidor',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionAction = (action: 'new_session' | 'invalidate_previous') => {
    setShowSessionConflict(false);
    handleSubmit(new Event('submit') as any, action);
  };

  return (
    <>
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <BlurBackground />

        <Card className="w-full max-w-md rounded-2xl border-neutral-800 bg-neutral-900/70 p-8 backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white">Lynx</h1>
            <p className="mt-1 text-sm font-medium uppercase tracking-wider text-neutral-400">
              Enterprise Resource Planning
            </p>
          </div>

          <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
            <div>
              <Label htmlFor="login" className="text-neutral-300">
                Login / Email
              </Label>
              <Input
                id="login"
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="admin"
                disabled={isLoading}
                className="mt-1.5 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-neutral-300">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="mt-1.5 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black hover:bg-neutral-200 disabled:opacity-50"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-8 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Status do Sistema
            </p>

            <StatsCard
              label={systemStatus?.service || 'Backend'}
              value={systemStatus?.status === 'healthy' ? 'Online' : 'Verificando...'}
              icon={Server}
              status={systemStatus?.status === 'healthy' ? 'ok' : 'warning'}
            />

            <StatsCard
              label="Build"
              value={systemStatus?.version || '1.0.0'}
              icon={Package}
              status="ok"
            />
          </div>

          <div className="mt-6 text-center text-xs text-neutral-500">
            <p>Credenciais padrão:</p>
            <p className="mt-1 font-mono">admin / senha123</p>
          </div>
        </Card>
      </div>

      <AlertDialog open={showSessionConflict} onOpenChange={setShowSessionConflict}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Sessão Ativa Detectada
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Você já possui uma sessão ativa. Como deseja prosseguir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-neutral-800 text-white hover:bg-neutral-700 border-neutral-700">
              Cancelar
            </AlertDialogCancel>
            <Button
              onClick={() => handleSessionAction('new_session')}
              variant="outline"
              className="bg-neutral-800 text-white hover:bg-neutral-700 border-neutral-700"
            >
              Criar Nova Sessão
            </Button>
            <AlertDialogAction
              onClick={() => handleSessionAction('invalidate_previous')}
              className="bg-white text-black hover:bg-neutral-200"
            >
              Encerrar Sessão Anterior
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
