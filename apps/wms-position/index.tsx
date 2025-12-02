'use client';

import { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/session';
import { useToast } from '@/hooks/use-toast';
import { PositionAPI, Position, CreatePositionData, PositionDimensoes } from '@/lib/api/wms-position';
import { DepositAPI, Deposit } from '@/lib/api/wm-deposit';
import { EmpresaAPI } from '@/lib/api/empresa';
import { AppContainer } from '@/components/apps/common/AppContainer';
import { TabFormContainer } from '@/components/apps/common/TabFormContainer';
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
  Upload,
  FileText,
  Box,
  Settings,
  MapPin,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

// Enums conforme a documentação
const TIPO_POSICAO_OPTIONS = [
  { value: 'PALLET', label: 'Pallet' },
  { value: 'CAIXA', label: 'Caixa' },
  { value: 'PRATELEIRA', label: 'Prateleira' },
  { value: 'PISO', label: 'Piso' },
  { value: 'BLOQUEIO', label: 'Bloqueio' },
];

const STATUS_POSICAO_OPTIONS = [
  { value: 'ATIVA', label: 'Ativa', color: 'bg-green-500/20 text-green-400' },
  { value: 'INATIVA', label: 'Inativa', color: 'bg-neutral-500/20 text-neutral-400' },
  { value: 'BLOQUEADA', label: 'Bloqueada', color: 'bg-red-500/20 text-red-400' },
  { value: 'MANUTENCAO', label: 'Manutenção', color: 'bg-yellow-500/20 text-yellow-400' },
];

const SERIAL_MANAGEMENT_OPTIONS = [
  { value: 'NONE', label: 'Nenhum' },
  { value: 'BY_LOT', label: 'Por Lote' },
  { value: 'BY_UNIT', label: 'Por Unidade' },
];

const CAPACIDADE_UNIDADE_TIPO_OPTIONS = [
  { value: 'PALLETS', label: 'Pallets' },
  { value: 'CAIXAS', label: 'Caixas' },
  { value: 'UNIDADES', label: 'Unidades' },
  { value: 'KG', label: 'KG' },
];

export default function WMSPositionApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepositFilter, setSelectedDepositFilter] = useState<string>('');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isCSVDialogOpen, setIsCSVDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [csvResults, setCSVResults] = useState<any>(null);

  const [formData, setFormData] = useState<CreatePositionData>({
    codigo_posicao: '',
    codigo_deposito: '',
    zona: '',
    rack: '',
    nivel: 0,
    coluna: 0,
    tipo_posicao: 'PALLET',
    capacidade_unidade: 1,
    capacidade_unidade_tipo: 'PALLETS',
    dimensoes: { altura_mm: 0, largura_mm: 0, profundidade_mm: 0 },
    permite_mix: false,
    lot_required: false,
    serial_management: 'NONE',
    control_temp: false,
    bloqueada: false,
    status: 'ATIVA',
    prioridade_putaway: 10,
    codigo_barcode: '',
    observacoes: '',
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
      loadPositions();
    }
  }, [empresaId, token]);

  useEffect(() => {
    filterPositions();
  }, [searchTerm, selectedDepositFilter, positions]);

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
      const data = await DepositAPI.getDeposits(token, empresaId);
      setDeposits(data);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar depósitos',
        variant: 'destructive',
      });
    }
  };

  const loadPositions = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const data = await PositionAPI.getPositions(token);
      setPositions(data);
      setFilteredPositions(data);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar posições',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterPositions = () => {
    let filtered = positions;

    if (selectedDepositFilter) {
      filtered = filtered.filter((pos) => pos.codigo_deposito === selectedDepositFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (pos) =>
          pos.codigo_posicao.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pos.zona?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pos.rack?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPositions(filtered);
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

  const handleDimensoesChange = (field: keyof PositionDimensoes, value: number) => {
    setFormData((prev) => ({
      ...prev,
      dimensoes: {
        ...prev.dimensoes,
        [field]: value,
      },
    }));
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.codigo_posicao || formData.codigo_posicao.length < 3) {
      newErrors.codigo_posicao = 'Código deve ter pelo menos 3 caracteres';
    }

    if (!formData.codigo_deposito) {
      newErrors.codigo_deposito = 'Depósito é obrigatório';
    }

    if (!formData.tipo_posicao) {
      newErrors.tipo_posicao = 'Tipo de posição é obrigatório';
    }

    if (formData.capacidade_unidade <= 0) {
      newErrors.capacidade_unidade = 'Capacidade deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenFormDialog = async (position?: Position) => {
    if (position) {
      try {
        setIsLoadingDetails(true);
        setIsFormDialogOpen(true);

        const positionDetails = await PositionAPI.getPosition(token!, position.uuid);
        setEditingPosition(positionDetails);

        setFormData({
          codigo_posicao: positionDetails.codigo_posicao,
          codigo_deposito: positionDetails.codigo_deposito,
          zona: positionDetails.zona || '',
          rack: positionDetails.rack || '',
          nivel: positionDetails.nivel || 0,
          coluna: positionDetails.coluna || 0,
          tipo_posicao: positionDetails.tipo_posicao,
          capacidade_unidade: positionDetails.capacidade_unidade,
          capacidade_unidade_tipo: positionDetails.capacidade_unidade_tipo,
          dimensoes: positionDetails.dimensoes || { altura_mm: 0, largura_mm: 0, profundidade_mm: 0 },
          permite_mix: positionDetails.permite_mix,
          lot_required: positionDetails.lot_required,
          serial_management: positionDetails.serial_management,
          control_temp: positionDetails.control_temp,
          bloqueada: positionDetails.bloqueada,
          status: positionDetails.status,
          prioridade_putaway: positionDetails.prioridade_putaway || 10,
          codigo_barcode: positionDetails.codigo_barcode || '',
          observacoes: positionDetails.observacoes || '',
        });
      } catch (error: any) {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao carregar detalhes da posição',
          variant: 'destructive',
        });
        setIsFormDialogOpen(false);
      } finally {
        setIsLoadingDetails(false);
      }
    } else {
      setEditingPosition(null);
      setFormData({
        codigo_posicao: '',
        codigo_deposito: selectedDepositFilter || deposits[0]?.codigo_deposito || '',
        zona: '',
        rack: '',
        nivel: 0,
        coluna: 0,
        tipo_posicao: 'PALLET',
        capacidade_unidade: 1,
        capacidade_unidade_tipo: 'PALLETS',
        dimensoes: { altura_mm: 0, largura_mm: 0, profundidade_mm: 0 },
        permite_mix: false,
        lot_required: false,
        serial_management: 'NONE',
        control_temp: false,
        bloqueada: false,
        status: 'ATIVA',
        prioridade_putaway: 10,
        codigo_barcode: '',
        observacoes: '',
      });
      setIsFormDialogOpen(true);
    }
  };

  const handleCloseFormDialog = () => {
    setIsFormDialogOpen(false);
    setEditingPosition(null);
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

      if (editingPosition) {
        await PositionAPI.updatePosition(token, editingPosition.uuid, formData);
        toast({
          title: 'Posição atualizada',
          description: 'A posição foi atualizada com sucesso',
        });
      } else {
        await PositionAPI.createPosition(token, formData);
        toast({
          title: 'Posição criada',
          description: 'A posição foi criada com sucesso',
        });
      }

      handleCloseFormDialog();
      loadPositions();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar posição',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (position: Position) => {
    setPositionToDelete(position);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!token || !positionToDelete) return;

    // Validação: não pode deletar se is_stock=true OU inventario_ativo=true
    if (positionToDelete.is_stock) {
      toast({
        title: 'Ação não permitida',
        description: 'Não é possível deletar uma posição com estoque (is_stock=true).',
        variant: 'destructive',
      });
      return;
    }

    if (positionToDelete.inventario_ativo) {
      toast({
        title: 'Ação não permitida',
        description: 'Não é possível deletar uma posição com inventário ativo.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await PositionAPI.deletePosition(token, positionToDelete.uuid);
      toast({
        title: 'Posição deletada',
        description: 'A posição foi deletada com sucesso',
      });
      setIsDeleteDialogOpen(false);
      setPositionToDelete(null);
      loadPositions();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar posição',
        variant: 'destructive',
      });
    }
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCSVFile(file);
      setCSVResults(null);
    }
  };

  const handleCSVUpload = async () => {
    if (!token || !csvFile) return;

    try {
      setIsUploadingCSV(true);
      const results = await PositionAPI.uploadCSV(token, csvFile);
      setCSVResults(results);

      toast({
        title: 'Upload concluído',
        description: `${results.success} posições criadas com sucesso de ${results.total} no total.`,
      });

      if (results.success > 0) {
        loadPositions();
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao fazer upload do CSV',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingCSV(false);
    }
  };

  const handleDownloadCSVTemplate = () => {
    const headers = [
      'codigo_posicao',
      'codigo_deposito',
      'tipo_posicao',
      'capacidade_unidade',
      'capacidade_unidade_tipo',
      'zona',
      'rack',
      'nivel',
      'coluna',
      'dimensoes_altura',
      'dimensoes_largura',
      'dimensoes_profundidade',
      'permite_mix',
      'lot_required',
      'serial_management',
      'control_temp',
      'bloqueada',
      'status',
      'prioridade_putaway',
      'codigo_barcode',
      'observacoes',
    ];

    const exampleRow = [
      'R1-L2-P03',
      deposits[0]?.codigo_deposito || 'DEP1',
      'PALLET',
      '1',
      'PALLETS',
      'ZONA_A',
      'RACK_01',
      '2',
      '3',
      '1600',
      '1200',
      '800',
      'false',
      'false',
      'NONE',
      'false',
      'false',
      'ATIVA',
      '10',
      'WH1-R1L2P03',
      'Posição padrão',
    ];

    const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_posicoes.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_POSICAO_OPTIONS.find((s) => s.value === status);
    if (!config) return null;
    return (
      <Badge variant="outline" className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const getDepositName = (depositoUuid: string) => {
    const deposit = deposits.find((d) => d.uuid === depositoUuid);
    return deposit ? `${deposit.codigo_deposito} - ${deposit.nome}` : depositoUuid;
  };

  const canDelete = (position: Position) => {
    return !position.is_stock && !position.inventario_ativo;
  };

  if (isLoading) {
    return (
      <AppContainer>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-neutral-400">Carregando posições...</p>
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
          <p className="text-sm text-neutral-500">Configure uma empresa para gerenciar posições</p>
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer
      title="Gerenciar Posições WMS"
      description="Configure e gerencie as posições de armazenamento do WMS"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Buscar por código, zona, rack..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-neutral-950 border-neutral-800 text-white"
            />
          </div>

          <Select value={selectedDepositFilter} onValueChange={setSelectedDepositFilter}>
            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white w-full sm:w-64">
              <SelectValue placeholder="Filtrar por depósito" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800">
              <SelectItem value=" " className="text-white focus:bg-neutral-800">
                Todos os depósitos
              </SelectItem>
              {deposits.map((deposit) => (
                <SelectItem
                  key={deposit.uuid}
                  value={deposit.uuid}
                  className="text-white focus:bg-neutral-800"
                >
                  {deposit.codigo_deposito} - {deposit.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button onClick={() => setIsCSVDialogOpen(true)} variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload CSV
            </Button>
            <Button onClick={() => handleOpenFormDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Posição
            </Button>
          </div>
        </div>

        {filteredPositions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400">
              {searchTerm || selectedDepositFilter
                ? 'Nenhuma posição encontrada'
                : 'Nenhuma posição cadastrada'}
            </p>
            {!searchTerm && !selectedDepositFilter && (
              <p className="text-sm text-neutral-500 mt-2">
                Clique em "Nova Posição" para criar sua primeira posição
              </p>
            )}
          </div>
        ) : (
          <div className="border border-neutral-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800 hover:bg-neutral-800/50">
                  <TableHead className="text-neutral-300">Código</TableHead>
                  <TableHead className="text-neutral-300">Depósito</TableHead>
                  <TableHead className="text-neutral-300">Tipo</TableHead>
                  <TableHead className="text-neutral-300">Localização</TableHead>
                  <TableHead className="text-neutral-300">Capacidade</TableHead>
                  <TableHead className="text-neutral-300">Status</TableHead>
                  <TableHead className="text-neutral-300 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPositions.map((position) => (
                  <TableRow
                    key={position.uuid}
                    className="border-neutral-800 hover:bg-neutral-800/30"
                  >
                    <TableCell className="text-white font-mono text-sm font-medium">
                      {position.codigo_posicao}
                      {position.codigo_barcode && (
                        <p className="text-xs text-neutral-500 mt-1">{position.codigo_barcode}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-neutral-300 text-sm">
                      {deposits.find((d) => d.uuid === position.codigo_deposito)?.codigo_deposito || position.codigo_deposito}
                    </TableCell>
                    <TableCell className="text-neutral-300 text-sm">
                      {TIPO_POSICAO_OPTIONS.find((t) => t.value === position.tipo_posicao)?.label ||
                        position.tipo_posicao}
                    </TableCell>
                    <TableCell className="text-neutral-300 text-sm">
                      {position.zona && <span className="block">Zona: {position.zona}</span>}
                      {position.rack && <span className="block">Rack: {position.rack}</span>}
                      {position.nivel !== undefined && position.nivel > 0 && (
                        <span className="block text-xs text-neutral-500">
                          Nível {position.nivel}, Coluna {position.coluna}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-neutral-300 text-sm">
                      {position.capacidade_unidade} {position.capacidade_unidade_tipo}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {getStatusBadge(position.status)}
                        {position.is_stock && (
                          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-0 text-xs">
                            Estoque
                          </Badge>
                        )}
                        {position.inventario_ativo && (
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-0 text-xs">
                            Inventário
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenFormDialog(position)}
                          className="h-8 w-8 p-0"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(position)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          title={
                            canDelete(position)
                              ? 'Deletar'
                              : 'Não pode deletar: posição com estoque ou inventário ativo'
                          }
                          disabled={!canDelete(position)}
                        >
                          {canDelete(position) ? (
                            <Trash2 className="h-4 w-4" />
                          ) : (
                            <AlertTriangle className="h-4 w-4" />
                          )}
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

      {/* Dialog de formulário */}
      <Dialog open={isFormDialogOpen} onOpenChange={handleCloseFormDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPosition ? 'Editar Posição' : 'Nova Posição'}</DialogTitle>
            <DialogDescription className="text-neutral-400">
              {editingPosition
                ? 'Atualize as informações da posição'
                : 'Preencha os dados para criar uma nova posição WMS'}
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
                          <Label htmlFor="codigo_posicao" className="text-neutral-300 text-sm">
                            Código da Posição *
                          </Label>
                          <Input
                            id="codigo_posicao"
                            value={formData.codigo_posicao}
                            onChange={(e) => handleChange('codigo_posicao', e.target.value)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="R1-L2-P03"
                          />
                          {errors.codigo_posicao && (
                            <p className="text-xs text-red-500">{errors.codigo_posicao}</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="codigo_deposito" className="text-neutral-300 text-sm">
                            Depósito *
                          </Label>
                          <Select
                            value={formData.codigo_deposito}
                            onValueChange={(value) => handleChange('codigo_deposito', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue placeholder="Selecione o depósito" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {deposits.map((deposit) => (
                                <SelectItem
                                  key={deposit.uuid}
                                  value={deposit.codigo_deposito}
                                  className="text-white focus:bg-neutral-800"
                                >
                                  {deposit.codigo_deposito} - {deposit.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.codigo_deposito && (
                            <p className="text-xs text-red-500">{errors.codigo_deposito}</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="tipo_posicao" className="text-neutral-300 text-sm">
                            Tipo de Posição *
                          </Label>
                          <Select
                            value={formData.tipo_posicao}
                            onValueChange={(value) => handleChange('tipo_posicao', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {TIPO_POSICAO_OPTIONS.map((tipo) => (
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
                          {errors.tipo_posicao && (
                            <p className="text-xs text-red-500">{errors.tipo_posicao}</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="status" className="text-neutral-300 text-sm">
                            Status
                          </Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => handleChange('status', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {STATUS_POSICAO_OPTIONS.map((status) => (
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
                          <Label htmlFor="codigo_barcode" className="text-neutral-300 text-sm">
                            Código de Barras
                          </Label>
                          <Input
                            id="codigo_barcode"
                            value={formData.codigo_barcode}
                            onChange={(e) => handleChange('codigo_barcode', e.target.value)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="WH1-R1L2P03"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="prioridade_putaway" className="text-neutral-300 text-sm">
                            Prioridade Putaway
                          </Label>
                          <Input
                            id="prioridade_putaway"
                            type="number"
                            value={formData.prioridade_putaway}
                            onChange={(e) =>
                              handleChange('prioridade_putaway', parseInt(e.target.value) || 0)
                            }
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="10"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <Label htmlFor="observacoes" className="text-neutral-300 text-sm">
                            Observações
                          </Label>
                          <Textarea
                            id="observacoes"
                            value={formData.observacoes}
                            onChange={(e) => handleChange('observacoes', e.target.value)}
                            className="bg-neutral-950 border-neutral-800 text-white"
                            placeholder="Observações sobre a posição"
                            rows={2}
                          />
                        </div>
                      </div>
                    ),
                  },
                  {
                    value: 'localizacao',
                    label: 'Localização',
                    icon: <MapPin className="h-4 w-4" />,
                    content: (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="zona" className="text-neutral-300 text-sm">
                            Zona
                          </Label>
                          <Input
                            id="zona"
                            value={formData.zona}
                            onChange={(e) => handleChange('zona', e.target.value)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="ZONA_A"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="rack" className="text-neutral-300 text-sm">
                            Rack
                          </Label>
                          <Input
                            id="rack"
                            value={formData.rack}
                            onChange={(e) => handleChange('rack', e.target.value)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="RACK_01"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="nivel" className="text-neutral-300 text-sm">
                            Nível
                          </Label>
                          <Input
                            id="nivel"
                            type="number"
                            value={formData.nivel}
                            onChange={(e) => handleChange('nivel', parseInt(e.target.value) || 0)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="2"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="coluna" className="text-neutral-300 text-sm">
                            Coluna
                          </Label>
                          <Input
                            id="coluna"
                            type="number"
                            value={formData.coluna}
                            onChange={(e) => handleChange('coluna', parseInt(e.target.value) || 0)}
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="3"
                          />
                        </div>
                      </div>
                    ),
                  },
                  {
                    value: 'capacidade',
                    label: 'Capacidade',
                    icon: <Box className="h-4 w-4" />,
                    content: (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="capacidade_unidade" className="text-neutral-300 text-sm">
                            Capacidade (Unidades) *
                          </Label>
                          <Input
                            id="capacidade_unidade"
                            type="number"
                            value={formData.capacidade_unidade}
                            onChange={(e) =>
                              handleChange('capacidade_unidade', parseInt(e.target.value) || 1)
                            }
                            className="bg-neutral-950 border-neutral-800 text-white h-9"
                            placeholder="1"
                          />
                          {errors.capacidade_unidade && (
                            <p className="text-xs text-red-500">{errors.capacidade_unidade}</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="capacidade_unidade_tipo" className="text-neutral-300 text-sm">
                            Tipo de Unidade *
                          </Label>
                          <Select
                            value={formData.capacidade_unidade_tipo}
                            onValueChange={(value) => handleChange('capacidade_unidade_tipo', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {CAPACIDADE_UNIDADE_TIPO_OPTIONS.map((tipo) => (
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

                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-neutral-300 text-sm">Dimensões (mm)</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Input
                                type="number"
                                placeholder="Altura"
                                value={formData.dimensoes?.altura_mm}
                                onChange={(e) =>
                                  handleDimensoesChange('altura_mm', parseInt(e.target.value) || 0)
                                }
                                className="bg-neutral-950 border-neutral-800 text-white h-9"
                              />
                              <p className="text-xs text-neutral-500 mt-1">Altura</p>
                            </div>
                            <div>
                              <Input
                                type="number"
                                placeholder="Largura"
                                value={formData.dimensoes?.largura_mm}
                                onChange={(e) =>
                                  handleDimensoesChange('largura_mm', parseInt(e.target.value) || 0)
                                }
                                className="bg-neutral-950 border-neutral-800 text-white h-9"
                              />
                              <p className="text-xs text-neutral-500 mt-1">Largura</p>
                            </div>
                            <div>
                              <Input
                                type="number"
                                placeholder="Profundidade"
                                value={formData.dimensoes?.profundidade_mm}
                                onChange={(e) =>
                                  handleDimensoesChange('profundidade_mm', parseInt(e.target.value) || 0)
                                }
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
                    value: 'configuracoes',
                    label: 'Configurações',
                    icon: <Settings className="h-4 w-4" />,
                    content: (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="serial_management" className="text-neutral-300 text-sm">
                            Gerenciamento Serial
                          </Label>
                          <Select
                            value={formData.serial_management}
                            onValueChange={(value) => handleChange('serial_management', value)}
                          >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                              {SERIAL_MANAGEMENT_OPTIONS.map((serial) => (
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

                        <div className="space-y-1 sm:col-span-2">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="permite_mix"
                                checked={formData.permite_mix}
                                onCheckedChange={(checked) => handleChange('permite_mix', checked)}
                              />
                              <Label htmlFor="permite_mix" className="text-neutral-300 text-sm cursor-pointer">
                                Permite Mix (produtos diferentes)
                              </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                id="lot_required"
                                checked={formData.lot_required}
                                onCheckedChange={(checked) => handleChange('lot_required', checked)}
                              />
                              <Label htmlFor="lot_required" className="text-neutral-300 text-sm cursor-pointer">
                                Lote obrigatório
                              </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                id="control_temp"
                                checked={formData.control_temp}
                                onCheckedChange={(checked) => handleChange('control_temp', checked)}
                              />
                              <Label htmlFor="control_temp" className="text-neutral-300 text-sm cursor-pointer">
                                Controle de temperatura
                              </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                id="bloqueada"
                                checked={formData.bloqueada}
                                onCheckedChange={(checked) => handleChange('bloqueada', checked)}
                              />
                              <Label htmlFor="bloqueada" className="text-neutral-300 text-sm cursor-pointer">
                                Posição bloqueada
                              </Label>
                            </div>
                          </div>
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
                    <>{editingPosition ? 'Atualizar' : 'Criar Posição'}</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Upload CSV */}
      <Dialog open={isCSVDialogOpen} onOpenChange={setIsCSVDialogOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>Upload em Massa de Posições</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Faça upload de um arquivo CSV para criar múltiplas posições de uma vez
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-neutral-300 text-sm">Arquivo CSV</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleCSVFileChange}
                className="bg-neutral-950 border-neutral-800 text-white"
              />
              <p className="text-xs text-neutral-500">
                O arquivo deve seguir o formato especificado no template
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleDownloadCSVTemplate}
              className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar Template CSV
            </Button>

            {csvResults && (
              <div className="border border-neutral-800 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-white">Resultado do Upload</h4>
                <p className="text-sm text-neutral-300">
                  Total: {csvResults.total} | Sucesso: {csvResults.success} | Erros:{' '}
                  {csvResults.errors.length}
                </p>

                {csvResults.errors.length > 0 && (
                  <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                    <p className="text-sm font-medium text-red-400">Erros:</p>
                    {csvResults.errors.map((error: any, index: number) => (
                      <div key={index} className="text-xs text-neutral-400 border-l-2 border-red-500 pl-2">
                        Linha {error.row}: {error.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCSVDialogOpen(false);
                setCSVFile(null);
                setCSVResults(null);
              }}
            >
              Fechar
            </Button>
            <Button
              onClick={handleCSVUpload}
              disabled={!csvFile || isUploadingCSV}
              className="gap-2"
            >
              {isUploadingCSV ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Fazer Upload
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
              Tem certeza que deseja deletar a posição <strong>"{positionToDelete?.codigo_posicao}"</strong>?
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
