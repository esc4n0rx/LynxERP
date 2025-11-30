'use client';

import { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/session';
import { useToast } from '@/hooks/use-toast';
import { DepositAPI, Deposit, CreateDepositData, UCDimensoes } from '@/lib/api/wm-deposit';
import { EmpresaAPI } from '@/lib/api/empresa';
import { AppContainer } from '@/components/apps/common/AppContainer';
import { TabFormContainer, TabItem } from '@/components/apps/common/TabFormContainer';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Settings,
  Box,
  Thermometer,
  FileText,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

// Enums conforme a documentação
const STATUS_OPTIONS = [
  { value: 'ATIVO', label: 'Ativo', color: 'bg-green-500/20 text-green-400' },
  { value: 'INATIVO', label: 'Inativo', color: 'bg-neutral-500/20 text-neutral-400' },
  { value: 'EM_MANUTENCAO', label: 'Em Manutenção', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'FECHADO', label: 'Fechado', color: 'bg-red-500/20 text-red-400' },
];

const TIPO_DEPOSITO_OPTIONS = [
  { value: 'VIRTUAL', label: 'Virtual' },
  { value: 'MAT_PRIMA', label: 'Matéria Prima' },
  { value: 'EMBALAGEM', label: 'Embalagem' },
  { value: 'GERAL', label: 'Geral' },
  { value: 'STAGING', label: 'Staging' },
  { value: 'QUARANTINE', label: 'Quarentena' },
  { value: 'RETURNS', label: 'Devoluções' },
];

const CATEGORIA_OPTIONS = [
  { value: 'BLOCOS', label: 'Blocos' },
  { value: 'PALLET', label: 'Pallet' },
  { value: 'PADRAO', label: 'Padrão' },
  { value: 'FIFO_BIN', label: 'FIFO Bin' },
  { value: 'AUTOCRANE', label: 'Autocrane' },
];

const TIPO_UC_OPTIONS = [
  { value: 'E1', label: 'E1' },
  { value: 'E2', label: 'E2' },
  { value: 'E3', label: 'E3' },
  { value: 'PALLET', label: 'Pallet' },
  { value: 'CAIXA', label: 'Caixa' },
  { value: 'ROL', label: 'Rol' },
];

const FLOOR_TYPE_OPTIONS = [
  { value: 'CONCRETE', label: 'Concreto' },
  { value: 'GRASS', label: 'Grama' },
  { value: 'RAISED', label: 'Elevado' },
  { value: 'ANTI_SLIP', label: 'Anti-derrapante' },
];

const SERIAL_NUMBER_OPTIONS = [
  { value: 'NONE', label: 'Nenhum' },
  { value: 'BY_LOT', label: 'Por Lote' },
  { value: 'BY_UNIT', label: 'Por Unidade' },
];

const POLITICA_OPTIONS = [
  { value: 'FIFO', label: 'FIFO (First In, First Out)' },
  { value: 'FEFO', label: 'FEFO (First Expired, First Out)' },
  { value: 'LIFO', label: 'LIFO (Last In, First Out)' },
  { value: 'CUSTOM', label: 'Customizado' },
];

const PUTAWAY_OPTIONS = [
  { value: 'NEAREST', label: 'Mais Próximo' },
  { value: 'BY_SIZE', label: 'Por Tamanho' },
  { value: 'BY_PRODUCT_FAMILY', label: 'Por Família de Produto' },
  { value: 'BY_TURNOVER', label: 'Por Rotatividade' },
];

const PICKING_OPTIONS = [
  { value: 'LIFO_SLOT', label: 'LIFO Slot' },
  { value: 'FIFO_SLOT', label: 'FIFO Slot' },
  { value: 'WAVE', label: 'Wave' },
  { value: 'ZONE_PICK', label: 'Zone Pick' },
];

const CYCLE_COUNT_OPTIONS = [
  { value: 'DAILY', label: 'Diário' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'ANNUAL', label: 'Anual' },
];

const NIVEL_SEGURANCA_OPTIONS = [
  { value: 'BAIXO', label: 'Baixo' },
  { value: 'MEDIO', label: 'Médio' },
  { value: 'ALTO', label: 'Alto' },
];

export default function WMDepositApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [filteredDeposits, setFilteredDeposits] = useState<Deposit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const [depositToDelete, setDepositToDelete] = useState<Deposit | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateDepositData>({
    codigo_deposito: '',
    nome: '',
    status: 'ATIVO',
    descricao: '',
    empresa_id: '',
    codigo_interno_erp: '',
    tipo_deposito: 'GERAL',
    categoria: '',
    zona_logistica: [],
    permite_estoque_negativo: false,
    administrado_por_uc: false,
    tipo_uc: '',
    uc_mista: false,
    uc_capacidade_max_peso_kg: 0,
    uc_dimensoes: { altura_mm: 0, largura_mm: 0, profundidade_mm: 0 },
    area_total_m2: 0,
    altura_maxima_m: 0,
    peso_maximo_por_posicao_kg: 0,
    numero_max_posicoes: 0,
    tipos_racks_suportados: [],
    controle_temp: false,
    temperatura_min_c: 0,
    temperatura_max_c: 0,
    controle_umidade: false,
    floor_type: '',
    aceita_produtos_perigosos: false,
    classes_hazardous_allowed: [],
    categoria_produtos_permitidos: [],
    serial_number_management: 'NONE',
    batch_required: false,
    politica_fifo_lifo_fefo: 'FIFO',
    estrategia_putaway_default: '',
    estrategia_picking_default: '',
    nivel_seguro_estoque_minimo_por_sku: 0,
    replenishment_lead_time_days: 0,
    cycle_count_frequency: '',
    cross_docking_allowed: false,
    nivel_seguranca: '',
    require_qc_on_receipt: false,
    retention_time_days_for_failed_qc: 0,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { token } = useSessionStore();
  const { toast } = useToast();

  useEffect(() => {
    loadEmpresa();
  }, [token]);

  useEffect(() => {
    if (empresaId) {
      loadDeposits();
    }
  }, [empresaId, token]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = deposits.filter(
        (dep) =>
          dep.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dep.codigo_deposito.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDeposits(filtered);
    } else {
      setFilteredDeposits(deposits);
    }
  }, [searchTerm, deposits]);

  const loadEmpresa = async () => {
    if (!token) return;

    try {
      const empresas = await EmpresaAPI.getEmpresas(token);
      if (empresas.length > 0) {
        setEmpresaId(empresas[0].uuid);
      } else {
        toast({
          title: 'Atenção',
          description: 'Nenhuma empresa cadastrada. Configure uma empresa primeiro.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error loading empresa:', error);
    }
  };

  const loadDeposits = async () => {
    if (!token || !empresaId) return;

    try {
      setIsLoading(true);
      const data = await DepositAPI.getDeposits(token, empresaId);
      setDeposits(data);
      setFilteredDeposits(data);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar depósitos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDimensoesChange = (field: keyof UCDimensoes, value: number) => {
    setFormData((prev) => ({
      ...prev,
      uc_dimensoes: {
        ...prev.uc_dimensoes,
        [field]: value,
      },
    }));
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.codigo_deposito || formData.codigo_deposito.length < 3) {
      newErrors.codigo_deposito = 'Código deve ter pelo menos 3 caracteres';
    }

    if (!formData.nome || formData.nome.length < 3) {
      newErrors.nome = 'Nome deve ter pelo menos 3 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenFormDialog = async (deposit?: Deposit) => {
    if (!empresaId) {
      toast({
        title: 'Erro',
        description: 'Empresa não identificada',
        variant: 'destructive',
      });
      return;
    }

    if (deposit) {
      try {
        setIsLoadingDetails(true);
        setIsFormDialogOpen(true);

        const depositDetails = await DepositAPI.getDeposit(token!, deposit.uuid);
        setEditingDeposit(depositDetails);

        setFormData({
          codigo_deposito: depositDetails.codigo_deposito,
          nome: depositDetails.nome,
          status: depositDetails.status,
          descricao: depositDetails.descricao || '',
          empresa_id: depositDetails.empresa_id,
          codigo_interno_erp: depositDetails.codigo_interno_erp || '',
          tipo_deposito: depositDetails.tipo_deposito,
          categoria: depositDetails.categoria || '',
          zona_logistica: depositDetails.zona_logistica || [],
          permite_estoque_negativo: depositDetails.permite_estoque_negativo,
          administrado_por_uc: depositDetails.administrado_por_uc,
          tipo_uc: depositDetails.tipo_uc || '',
          uc_mista: depositDetails.uc_mista || false,
          uc_capacidade_max_peso_kg: depositDetails.uc_capacidade_max_peso_kg || 0,
          uc_dimensoes: depositDetails.uc_dimensoes || { altura_mm: 0, largura_mm: 0, profundidade_mm: 0 },
          area_total_m2: depositDetails.area_total_m2 || 0,
          altura_maxima_m: depositDetails.altura_maxima_m || 0,
          peso_maximo_por_posicao_kg: depositDetails.peso_maximo_por_posicao_kg || 0,
          numero_max_posicoes: depositDetails.numero_max_posicoes || 0,
          tipos_racks_suportados: depositDetails.tipos_racks_suportados || [],
          controle_temp: depositDetails.controle_temp,
          temperatura_min_c: depositDetails.temperatura_min_c || 0,
          temperatura_max_c: depositDetails.temperatura_max_c || 0,
          controle_umidade: depositDetails.controle_umidade,
          floor_type: depositDetails.floor_type || '',
          aceita_produtos_perigosos: depositDetails.aceita_produtos_perigosos,
          classes_hazardous_allowed: depositDetails.classes_hazardous_allowed || [],
          categoria_produtos_permitidos: depositDetails.categoria_produtos_permitidos || [],
          serial_number_management: depositDetails.serial_number_management,
          batch_required: depositDetails.batch_required,
          politica_fifo_lifo_fefo: depositDetails.politica_fifo_lifo_fefo,
          estrategia_putaway_default: depositDetails.estrategia_putaway_default || '',
          estrategia_picking_default: depositDetails.estrategia_picking_default || '',
          nivel_seguro_estoque_minimo_por_sku: depositDetails.nivel_seguro_estoque_minimo_por_sku || 0,
          replenishment_lead_time_days: depositDetails.replenishment_lead_time_days || 0,
          cycle_count_frequency: depositDetails.cycle_count_frequency || '',
          cross_docking_allowed: depositDetails.cross_docking_allowed,
          nivel_seguranca: depositDetails.nivel_seguranca || '',
          require_qc_on_receipt: depositDetails.require_qc_on_receipt,
          retention_time_days_for_failed_qc: depositDetails.retention_time_days_for_failed_qc || 0,
        });
      } catch (error: any) {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao carregar detalhes do depósito',
          variant: 'destructive',
        });
        setIsFormDialogOpen(false);
      } finally {
        setIsLoadingDetails(false);
      }
    } else {
      setEditingDeposit(null);
      setFormData({
        ...formData,
        empresa_id: empresaId,
      });
      setIsFormDialogOpen(true);
    }
  };

  const handleCloseFormDialog = () => {
    setIsFormDialogOpen(false);
    setEditingDeposit(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;

    if (!validate()) {
      toast({
        title: 'Erro de validação',
        description: 'Verifique os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      if (editingDeposit) {
        await DepositAPI.updateDeposit(token, editingDeposit.uuid, formData);
        toast({
          title: 'Depósito atualizado',
          description: 'O depósito foi atualizado com sucesso',
        });
      } else {
        await DepositAPI.createDeposit(token, formData);
        toast({
          title: 'Depósito criado',
          description: 'O depósito foi criado com sucesso',
        });
      }

      handleCloseFormDialog();
      loadDeposits();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar depósito',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (deposit: Deposit) => {
    setDepositToDelete(deposit);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!token || !depositToDelete) return;

    try {
      await DepositAPI.deleteDeposit(token, depositToDelete.uuid);
      toast({
        title: 'Depósito deletado',
        description: 'O depósito foi deletado com sucesso',
      });
      setIsDeleteDialogOpen(false);
      setDepositToDelete(null);
      loadDeposits();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar depósito',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_OPTIONS.find((s) => s.value === status);
    if (!config) return null;
    return (
      <Badge variant="outline" className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <AppContainer>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-neutral-400">Carregando depósitos...</p>
        </div>
      </AppContainer>
    );
  }

  if (!empresaId) {
    return (
      <AppContainer>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Package className="h-12 w-12 text-neutral-600" />
          <p className="text-neutral-400">Nenhuma empresa cadastrada</p>
          <p className="text-sm text-neutral-500">Configure uma empresa para gerenciar depósitos</p>
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer
      title="Gerenciar Depósitos"
      description="Configure e gerencie os depósitos do WMS"
    >
      <div className="space-y-6">
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-neutral-950 border-neutral-800 text-white"
            />
          </div>
          <Button onClick={() => handleOpenFormDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Depósito
          </Button>
        </div>

        {filteredDeposits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400">
              {searchTerm ? 'Nenhum depósito encontrado' : 'Nenhum depósito cadastrado'}
            </p>
            {!searchTerm && (
              <p className="text-sm text-neutral-500 mt-2">
                Clique em "Novo Depósito" para criar seu primeiro depósito
              </p>
            )}
          </div>
        ) : (
          <div className="border border-neutral-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800 hover:bg-neutral-800/50">
                  <TableHead className="text-neutral-300">Código</TableHead>
                  <TableHead className="text-neutral-300">Nome</TableHead>
                  <TableHead className="text-neutral-300">Tipo</TableHead>
                  <TableHead className="text-neutral-300">Status</TableHead>
                  <TableHead className="text-neutral-300">Categoria</TableHead>
                  <TableHead className="text-neutral-300 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeposits.map((deposit) => (
                  <TableRow
                    key={deposit.uuid}
                    className="border-neutral-800 hover:bg-neutral-800/30"
                  >
                    <TableCell className="text-white font-mono text-sm font-medium">
                      {deposit.codigo_deposito}
                    </TableCell>
                    <TableCell className="text-white">
                      {deposit.nome}
                      {deposit.descricao && (
                        <p className="text-xs text-neutral-400 mt-1">{deposit.descricao}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-neutral-300 text-sm">
                      {TIPO_DEPOSITO_OPTIONS.find((t) => t.value === deposit.tipo_deposito)?.label || deposit.tipo_deposito}
                    </TableCell>
                    <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                    <TableCell className="text-neutral-300 text-sm">
                      {deposit.categoria ? (CATEGORIA_OPTIONS.find((c) => c.value === deposit.categoria)?.label || deposit.categoria) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenFormDialog(deposit)}
                          className="h-8 w-8 p-0"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(deposit)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          title="Deletar"
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

      {/* Dialog com formulário em tabs */}
      <Dialog open={isFormDialogOpen} onOpenChange={handleCloseFormDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDeposit ? 'Editar Depósito' : 'Novo Depósito'}</DialogTitle>
            <DialogDescription className="text-neutral-400">
              {editingDeposit
                ? 'Atualize as informações do depósito'
                : 'Preencha os dados para criar um novo depósito WMS'}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <TabFormContainer
                tabs={[
                  {
                    value: 'identificacao',
                    label: 'Identificação',
                    icon: <FileText className="h-4 w-4" />,
                    content: (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="codigo_deposito" className="text-neutral-300 text-sm">
                            Código do Depósito *
                          </Label>
                          <Input
                            id="codigo_deposito"
                            value={formData.codigo_deposito}
                            onChange={(e) => handleChange('codigo_deposito', e.target.value)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="DEP-001"
                          />
                          {errors.codigo_deposito && (
                            <p className="text-xs text-red-500">{errors.codigo_deposito}</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="nome" className="text-neutral-300 text-sm">
                            Nome *
                          </Label>
                          <Input
                            id="nome"
                            value={formData.nome}
                            onChange={(e) => handleChange('nome', e.target.value)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="Depósito Central"
                          />
                          {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="status" className="text-neutral-300 text-sm">
                            Status *
                          </Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => handleChange('status', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {STATUS_OPTIONS.map((status) => (
                                <SelectItem
                                  key={status.value}
                                  value={status.value}
                                  className="text-white focus:bg-neutral-800"
                                >
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="codigo_interno_erp" className="text-neutral-300 text-sm">
                            Código Interno ERP
                          </Label>
                          <Input
                            id="codigo_interno_erp"
                            value={formData.codigo_interno_erp}
                            onChange={(e) => handleChange('codigo_interno_erp', e.target.value)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="WH001"
                          />
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
                            placeholder="Descrição do depósito"
                            rows={2}
                          />
                        </div>
                      </div>
                    ),
                  },
                  {
                    value: 'tipos',
                    label: 'Tipos',
                    icon: <Settings className="h-4 w-4" />,
                    content: (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="tipo_deposito" className="text-neutral-300 text-sm">
                            Tipo de Depósito *
                          </Label>
                          <Select
                            value={formData.tipo_deposito}
                            onValueChange={(value) => handleChange('tipo_deposito', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {TIPO_DEPOSITO_OPTIONS.map((tipo) => (
                                <SelectItem
                                  key={tipo.value}
                                  value={tipo.value}
                                  className="text-white focus:bg-neutral-800"
                                >
                                  {tipo.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="categoria" className="text-neutral-300 text-sm">
                            Categoria
                          </Label>
                          <Select
                            value={formData.categoria}
                            onValueChange={(value) => handleChange('categoria', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {CATEGORIA_OPTIONS.map((cat) => (
                                <SelectItem
                                  key={cat.value}
                                  value={cat.value}
                                  className="text-white focus:bg-neutral-800"
                                >
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="permite_estoque_negativo"
                              checked={formData.permite_estoque_negativo}
                              onCheckedChange={(checked) => handleChange('permite_estoque_negativo', checked)}
                            />
                            <Label htmlFor="permite_estoque_negativo" className="text-neutral-300 text-sm cursor-pointer">
                              Permite estoque negativo
                            </Label>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    value: 'uc',
                    label: 'UC/Paletização',
                    icon: <Box className="h-4 w-4" />,
                    content: (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1 sm:col-span-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="administrado_por_uc"
                              checked={formData.administrado_por_uc}
                              onCheckedChange={(checked) => handleChange('administrado_por_uc', checked)}
                            />
                            <Label htmlFor="administrado_por_uc" className="text-neutral-300 text-sm cursor-pointer">
                              Administrado por UC (Unidade de Conservação)
                            </Label>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="tipo_uc" className="text-neutral-300 text-sm">
                            Tipo de UC
                          </Label>
                          <Select
                            value={formData.tipo_uc}
                            onValueChange={(value) => handleChange('tipo_uc', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {TIPO_UC_OPTIONS.map((tipo) => (
                                <SelectItem
                                  key={tipo.value}
                                  value={tipo.value}
                                  className="text-white focus:bg-neutral-800"
                                >
                                  {tipo.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="uc_capacidade_max_peso_kg" className="text-neutral-300 text-sm">
                            Capacidade Máx. Peso (kg)
                          </Label>
                          <Input
                            id="uc_capacidade_max_peso_kg"
                            type="number"
                            step="0.01"
                            value={formData.uc_capacidade_max_peso_kg}
                            onChange={(e) => handleChange('uc_capacidade_max_peso_kg', parseFloat(e.target.value) || 0)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="1000.00"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="uc_mista"
                              checked={formData.uc_mista}
                              onCheckedChange={(checked) => handleChange('uc_mista', checked)}
                            />
                            <Label htmlFor="uc_mista" className="text-neutral-300 text-sm cursor-pointer">
                              UC Mista (permite diferentes tipos)
                            </Label>
                          </div>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-neutral-300 text-sm">Dimensões UC (mm)</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Input
                                type="number"
                                placeholder="Altura"
                                value={formData.uc_dimensoes?.altura_mm}
                                onChange={(e) => handleDimensoesChange('altura_mm', parseInt(e.target.value) || 0)}
                                className="bg-neutral-950 border-neutral-800 text-white h-9"
                              />
                              <p className="text-xs text-neutral-500 mt-1">Altura</p>
                            </div>
                            <div>
                              <Input
                                type="number"
                                placeholder="Largura"
                                value={formData.uc_dimensoes?.largura_mm}
                                onChange={(e) => handleDimensoesChange('largura_mm', parseInt(e.target.value) || 0)}
                                className="bg-neutral-950 border-neutral-800 text-white h-9"
                              />
                              <p className="text-xs text-neutral-500 mt-1">Largura</p>
                            </div>
                            <div>
                              <Input
                                type="number"
                                placeholder="Profundidade"
                                value={formData.uc_dimensoes?.profundidade_mm}
                                onChange={(e) => handleDimensoesChange('profundidade_mm', parseInt(e.target.value) || 0)}
                                className="bg-neutral-950 border-neutral-800 text-white h-9"
                              />
                              <p className="text-xs text-neutral-500 mt-1">Profundidade</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    value: 'armazenamento',
                    label: 'Armazenamento',
                    icon: <Package className="h-4 w-4" />,
                    content: (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="area_total_m2" className="text-neutral-300 text-sm">
                            Área Total (m²)
                          </Label>
                          <Input
                            id="area_total_m2"
                            type="number"
                            step="0.01"
                            value={formData.area_total_m2}
                            onChange={(e) => handleChange('area_total_m2', parseFloat(e.target.value) || 0)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="5000.00"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="altura_maxima_m" className="text-neutral-300 text-sm">
                            Altura Máxima (m)
                          </Label>
                          <Input
                            id="altura_maxima_m"
                            type="number"
                            step="0.01"
                            value={formData.altura_maxima_m}
                            onChange={(e) => handleChange('altura_maxima_m', parseFloat(e.target.value) || 0)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="12.00"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="peso_maximo_por_posicao_kg" className="text-neutral-300 text-sm">
                            Peso Máx. por Posição (kg)
                          </Label>
                          <Input
                            id="peso_maximo_por_posicao_kg"
                            type="number"
                            step="0.01"
                            value={formData.peso_maximo_por_posicao_kg}
                            onChange={(e) => handleChange('peso_maximo_por_posicao_kg', parseFloat(e.target.value) || 0)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="1500.00"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="numero_max_posicoes" className="text-neutral-300 text-sm">
                            Número Máx. de Posições
                          </Label>
                          <Input
                            id="numero_max_posicoes"
                            type="number"
                            value={formData.numero_max_posicoes}
                            onChange={(e) => handleChange('numero_max_posicoes', parseInt(e.target.value) || 0)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="5000"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <Label htmlFor="tipos_racks" className="text-neutral-300 text-sm">
                            Tipos de Racks Suportados
                          </Label>
                          <Input
                            id="tipos_racks"
                            value={formData.tipos_racks_suportados?.join(', ')}
                            onChange={(e) => handleChange('tipos_racks_suportados', e.target.value.split(',').map(s => s.trim()))}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="PALLET_RACK, DRIVE_IN, CANTILEVER (separados por vírgula)"
                          />
                          <p className="text-xs text-neutral-500">Exemplos: PALLET_RACK, DRIVE_IN, CANTILEVER, PUSH_BACK</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    value: 'ambiente',
                    label: 'Ambiente',
                    icon: <Thermometer className="h-4 w-4" />,
                    content: (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1 sm:col-span-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="controle_temp"
                              checked={formData.controle_temp}
                              onCheckedChange={(checked) => handleChange('controle_temp', checked)}
                            />
                            <Label htmlFor="controle_temp" className="text-neutral-300 text-sm cursor-pointer">
                              Controle de Temperatura
                            </Label>
                          </div>
                        </div>

                        {formData.controle_temp && (
                          <>
                            <div className="space-y-1">
                              <Label htmlFor="temperatura_min_c" className="text-neutral-300 text-sm">
                                Temperatura Mínima (°C)
                              </Label>
                              <Input
                                id="temperatura_min_c"
                                type="number"
                                step="0.1"
                                value={formData.temperatura_min_c}
                                onChange={(e) => handleChange('temperatura_min_c', parseFloat(e.target.value) || 0)}
                                className="bg-neutral-950 border-neutral-800 text-white h-9"
                                placeholder="15.0"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="temperatura_max_c" className="text-neutral-300 text-sm">
                                Temperatura Máxima (°C)
                              </Label>
                              <Input
                                id="temperatura_max_c"
                                type="number"
                                step="0.1"
                                value={formData.temperatura_max_c}
                                onChange={(e) => handleChange('temperatura_max_c', parseFloat(e.target.value) || 0)}
                                className="bg-neutral-950 border-neutral-800 text-white h-9"
                                placeholder="25.0"
                              />
                            </div>
                          </>
                        )}

                        <div className="space-y-1 sm:col-span-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="controle_umidade"
                              checked={formData.controle_umidade}
                              onCheckedChange={(checked) => handleChange('controle_umidade', checked)}
                            />
                            <Label htmlFor="controle_umidade" className="text-neutral-300 text-sm cursor-pointer">
                              Controle de Umidade
                            </Label>
                          </div>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <Label htmlFor="floor_type" className="text-neutral-300 text-sm">
                            Tipo de Piso
                          </Label>
                          <Select
                            value={formData.floor_type}
                            onValueChange={(value) => handleChange('floor_type', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {FLOOR_TYPE_OPTIONS.map((floor) => (
                                <SelectItem
                                  key={floor.value}
                                  value={floor.value}
                                  className="text-white focus:bg-neutral-800"
                                >
                                  {floor.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ),
                  },
                  {
                    value: 'produtos',
                    label: 'Produtos',
                    icon: <ShieldCheck className="h-4 w-4" />,
                    content: (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1 sm:col-span-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="aceita_produtos_perigosos"
                              checked={formData.aceita_produtos_perigosos}
                              onCheckedChange={(checked) => handleChange('aceita_produtos_perigosos', checked)}
                            />
                            <Label htmlFor="aceita_produtos_perigosos" className="text-neutral-300 text-sm cursor-pointer">
                              Aceita Produtos Perigosos
                            </Label>
                          </div>
                        </div>

                        {formData.aceita_produtos_perigosos && (
                          <div className="space-y-1 sm:col-span-2">
                            <Label htmlFor="classes_hazardous" className="text-neutral-300 text-sm">
                              Classes Hazardous Permitidas (ADR)
                            </Label>
                            <Input
                              id="classes_hazardous"
                              value={formData.classes_hazardous_allowed?.join(', ')}
                              onChange={(e) => handleChange('classes_hazardous_allowed', e.target.value.split(',').map(s => s.trim()))}
                              className="bg-neutral-950 border-neutral-800 text-white h-9"
                              placeholder="CLASS_1, CLASS_2, CLASS_3 (separados por vírgula)"
                            />
                          </div>
                        )}

                        <div className="space-y-1 sm:col-span-2">
                          <Label htmlFor="categoria_produtos" className="text-neutral-300 text-sm">
                            Categorias de Produtos Permitidos
                          </Label>
                          <Input
                            id="categoria_produtos"
                            value={formData.categoria_produtos_permitidos?.join(', ')}
                            onChange={(e) => handleChange('categoria_produtos_permitidos', e.target.value.split(',').map(s => s.trim()))}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="ALIMENTOS, QUIMICOS, ELETRONICOS (separados por vírgula)"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="serial_number_management" className="text-neutral-300 text-sm">
                            Gerenciamento de Serial Number
                          </Label>
                          <Select
                            value={formData.serial_number_management}
                            onValueChange={(value) => handleChange('serial_number_management', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {SERIAL_NUMBER_OPTIONS.map((serial) => (
                                <SelectItem
                                  key={serial.value}
                                  value={serial.value}
                                  className="text-white focus:bg-neutral-800"
                                >
                                  {serial.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 h-9 items-end">
                            <Switch
                              id="batch_required"
                              checked={formData.batch_required}
                              onCheckedChange={(checked) => handleChange('batch_required', checked)}
                            />
                            <Label htmlFor="batch_required" className="text-neutral-300 text-sm cursor-pointer">
                              Lote Obrigatório
                            </Label>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    value: 'estrategias',
                    label: 'Estratégias',
                    icon: <BarChart3 className="h-4 w-4" />,
                    content: (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="politica_fifo_lifo_fefo" className="text-neutral-300 text-sm">
                            Política FIFO/LIFO/FEFO *
                          </Label>
                          <Select
                            value={formData.politica_fifo_lifo_fefo}
                            onValueChange={(value) => handleChange('politica_fifo_lifo_fefo', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {POLITICA_OPTIONS.map((pol) => (
                                <SelectItem
                                  key={pol.value}
                                  value={pol.value}
                                  className="text-white focus:bg-neutral-800"
                                >
                                  {pol.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="estrategia_putaway" className="text-neutral-300 text-sm">
                            Estratégia Putaway Padrão
                          </Label>
                          <Select
                            value={formData.estrategia_putaway_default}
                            onValueChange={(value) => handleChange('estrategia_putaway_default', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {PUTAWAY_OPTIONS.map((put) => (
                                <SelectItem
                                  key={put.value}
                                  value={put.value}
                                  className="text-white focus:bg-neutral-800"
                                >
                                  {put.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="estrategia_picking" className="text-neutral-300 text-sm">
                            Estratégia Picking Padrão
                          </Label>
                          <Select
                            value={formData.estrategia_picking_default}
                            onValueChange={(value) => handleChange('estrategia_picking_default', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {PICKING_OPTIONS.map((pick) => (
                                <SelectItem
                                  key={pick.value}
                                  value={pick.value}
                                  className="text-white focus:bg-neutral-800"
                                >
                                  {pick.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="cycle_count_frequency" className="text-neutral-300 text-sm">
                            Frequência de Contagem Cíclica
                          </Label>
                          <Select
                            value={formData.cycle_count_frequency}
                            onValueChange={(value) => handleChange('cycle_count_frequency', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {CYCLE_COUNT_OPTIONS.map((cycle) => (
                                <SelectItem
                                  key={cycle.value}
                                  value={cycle.value}
                                  className="text-white focus:bg-neutral-800"
                                >
                                  {cycle.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="nivel_seguro_estoque" className="text-neutral-300 text-sm">
                            Nível Seguro Estoque Mín. por SKU
                          </Label>
                          <Input
                            id="nivel_seguro_estoque"
                            type="number"
                            step="0.01"
                            value={formData.nivel_seguro_estoque_minimo_por_sku}
                            onChange={(e) => handleChange('nivel_seguro_estoque_minimo_por_sku', parseFloat(e.target.value) || 0)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="10.00"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="replenishment_lead_time" className="text-neutral-300 text-sm">
                            Lead Time Reabastecimento (dias)
                          </Label>
                          <Input
                            id="replenishment_lead_time"
                            type="number"
                            value={formData.replenishment_lead_time_days}
                            onChange={(e) => handleChange('replenishment_lead_time_days', parseInt(e.target.value) || 0)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="7"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="cross_docking_allowed"
                              checked={formData.cross_docking_allowed}
                              onCheckedChange={(checked) => handleChange('cross_docking_allowed', checked)}
                            />
                            <Label htmlFor="cross_docking_allowed" className="text-neutral-300 text-sm cursor-pointer">
                              Cross-Docking Permitido
                            </Label>
                          </div>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <Label htmlFor="nivel_seguranca" className="text-neutral-300 text-sm">
                            Nível de Segurança
                          </Label>
                          <Select
                            value={formData.nivel_seguranca}
                            onValueChange={(value) => handleChange('nivel_seguranca', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {NIVEL_SEGURANCA_OPTIONS.map((nivel) => (
                                <SelectItem
                                  key={nivel.value}
                                  value={nivel.value}
                                  className="text-white focus:bg-neutral-800"
                                >
                                  {nivel.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ),
                  },
                  {
                    value: 'qa',
                    label: 'QA/Qualidade',
                    icon: <CheckCircle2 className="h-4 w-4" />,
                    content: (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1 sm:col-span-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="require_qc_on_receipt"
                              checked={formData.require_qc_on_receipt}
                              onCheckedChange={(checked) => handleChange('require_qc_on_receipt', checked)}
                            />
                            <Label htmlFor="require_qc_on_receipt" className="text-neutral-300 text-sm cursor-pointer">
                              Requer QC no Recebimento
                            </Label>
                          </div>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <Label htmlFor="retention_time" className="text-neutral-300 text-sm">
                            Tempo de Retenção para QC Falho (dias)
                          </Label>
                          <Input
                            id="retention_time"
                            type="number"
                            value={formData.retention_time_days_for_failed_qc}
                            onChange={(e) => handleChange('retention_time_days_for_failed_qc', parseInt(e.target.value) || 0)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="30"
                          />
                          <p className="text-xs text-neutral-500">
                            Dias que produtos com QC falho devem permanecer retidos antes de ação
                          </p>
                        </div>
                      </div>
                    ),
                  },
                ]}
              />

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={handleCloseFormDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>{editingDeposit ? 'Atualizar' : 'Criar Depósito'}</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para deletar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Tem certeza que deseja deletar o depósito <strong>"{depositToDelete?.nome}"</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppContainer>
  );
}
