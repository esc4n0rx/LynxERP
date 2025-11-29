'use client';

import { useState, useEffect } from 'react';
import { ModulesAPI, Module, CreateModuleData, UpdateModuleData } from '@/lib/api/modules';
import { useSessionStore } from '@/store/session';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface ModuleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module?: Module | null;
  parentModule?: Module | null;
  onSuccess?: () => void;
}

export function ModuleFormModal({
  open,
  onOpenChange,
  module,
  parentModule,
  onSuccess,
}: ModuleFormModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    descricao: '',
    icone: '',
    rota: '',
    ordem: 0,
    ativo: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useSessionStore();
  const { toast } = useToast();

  const isEditing = !!module;

  useEffect(() => {
    if (module) {
      setFormData({
        nome: module.nome,
        slug: module.slug,
        descricao: module.descricao || '',
        icone: module.icone || '',
        rota: module.rota || '',
        ordem: module.ordem,
        ativo: module.ativo,
      });
    } else {
      setFormData({
        nome: '',
        slug: '',
        descricao: '',
        icone: '',
        rota: '',
        ordem: 0,
        ativo: true,
      });
    }
  }, [module, open]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-gerar slug baseado no nome
    if (field === 'nome' && !isEditing) {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    if (!formData.nome || !formData.slug) {
      toast({
        title: 'Erro',
        description: 'Nome e slug são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEditing && module) {
        const updateData: UpdateModuleData = {
          nome: formData.nome,
          slug: formData.slug,
          descricao: formData.descricao || undefined,
          icone: formData.icone || undefined,
          rota: formData.rota || undefined,
          ordem: formData.ordem,
          ativo: formData.ativo,
        };

        await ModulesAPI.updateModule(token, module.uuid, updateData);

        toast({
          title: 'Módulo atualizado',
          description: 'O módulo foi atualizado com sucesso',
        });
      } else {
        const createData: CreateModuleData = {
          parent_uuid: parentModule?.uuid,
          nome: formData.nome,
          slug: formData.slug,
          descricao: formData.descricao || undefined,
          icone: formData.icone || undefined,
          rota: formData.rota || undefined,
          ordem: formData.ordem,
          ativo: formData.ativo,
        };

        await ModulesAPI.createModule(token, createData);

        toast({
          title: 'Módulo criado',
          description: 'O módulo foi criado com sucesso',
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar módulo',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-neutral-900 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Editar Módulo' : 'Novo Módulo'}
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            {isEditing
              ? 'Atualize as informações do módulo'
              : parentModule
              ? `Criar submódulo em "${parentModule.nome}"`
              : 'Criar novo módulo principal'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-neutral-300">
                Nome *
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Ex: Cadastros"
                className="bg-neutral-950 border-neutral-800 text-white"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-neutral-300">
                Slug *
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="Ex: cadastros"
                className="bg-neutral-950 border-neutral-800 text-white font-mono text-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-neutral-300">
              Descrição
            </Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              placeholder="Descrição do módulo"
              className="bg-neutral-950 border-neutral-800 text-white resize-none"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="icone" className="text-neutral-300">
                Ícone (Lucide)
              </Label>
              <Input
                id="icone"
                value={formData.icone}
                onChange={(e) => handleChange('icone', e.target.value)}
                placeholder="Ex: database, users, package"
                className="bg-neutral-950 border-neutral-800 text-white"
                disabled={isSubmitting}
              />
              <p className="text-xs text-neutral-500">
                Ver ícones em{' '}
                <a
                  href="https://lucide.dev/icons"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-neutral-400"
                >
                  lucide.dev
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rota" className="text-neutral-300">
                Rota
              </Label>
              <Input
                id="rota"
                value={formData.rota}
                onChange={(e) => handleChange('rota', e.target.value)}
                placeholder="Ex: /cadastros"
                className="bg-neutral-950 border-neutral-800 text-white font-mono text-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ordem" className="text-neutral-300">
                Ordem
              </Label>
              <Input
                id="ordem"
                type="number"
                value={formData.ordem}
                onChange={(e) => handleChange('ordem', parseInt(e.target.value) || 0)}
                placeholder="0"
                className="bg-neutral-950 border-neutral-800 text-white"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ativo" className="text-neutral-300">
                Status
              </Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => handleChange('ativo', checked)}
                  disabled={isSubmitting}
                />
                <span className="text-sm text-neutral-400">
                  {formData.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? (
                'Atualizar'
              ) : (
                'Criar Módulo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
