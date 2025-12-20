import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Package, ShoppingCart, ShieldCheck, Truck, FileText } from 'lucide-react';
import { TabFormContainer } from '@/components/apps/common/TabFormContainer';
import { MaterialAPI, Material, CreateMaterialDTO } from '@/lib/api/material';
import { MatGroupAPI, MatGroup, MatCategory, MatSubCategory } from '@/lib/api/mat-group';
import { EmpresaAPI, Empresa } from '@/lib/api/empresa';
import { SupplierAPI, Supplier } from '@/lib/api/supplier';
import { DepositAPI, Deposit } from '@/lib/api/wm-deposit';
import { PositionAPI, Position } from '@/lib/api/wms-position';

interface MaterialFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    materialToEdit?: Material | null;
}

export function MaterialFormModal({ open, onOpenChange, onSuccess, materialToEdit }: MaterialFormModalProps) {
    const { token } = useSessionStore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isAuxLoading, setIsAuxLoading] = useState(false);

    // Aux Data
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [groups, setGroups] = useState<MatGroup[]>([]);
    const [categories, setCategories] = useState<MatCategory[]>([]);
    const [subcategories, setSubcategories] = useState<MatSubCategory[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);

    // Form State
    const [formData, setFormData] = useState<CreateMaterialDTO>({
        dados_basicos: {
            codigo_material: '',
            descricao: '',
            unidade_medida_basica: '',
            tipo_material: '',
            grupo_uuid: '',
            categoria_uuid: '',
            subcategoria_uuid: '',
            quantidade_base: 1,
            ean1: '',
            ean2: '',
            administrado_por_lote: false,
            controle_qualidade: false,
            centro: '',
            ativo: true,
        },
        dados_compras: {},
        dados_qualidade: {},
        dados_logistica: {},
        dados_fiscais: {}
    });

    useEffect(() => {
        if (open) {
            loadAuxiliaryData();
            if (materialToEdit) {
                // Populate form for editing
                setFormData({
                    dados_basicos: {
                        codigo_material: materialToEdit.codigo_material,
                        descricao: materialToEdit.descricao,
                        unidade_medida_basica: materialToEdit.unidade_medida_basica,
                        tipo_material: materialToEdit.tipo_material,
                        grupo_uuid: materialToEdit.grupo_uuid,
                        categoria_uuid: materialToEdit.categoria_uuid,
                        subcategoria_uuid: materialToEdit.subcategoria_uuid,
                        quantidade_base: materialToEdit.quantidade_base,
                        ean1: materialToEdit.ean1,
                        ean2: materialToEdit.ean2,
                        administrado_por_lote: materialToEdit.administrado_por_lote,
                        controle_qualidade: materialToEdit.controle_qualidade,
                        centro: materialToEdit.centro,
                        ativo: materialToEdit.ativo,
                    },
                    dados_compras: materialToEdit.dados_compras || {},
                    dados_qualidade: materialToEdit.dados_qualidade || {},
                    dados_logistica: materialToEdit.dados_logistica || {},
                    dados_fiscais: materialToEdit.dados_fiscais || {},
                });
                // Load dependent data
                if (materialToEdit.grupo_uuid) loadCategories(materialToEdit.grupo_uuid);
                if (materialToEdit.categoria_uuid) loadSubcategories(materialToEdit.categoria_uuid);
                if (materialToEdit.dados_logistica?.deposito_padrao_uuid) loadPositions(materialToEdit.dados_logistica.deposito_padrao_uuid);
            } else {
                // Reset form
                setFormData({
                    dados_basicos: {
                        codigo_material: '',
                        descricao: '',
                        unidade_medida_basica: '',
                        tipo_material: '',
                        grupo_uuid: '',
                        categoria_uuid: '',
                        subcategoria_uuid: '',
                        quantidade_base: 1,
                        ean1: '',
                        ean2: '',
                        administrado_por_lote: false,
                        controle_qualidade: false,
                        centro: '',
                        ativo: true,
                    },
                    dados_compras: {},
                    dados_qualidade: {},
                    dados_logistica: {},
                    dados_fiscais: {}
                });
            }
        }
    }, [open, materialToEdit]);

    const loadAuxiliaryData = async () => {
        if (!token) return;
        try {
            setIsAuxLoading(true);
            console.log('Loading auxiliary data...');
            console.log('Loading auxiliary data...');
            const results = await Promise.allSettled([
                EmpresaAPI.getEmpresas(token),
                MatGroupAPI.getGroups(token),
                SupplierAPI.getSuppliers(token, { ativo: true }),
                DepositAPI.getDeposits(token)
            ]);

            const empresasData = results[0].status === 'fulfilled' ? results[0].value : [];
            const groupsData = results[1].status === 'fulfilled' ? results[1].value : [];
            const suppliersData = results[2].status === 'fulfilled' ? results[2].value : [];
            const depositsData = results[3].status === 'fulfilled' ? results[3].value : [];

            if (results[0].status === 'rejected') console.error('Error loading empresas:', results[0].reason);
            if (results[1].status === 'rejected') console.error('Error loading groups:', results[1].reason);
            if (results[2].status === 'rejected') console.error('Error loading suppliers:', results[2].reason);
            if (results[3].status === 'rejected') console.error('Error loading deposits:', results[3].reason);

            console.log('Empresas loaded:', empresasData);
            setEmpresas(empresasData);
            setGroups(groupsData);
            setSuppliers(suppliersData);
            setDeposits(depositsData);

            // Auto-select first company if not editing and no center selected
            if (!materialToEdit && !formData.dados_basicos.centro && empresasData.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    dados_basicos: { ...prev.dados_basicos, centro: empresasData[0].centro }
                }));
            }
        } catch (error) {
            console.error('Error loading aux data', error);
            toast({ title: 'Erro', description: 'Falha ao carregar dados auxiliares', variant: 'destructive' });
        } finally {
            setIsAuxLoading(false);
        }
    };

    const loadCategories = async (groupUuid: string) => {
        if (!token || !groupUuid) return;
        try {
            const data = await MatGroupAPI.getCategories(token, groupUuid);
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories', error);
        }
    };

    const loadSubcategories = async (categoryUuid: string) => {
        if (!token || !categoryUuid) return;
        try {
            const data = await MatGroupAPI.getSubCategories(token, categoryUuid);
            setSubcategories(data);
        } catch (error) {
            console.error('Error loading subcategories', error);
        }
    };

    const loadPositions = async (depositUuid: string) => {
        if (!token || !depositUuid) return;
        try {
            // Find deposit code from uuid
            const deposit = deposits.find(d => d.uuid === depositUuid);
            if (deposit) {
                const data = await PositionAPI.getPositions(token, { codigo_deposito: deposit.codigo_deposito });
                setPositions(data);
            }
        } catch (error) {
            console.error('Error loading positions', error);
        }
    };

    const updateBasicData = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            dados_basicos: { ...prev.dados_basicos, [field]: value }
        }));

        if (field === 'grupo_uuid') {
            loadCategories(value);
            setFormData(prev => ({ ...prev, dados_basicos: { ...prev.dados_basicos, categoria_uuid: '', subcategoria_uuid: '' } }));
        }
        if (field === 'categoria_uuid') {
            loadSubcategories(value);
            setFormData(prev => ({ ...prev, dados_basicos: { ...prev.dados_basicos, subcategoria_uuid: '' } }));
        }
    };

    const updateNestedData = (section: 'dados_compras' | 'dados_qualidade' | 'dados_logistica' | 'dados_fiscais', field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));

        if (section === 'dados_logistica' && field === 'deposito_padrao_uuid') {
            loadPositions(value);
            setFormData(prev => ({
                ...prev,
                dados_logistica: { ...prev.dados_logistica, posicao_fixa_uuid: '' }
            }));
        }
    };

    const generateEAN = (type: 'ean1' | 'ean2') => {
        const ean = Math.floor(Math.random() * 1000000000000).toString().padStart(13, '0'); // Mock EAN generation
        updateBasicData(type, ean);
    };

    const handleSubmit = async () => {
        if (!token) return;

        // Basic Validation
        if (!formData.dados_basicos.codigo_material || !formData.dados_basicos.descricao || !formData.dados_basicos.centro) {
            toast({ title: 'Erro', description: 'Preencha os campos obrigatórios na aba Dados Básicos', variant: 'destructive' });
            return;
        }

        try {
            setIsLoading(true);
            if (materialToEdit) {
                await MaterialAPI.update(token, materialToEdit.codigo_material, formData);
                toast({ title: 'Sucesso', description: 'Material atualizado com sucesso' });
            } else {
                await MaterialAPI.create(token, formData);
                toast({ title: 'Sucesso', description: 'Material criado com sucesso' });
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message || 'Falha ao salvar material', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        {
            value: 'basic',
            label: 'Dados Básicos',
            icon: <Package className="h-4 w-4" />,
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Centro *</Label>
                        <Select
                            value={formData.dados_basicos.centro}
                            onValueChange={(v) => updateBasicData('centro', v)}
                            disabled={!!materialToEdit}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o centro" />
                            </SelectTrigger>
                            <SelectContent>
                                {empresas.map((emp) => {
                                    console.log('Rendering empresa option:', emp);
                                    return (
                                        <SelectItem key={emp.uuid} value={emp.centro || emp.uuid}>
                                            {emp.centro || 'SEM CENTRO'} - {emp.nome_empresa}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Código do Material *</Label>
                        <Input
                            value={formData.dados_basicos.codigo_material}
                            onChange={(e) => updateBasicData('codigo_material', e.target.value)}
                            disabled={!!materialToEdit}
                            placeholder="Ex: MAT-001"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo de Material *</Label>
                        <Select value={formData.dados_basicos.tipo_material} onValueChange={(v) => updateBasicData('tipo_material', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PRODUTO_ACABADO">Produto Acabado</SelectItem>
                                <SelectItem value="MATERIA_PRIMA">Matéria Prima</SelectItem>
                                <SelectItem value="EMBALAGEM">Embalagem</SelectItem>
                                <SelectItem value="MATERIAL_CONSUMO">Material de Consumo</SelectItem>
                                <SelectItem value="SERVICO">Serviço</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label>Descrição *</Label>
                        <Input
                            value={formData.dados_basicos.descricao}
                            onChange={(e) => updateBasicData('descricao', e.target.value)}
                            placeholder="Descrição detalhada do material"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Unidade de Medida *</Label>
                        <Select value={formData.dados_basicos.unidade_medida_basica} onValueChange={(v) => updateBasicData('unidade_medida_basica', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a unidade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UN">UN - Unidade</SelectItem>
                                <SelectItem value="KG">KG - Quilograma</SelectItem>
                                <SelectItem value="CX">CX - Caixa</SelectItem>
                                <SelectItem value="L">L - Litro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Quantidade Base</Label>
                        <Input
                            type="number"
                            value={formData.dados_basicos.quantidade_base}
                            onChange={(e) => updateBasicData('quantidade_base', parseFloat(e.target.value))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Grupo</Label>
                        <Select value={formData.dados_basicos.grupo_uuid} onValueChange={(v) => updateBasicData('grupo_uuid', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o grupo" />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map((g) => (
                                    <SelectItem key={g.uuid} value={g.uuid}>{g.description}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select
                            value={formData.dados_basicos.categoria_uuid}
                            onValueChange={(v) => updateBasicData('categoria_uuid', v)}
                            disabled={!formData.dados_basicos.grupo_uuid}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem key={c.uuid} value={c.uuid}>{c.description}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Subcategoria</Label>
                        <Select
                            value={formData.dados_basicos.subcategoria_uuid}
                            onValueChange={(v) => updateBasicData('subcategoria_uuid', v)}
                            disabled={!formData.dados_basicos.categoria_uuid}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a subcategoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {subcategories.map((s) => (
                                    <SelectItem key={s.uuid} value={s.uuid}>{s.description}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Status</Label>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.dados_basicos.ativo}
                                onCheckedChange={(v) => updateBasicData('ativo', v)}
                            />
                            <Label>{formData.dados_basicos.ativo ? 'Ativo' : 'Inativo'}</Label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>EAN 1</Label>
                            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => generateEAN('ean1')}>Gerar</Button>
                        </div>
                        <Input
                            value={formData.dados_basicos.ean1 || ''}
                            onChange={(e) => updateBasicData('ean1', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>EAN 2</Label>
                            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => generateEAN('ean2')}>Gerar</Button>
                        </div>
                        <Input
                            value={formData.dados_basicos.ean2 || ''}
                            onChange={(e) => updateBasicData('ean2', e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={formData.dados_basicos.administrado_por_lote}
                            onCheckedChange={(v) => updateBasicData('administrado_por_lote', v)}
                        />
                        <Label>Administrado por Lote</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={formData.dados_basicos.controle_qualidade}
                            onCheckedChange={(v) => updateBasicData('controle_qualidade', v)}
                        />
                        <Label>Controle de Qualidade</Label>
                    </div>
                </div>
            )
        },
        {
            value: 'purchasing',
            label: 'Compras',
            icon: <ShoppingCart className="h-4 w-4" />,
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Fornecedor Padrão</Label>
                        <Select
                            value={formData.dados_compras?.fornecedor_padrao_uuid}
                            onValueChange={(v) => updateNestedData('dados_compras', 'fornecedor_padrao_uuid', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o fornecedor" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map((s) => (
                                    <SelectItem key={s.uuid} value={s.uuid}>{s.nome_fantasia}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Cód. Material Fornecedor</Label>
                        <Input
                            value={formData.dados_compras?.codigo_material_fornecedor || ''}
                            onChange={(e) => updateNestedData('dados_compras', 'codigo_material_fornecedor', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Unidade de Compra</Label>
                        <Input
                            value={formData.dados_compras?.unidade_compra || ''}
                            onChange={(e) => updateNestedData('dados_compras', 'unidade_compra', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Múltiplo de Compra</Label>
                        <Input
                            type="number"
                            value={formData.dados_compras?.multiplo_compra || ''}
                            onChange={(e) => updateNestedData('dados_compras', 'multiplo_compra', parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Lead Time (Dias)</Label>
                        <Input
                            type="number"
                            value={formData.dados_compras?.lead_time_dias || ''}
                            onChange={(e) => updateNestedData('dados_compras', 'lead_time_dias', parseInt(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Lote Mínimo</Label>
                        <Input
                            type="number"
                            value={formData.dados_compras?.lote_minimo_compra || ''}
                            onChange={(e) => updateNestedData('dados_compras', 'lote_minimo_compra', parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Preço Base</Label>
                        <Input
                            type="number"
                            value={formData.dados_compras?.preco_base || ''}
                            onChange={(e) => updateNestedData('dados_compras', 'preco_base', parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Preço Venda</Label>
                        <Input
                            type="number"
                            value={formData.dados_compras?.preco_venda || ''}
                            onChange={(e) => updateNestedData('dados_compras', 'preco_venda', parseFloat(e.target.value))}
                        />
                    </div>
                </div>
            )
        },
        {
            value: 'quality',
            label: 'Qualidade',
            icon: <ShieldCheck className="h-4 w-4" />,
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Classe de Inspeção</Label>
                        <Input
                            value={formData.dados_qualidade?.classe_inspecao || ''}
                            onChange={(e) => updateNestedData('dados_qualidade', 'classe_inspecao', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Plano de Inspeção</Label>
                        <Input
                            value={formData.dados_qualidade?.plano_inspecao || ''}
                            onChange={(e) => updateNestedData('dados_qualidade', 'plano_inspecao', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Criticidade</Label>
                        <Select
                            value={formData.dados_qualidade?.criticidade_material}
                            onValueChange={(v) => updateNestedData('dados_qualidade', 'criticidade_material', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALTA">Alta</SelectItem>
                                <SelectItem value="MEDIA">Média</SelectItem>
                                <SelectItem value="BAIXA">Baixa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Data de Validade</Label>
                        <Input
                            type="date"
                            value={formData.dados_qualidade?.data_validade || ''}
                            onChange={(e) => updateNestedData('dados_qualidade', 'data_validade', e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={formData.dados_qualidade?.exige_laudo_fornecedor}
                            onCheckedChange={(v) => updateNestedData('dados_qualidade', 'exige_laudo_fornecedor', v)}
                        />
                        <Label>Exige Laudo Fornecedor</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={formData.dados_qualidade?.exige_lote_controle}
                            onCheckedChange={(v) => updateNestedData('dados_qualidade', 'exige_lote_controle', v)}
                        />
                        <Label>Exige Lote de Controle</Label>
                    </div>
                </div>
            )
        },
        {
            value: 'logistics',
            label: 'Logística',
            icon: <Truck className="h-4 w-4" />,
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Depósito Padrão</Label>
                        <Select
                            value={formData.dados_logistica?.deposito_padrao_uuid}
                            onValueChange={(v) => updateNestedData('dados_logistica', 'deposito_padrao_uuid', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o depósito" />
                            </SelectTrigger>
                            <SelectContent>
                                {deposits.map((d) => (
                                    <SelectItem key={d.uuid} value={d.uuid}>{d.descricao}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Posição Fixa</Label>
                        <Select
                            value={formData.dados_logistica?.posicao_fixa_uuid}
                            onValueChange={(v) => updateNestedData('dados_logistica', 'posicao_fixa_uuid', v)}
                            disabled={!formData.dados_logistica?.deposito_padrao_uuid}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a posição" />
                            </SelectTrigger>
                            <SelectContent>
                                {positions.map((p) => (
                                    <SelectItem key={p.uuid} value={p.uuid}>{p.codigo_posicao}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Estratégia Armazenagem</Label>
                        <Input
                            value={formData.dados_logistica?.estrategia_armazenagem || ''}
                            onChange={(e) => updateNestedData('dados_logistica', 'estrategia_armazenagem', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Estratégia Picking</Label>
                        <Input
                            value={formData.dados_logistica?.estrategia_picking || ''}
                            onChange={(e) => updateNestedData('dados_logistica', 'estrategia_picking', e.target.value)}
                        />
                    </div>
                </div>
            )
        },
        {
            value: 'fiscal',
            label: 'Fiscal',
            icon: <FileText className="h-4 w-4" />,
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>NCM</Label>
                        <Input
                            value={formData.dados_fiscais?.ncm || ''}
                            onChange={(e) => updateNestedData('dados_fiscais', 'ncm', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>CEST</Label>
                        <Input
                            value={formData.dados_fiscais?.cest || ''}
                            onChange={(e) => updateNestedData('dados_fiscais', 'cest', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Origem Produto</Label>
                        <Input
                            value={formData.dados_fiscais?.origem_produto || ''}
                            onChange={(e) => updateNestedData('dados_fiscais', 'origem_produto', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Cód. Fiscal Interno</Label>
                        <Input
                            value={formData.dados_fiscais?.codigo_fiscal_interno || ''}
                            onChange={(e) => updateNestedData('dados_fiscais', 'codigo_fiscal_interno', e.target.value)}
                        />
                    </div>
                </div>
            )
        }
    ];

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!isLoading) onOpenChange(v); }}>
            <DialogContent className="bg-neutral-950 border-neutral-800 text-white w-[90vw] max-w-[90vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{materialToEdit ? 'Editar Material' : 'Novo Material'}</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Preencha os dados do material. Campos com * são obrigatórios.
                    </DialogDescription>
                </DialogHeader>

                <TabFormContainer tabs={tabs} defaultTab="basic" className="mt-4" />

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || isAuxLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
