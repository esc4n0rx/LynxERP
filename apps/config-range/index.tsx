'use client';

import { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/session';
import { useToast } from '@/hooks/use-toast';
import { RangeAPI, Range, CreateRangeData } from '@/lib/api/range';
import { AppContainer } from '@/components/apps/common/AppContainer';
import { FormSection } from '@/components/apps/common/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Loader2, Plus, Pencil, Trash2, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export default function RangeConfigApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [ranges, setRanges] = useState<Range[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [editingRange, setEditingRange] = useState<Range | null>(null);
  const [rangeToDelete, setRangeToDelete] = useState<Range | null>(null);

  const [formData, setFormData] = useState<CreateRangeData>({
    nome: '',
    codigo_identificador: '',
    descricao: '',
    prefixo: '',
    sulfixo: '',
    numero_inicial: 1,
    numero_final: 1000,
    numero_atual: 1,
    ativo: true,
  });

  const [generateData, setGenerateData] = useState({
    tipo_documento: '',
    quantidade: 5,
    inicio: 1,
    tamanho: 1000,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { token } = useSessionStore();
  const { toast } = useToast();

  useEffect(() => {
    loadRanges();
  }, [token]);

  const loadRanges = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const data = await RangeAPI.getRanges(token);
      setRanges(data);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar ranges',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof CreateRangeData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nome || formData.nome.length < 3) {
      newErrors.nome = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!formData.codigo_identificador || formData.codigo_identificador.length < 3) {
      newErrors.codigo_identificador = 'Código deve ter pelo menos 3 caracteres';
    }

    if (!formData.numero_final || formData.numero_final < 1) {
      newErrors.numero_final = 'Número final deve ser maior que 0';
    }

    if (formData.numero_inicial && formData.numero_final && formData.numero_inicial >= formData.numero_final) {
      newErrors.numero_final = 'Número final deve ser maior que o inicial';
    }

    if (formData.numero_atual !== undefined && formData.numero_atual < (formData.numero_inicial || 0)) {
      newErrors.numero_atual = 'Número atual deve ser maior ou igual ao inicial';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      codigo_identificador: '',
      descricao: '',
      prefixo: '',
      sulfixo: '',
      numero_inicial: 1,
      numero_final: 1000,
      numero_atual: 1,
      ativo: true,
    });
    setErrors({});
    setEditingRange(null);
  };

  const handleOpenDialog = (range?: Range) => {
    if (range) {
      setEditingRange(range);
      setFormData({
        nome: range.nome,
        codigo_identificador: range.codigo_identificador,
        descricao: range.descricao || '',
        prefixo: range.prefixo || '',
        sulfixo: range.sulfixo || '',
        numero_inicial: range.numero_inicial,
        numero_final: range.numero_final,
        numero_atual: range.numero_atual,
        ativo: range.ativo,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    if (!validate()) {
      toast({
        title: 'Erro de validação',
        description: 'Verifique os campos do formulário',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      if (editingRange) {
        // Atualizar - não envia codigo_identificador
        const { codigo_identificador, ...updateData } = formData;
        await RangeAPI.updateRange(token, editingRange.uuid, updateData);
        toast({
          title: 'Range atualizado',
          description: 'O range foi atualizado com sucesso',
        });
      } else {
        await RangeAPI.createRange(token, formData);
        toast({
          title: 'Range criado',
          description: 'O range foi criado com sucesso',
        });
      }

      handleCloseDialog();
      loadRanges();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar range',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (range: Range) => {
    setRangeToDelete(range);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!token || !rangeToDelete) return;

    try {
      await RangeAPI.deleteRange(token, rangeToDelete.uuid);
      toast({
        title: 'Range deletado',
        description: 'O range foi deletado com sucesso',
      });
      setIsDeleteDialogOpen(false);
      setRangeToDelete(null);
      loadRanges();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar range',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateRanges = async () => {
    if (!token) return;

    const { tipo_documento, quantidade, inicio, tamanho } = generateData;

    if (!tipo_documento || quantidade < 1) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos corretamente',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      const promises = [];
      for (let i = 0; i < quantidade; i++) {
        const rangeInicio = inicio + (i * tamanho);
        const rangeFim = rangeInicio + tamanho - 1;

        const data: CreateRangeData = {
          nome: `${tipo_documento} - Range ${i + 1}`,
          codigo_identificador: `${tipo_documento.toUpperCase()}_${i + 1}`,
          descricao: `Range automático para ${tipo_documento}`,
          numero_inicial: rangeInicio,
          numero_final: rangeFim,
          numero_atual: rangeInicio,
          ativo: true,
        };

        promises.push(RangeAPI.createRange(token, data));
      }

      await Promise.all(promises);

      toast({
        title: 'Ranges gerados',
        description: `${quantidade} ranges foram criados com sucesso`,
      });

      setIsGenerateDialogOpen(false);
      setGenerateData({
        tipo_documento: '',
        quantidade: 5,
        inicio: 1,
        tamanho: 1000,
      });
      loadRanges();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao gerar ranges',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppContainer>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-neutral-400">Carregando ranges...</p>
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer
      title="Configuração de Ranges"
      description="Gerencie os intervalos de numeração para documentos e etiquetas"
    >
      <div className="space-y-6">
        <div className="flex gap-3">
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Range
          </Button>
          <Button onClick={() => setIsGenerateDialogOpen(true)} variant="outline" className="gap-2">
            <Zap className="h-4 w-4" />
            Gerar Ranges
          </Button>
        </div>

        {ranges.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400">Nenhum range cadastrado</p>
            <p className="text-sm text-neutral-500 mt-2">
              Clique em "Novo Range" para criar seu primeiro range
            </p>
          </div>
        ) : (
          <div className="border border-neutral-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800 hover:bg-neutral-800/50">
                  <TableHead className="text-neutral-300">Nome</TableHead>
                  <TableHead className="text-neutral-300">Código</TableHead>
                  <TableHead className="text-neutral-300">Prefixo/Sufixo</TableHead>
                  <TableHead className="text-neutral-300">Range</TableHead>
                  <TableHead className="text-neutral-300">Atual</TableHead>
                  <TableHead className="text-neutral-300 text-center">Status</TableHead>
                  <TableHead className="text-neutral-300 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranges.map((range) => (
                  <TableRow
                    key={range.uuid}
                    className="border-neutral-800 hover:bg-neutral-800/30"
                  >
                    <TableCell className="text-white font-medium">
                      {range.nome}
                      {range.descricao && (
                        <p className="text-xs text-neutral-400 mt-1">{range.descricao}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-neutral-300 font-mono text-sm">
                      {range.codigo_identificador}
                    </TableCell>
                    <TableCell className="text-neutral-300 text-sm">
                      {range.prefixo || range.sulfixo ? (
                        <span className="font-mono">
                          {range.prefixo && <span className="text-blue-400">{range.prefixo}</span>}
                          <span className="text-neutral-500">###</span>
                          {range.sulfixo && <span className="text-green-400">{range.sulfixo}</span>}
                        </span>
                      ) : (
                        <span className="text-neutral-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-neutral-300 font-mono text-sm">
                      {range.numero_inicial.toLocaleString()} - {range.numero_final.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-neutral-300 font-mono text-sm">
                      {range.numero_atual.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {range.ativo ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" title="Ativo" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" title="Inativo" />
                        )}
                        {range.em_uso && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                            Em uso
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(range)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(range)}
                          disabled={range.em_uso}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Dialog para criar/editar range */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRange ? 'Editar Range' : 'Novo Range'}</DialogTitle>
            <DialogDescription className="text-neutral-400">
              {editingRange
                ? 'Atualize as informações do range'
                : 'Preencha os dados para criar um novo range de numeração'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="nome" className="text-neutral-300 text-sm">
                  Nome *
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className="bg-neutral-950 border-neutral-800 text-white h-9"
                  placeholder="Ex: Notas Fiscais de Saída"
                />
                {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="codigo_identificador" className="text-neutral-300 text-sm">
                  Código * {editingRange && '(não editável)'}
                </Label>
                <Input
                  id="codigo_identificador"
                  value={formData.codigo_identificador}
                  onChange={(e) => handleChange('codigo_identificador', e.target.value.toUpperCase())}
                  className="bg-neutral-950 border-neutral-800 text-white font-mono h-9"
                  placeholder="Ex: NF_SAIDA"
                  disabled={!!editingRange}
                />
                {errors.codigo_identificador && (
                  <p className="text-xs text-red-500">{errors.codigo_identificador}</p>
                )}
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="descricao" className="text-neutral-300 text-sm">
                  Descrição
                </Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleChange('descricao', e.target.value)}
                  className="bg-neutral-950 border-neutral-800 text-white"
                  placeholder="Descrição detalhada do range"
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="prefixo" className="text-neutral-300 text-sm">
                  Prefixo
                </Label>
                <Input
                  id="prefixo"
                  value={formData.prefixo}
                  onChange={(e) => handleChange('prefixo', e.target.value)}
                  className="bg-neutral-950 border-neutral-800 text-white font-mono h-9"
                  placeholder="Ex: NF-"
                  maxLength={20}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sulfixo" className="text-neutral-300 text-sm">
                  Sufixo
                </Label>
                <Input
                  id="sulfixo"
                  value={formData.sulfixo}
                  onChange={(e) => handleChange('sulfixo', e.target.value)}
                  className="bg-neutral-950 border-neutral-800 text-white font-mono h-9"
                  placeholder="Ex: /2024"
                  maxLength={20}
                />
              </div>

              {(formData.prefixo || formData.sulfixo) && (
                <div className="sm:col-span-2 p-2 bg-neutral-950 border border-neutral-800 rounded">
                  <p className="text-xs text-neutral-400">Preview: <span className="font-mono text-white">{formData.prefixo}<span className="text-neutral-500">00001</span>{formData.sulfixo}</span></p>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="numero_inicial" className="text-neutral-300 text-sm">
                  Número Inicial
                </Label>
                <Input
                  id="numero_inicial"
                  type="number"
                  value={formData.numero_inicial}
                  onChange={(e) => handleChange('numero_inicial', parseInt(e.target.value) || 0)}
                  className="bg-neutral-950 border-neutral-800 text-white h-9"
                  min={0}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="numero_final" className="text-neutral-300 text-sm">
                  Número Final *
                </Label>
                <Input
                  id="numero_final"
                  type="number"
                  value={formData.numero_final}
                  onChange={(e) => handleChange('numero_final', parseInt(e.target.value) || 0)}
                  className="bg-neutral-950 border-neutral-800 text-white h-9"
                  min={1}
                />
                {errors.numero_final && (
                  <p className="text-xs text-red-500">{errors.numero_final}</p>
                )}
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="numero_atual" className="text-neutral-300 text-sm">
                  Número Atual
                </Label>
                <Input
                  id="numero_atual"
                  type="number"
                  value={formData.numero_atual}
                  onChange={(e) => handleChange('numero_atual', parseInt(e.target.value) || 0)}
                  className="bg-neutral-950 border-neutral-800 text-white h-9"
                  min={0}
                />
                {errors.numero_atual && (
                  <p className="text-xs text-red-500">{errors.numero_atual}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => handleChange('ativo', checked)}
              />
              <Label htmlFor="ativo" className="text-neutral-300 cursor-pointer">
                Range ativo
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>{editingRange ? 'Atualizar' : 'Criar Range'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para gerar ranges */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle>Gerar Ranges Automaticamente</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Crie múltiplos ranges de uma vez
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_documento" className="text-neutral-300">
                Tipo de Documento *
              </Label>
              <Input
                id="tipo_documento"
                value={generateData.tipo_documento}
                onChange={(e) =>
                  setGenerateData({ ...generateData, tipo_documento: e.target.value })
                }
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Ex: NFE, ETIQUETA, PEDIDO"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="quantidade" className="text-neutral-300">
                  Quantidade *
                </Label>
                <Input
                  id="quantidade"
                  type="number"
                  value={generateData.quantidade}
                  onChange={(e) =>
                    setGenerateData({ ...generateData, quantidade: parseInt(e.target.value) || 0 })
                  }
                  className="bg-neutral-950 border-neutral-800 text-white"
                  min={1}
                  max={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inicio" className="text-neutral-300">
                  Início
                </Label>
                <Input
                  id="inicio"
                  type="number"
                  value={generateData.inicio}
                  onChange={(e) =>
                    setGenerateData({ ...generateData, inicio: parseInt(e.target.value) || 1 })
                  }
                  className="bg-neutral-950 border-neutral-800 text-white"
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tamanho" className="text-neutral-300">
                  Tamanho
                </Label>
                <Input
                  id="tamanho"
                  type="number"
                  value={generateData.tamanho}
                  onChange={(e) =>
                    setGenerateData({ ...generateData, tamanho: parseInt(e.target.value) || 1000 })
                  }
                  className="bg-neutral-950 border-neutral-800 text-white"
                  min={1}
                />
              </div>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
              <p className="text-xs text-neutral-400 mb-2">Preview dos ranges:</p>
              <div className="space-y-1 text-sm font-mono text-neutral-300">
                {Array.from({ length: Math.min(3, generateData.quantidade) }).map((_, i) => {
                  const inicio = generateData.inicio + i * generateData.tamanho;
                  const fim = inicio + generateData.tamanho - 1;
                  return (
                    <div key={i}>
                      {generateData.tipo_documento || 'DOC'}_{i + 1}: {inicio} - {fim}
                    </div>
                  );
                })}
                {generateData.quantidade > 3 && (
                  <div className="text-neutral-500">... e mais {generateData.quantidade - 3}</div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGenerateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleGenerateRanges} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Gerar {generateData.quantidade} Ranges
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para deletar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Tem certeza que deseja deletar o range "{rangeToDelete?.nome}"?
              {rangeToDelete?.em_uso && (
                <span className="block mt-2 text-red-400 font-medium">
                  Atenção: Este range está em uso e não pode ser deletado.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={rangeToDelete?.em_uso}
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppContainer>
  );
}
