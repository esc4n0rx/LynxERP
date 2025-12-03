'use client';

import { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/session';
import { useToast } from '@/hooks/use-toast';
import { SupplierAPI, Supplier, CreateSupplierData, SupplierAddress, SupplierContact } from '@/lib/api/supplier';
import { EmpresaAPI, Empresa } from '@/lib/api/empresa';
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
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    FileText,
    MapPin,
    Users,
    DollarSign,
    Briefcase,
    Building2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { formatCNPJ, formatCPF, validateCNPJ, validateCPF } from '@/lib/validators';

const TIPO_FORNECEDOR_OPTIONS = [
    { value: 'PESSOA_JURIDICA', label: 'Pessoa Jurídica' },
    { value: 'PESSOA_FISICA', label: 'Pessoa Física' },
];

const REGIME_TRIBUTARIO_OPTIONS = [
    { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
    { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
    { value: 'LUCRO_REAL', label: 'Lucro Real' },
];

const TIPO_PAGAMENTO_OPTIONS = [
    { value: 'PIX', label: 'PIX' },
    { value: 'TED', label: 'TED' },
    { value: 'DOC', label: 'DOC' },
    { value: 'BOLETO', label: 'Boleto' },
    { value: 'DINHEIRO', label: 'Dinheiro' },
];

const TIPO_CONTA_OPTIONS = [
    { value: 'CORRENTE', label: 'Corrente' },
    { value: 'POUPANCA', label: 'Poupança' },
];

const CATEGORIA_OPTIONS = [
    { value: 'MATERIA_PRIMA', label: 'Matéria Prima' },
    { value: 'EMBALAGENS', label: 'Embalagens' },
    { value: 'SERVICOS', label: 'Serviços' },
    { value: 'REVENDA', label: 'Revenda' },
    { value: 'GERAL', label: 'Geral' },
];

const CLASSIFICACAO_RISCO_OPTIONS = [
    { value: 'BAIXO', label: 'Baixo' },
    { value: 'MEDIO', label: 'Médio' },
    { value: 'ALTO', label: 'Alto' },
];

const TIPO_ENDERECO_OPTIONS = [
    { value: 'FISCAL', label: 'Fiscal' },
    { value: 'ENTREGA', label: 'Entrega' },
    { value: 'COBRANCA', label: 'Cobrança' },
    { value: 'OUTRO', label: 'Outro' },
];

export default function SupplierApp() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);

    // Form State
    const [formData, setFormData] = useState<CreateSupplierData>({
        centro: '',
        nome_fantasia: '',
        razao_social: '',
        tipo_fornecedor: 'PESSOA_JURIDICA',
        cnpj: '',
        cpf: '',
        inscricao_estadual: '',
        inscricao_municipal: '',
        regime_tributario: 'SIMPLES_NACIONAL',
        substituicao_tributaria: false,
        prazo_pagamento: 30,
        tipo_pagamento_favorito: 'BOLETO',
        banco_nome: '',
        banco_agencia: '',
        banco_conta: '',
        banco_tipo_conta: 'CORRENTE',
        chave_pix: '',
        dia_fechamento_fatura: 1,
        dia_vencimento_fatura: 1,
        categoria_fornecedor: 'GERAL',
        classificacao_risco: 'BAIXO',
        avaliacao: 5,
        observacoes_comerciais: '',
        principal_produto: '',
        marca_representacao: '',
        tempo_medio_entrega: 0,
        confiabilidade_entrega: 100,
        qualidade_media: 100,
        reclamacoes: 0,
        ativo: true,
    });

    const [addresses, setAddresses] = useState<SupplierAddress[]>([]);
    const [contacts, setContacts] = useState<SupplierContact[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Address Form State (Temporary for the dialog)
    const [newAddress, setNewAddress] = useState<Partial<SupplierAddress>>({
        tipo_endereco: 'FISCAL',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        pais: 'Brasil',
        padrao: false,
    });
    const [isAddressLoading, setIsAddressLoading] = useState(false);

    // Contact Form State
    const [newContact, setNewContact] = useState<Partial<SupplierContact>>({
        nome: '',
        email: '',
        telefone: '',
        celular: '',
        cargo: '',
        observacao: '',
    });

    const { token } = useSessionStore();
    const { toast } = useToast();

    useEffect(() => {
        loadEmpresas();
    }, [token]);

    useEffect(() => {
        if (selectedEmpresa) {
            loadSuppliers();
        }
    }, [selectedEmpresa, token]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = suppliers.filter(
                (sup) =>
                    sup.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    sup.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    sup.codigo_interno.includes(searchTerm)
            );
            setFilteredSuppliers(filtered);
        } else {
            setFilteredSuppliers(suppliers);
        }
    }, [searchTerm, suppliers]);

    const loadEmpresas = async () => {
        if (!token) return;
        try {
            const data = await EmpresaAPI.getEmpresas(token);
            setEmpresas(data);
            if (data.length > 0) {
                setSelectedEmpresa(data[0]);
                setFormData(prev => ({ ...prev, centro: data[0].centro }));
            }
        } catch (error) {
            console.error('Error loading companies:', error);
            toast({
                title: 'Erro',
                description: 'Erro ao carregar empresas',
                variant: 'destructive',
            });
        }
    };

    const loadSuppliers = async () => {
        if (!token || !selectedEmpresa) return;
        try {
            setIsLoading(true);
            const data = await SupplierAPI.getSuppliers(token, { centro: selectedEmpresa.centro });
            setSuppliers(data);
            setFilteredSuppliers(data);
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao carregar fornecedores',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenFormDialog = async (supplier?: Supplier) => {
        if (!selectedEmpresa) {
            toast({
                title: 'Erro',
                description: 'Selecione uma empresa primeiro',
                variant: 'destructive',
            });
            return;
        }

        if (supplier) {
            // Edit mode
            setEditingSupplier(supplier);
            // Load full details including addresses and contacts if needed
            // For now, we'll just populate what we have and maybe fetch extra details
            // Ideally getSupplier would return everything or we fetch separately
            try {
                const fullSupplier = await SupplierAPI.getSupplier(token!, supplier.uuid);
                setFormData({
                    centro: fullSupplier.centro,
                    nome_fantasia: fullSupplier.nome_fantasia,
                    razao_social: fullSupplier.razao_social,
                    tipo_fornecedor: fullSupplier.tipo_fornecedor,
                    cnpj: fullSupplier.cnpj,
                    cpf: fullSupplier.cpf,
                    inscricao_estadual: fullSupplier.inscricao_estadual,
                    inscricao_municipal: fullSupplier.inscricao_municipal,
                    regime_tributario: fullSupplier.regime_tributario,
                    substituicao_tributaria: fullSupplier.substituicao_tributaria,
                    prazo_pagamento: fullSupplier.prazo_pagamento,
                    tipo_pagamento_favorito: fullSupplier.tipo_pagamento_favorito,
                    banco_nome: fullSupplier.banco_nome,
                    banco_agencia: fullSupplier.banco_agencia,
                    banco_conta: fullSupplier.banco_conta,
                    banco_tipo_conta: fullSupplier.banco_tipo_conta,
                    chave_pix: fullSupplier.chave_pix,
                    dia_fechamento_fatura: fullSupplier.dia_fechamento_fatura,
                    dia_vencimento_fatura: fullSupplier.dia_vencimento_fatura,
                    categoria_fornecedor: fullSupplier.categoria_fornecedor,
                    classificacao_risco: fullSupplier.classificacao_risco,
                    avaliacao: fullSupplier.avaliacao,
                    observacoes_comerciais: fullSupplier.observacoes_comerciais,
                    principal_produto: fullSupplier.principal_produto,
                    marca_representacao: fullSupplier.marca_representacao,
                    tempo_medio_entrega: fullSupplier.tempo_medio_entrega,
                    confiabilidade_entrega: fullSupplier.confiabilidade_entrega,
                    qualidade_media: fullSupplier.qualidade_media,
                    reclamacoes: fullSupplier.reclamacoes,
                    ativo: fullSupplier.ativo,
                });

                // Fetch addresses and contacts
                const supplierAddresses = await SupplierAPI.getAddresses(token!, supplier.uuid);
                setAddresses(supplierAddresses);
                const supplierContacts = await SupplierAPI.getContacts(token!, supplier.uuid);
                setContacts(supplierContacts);

            } catch (e) {
                console.error(e);
            }
        } else {
            // Create mode
            setEditingSupplier(null);
            setFormData({
                centro: selectedEmpresa.centro,
                nome_fantasia: '',
                razao_social: '',
                tipo_fornecedor: 'PESSOA_JURIDICA',
                cnpj: '',
                cpf: '',
                inscricao_estadual: '',
                inscricao_municipal: '',
                regime_tributario: 'SIMPLES_NACIONAL',
                substituicao_tributaria: false,
                prazo_pagamento: 30,
                tipo_pagamento_favorito: 'BOLETO',
                banco_nome: '',
                banco_agencia: '',
                banco_conta: '',
                banco_tipo_conta: 'CORRENTE',
                chave_pix: '',
                dia_fechamento_fatura: 1,
                dia_vencimento_fatura: 1,
                categoria_fornecedor: 'GERAL',
                classificacao_risco: 'BAIXO',
                avaliacao: 5,
                observacoes_comerciais: '',
                principal_produto: '',
                marca_representacao: '',
                tempo_medio_entrega: 0,
                confiabilidade_entrega: 100,
                qualidade_media: 100,
                reclamacoes: 0,
                ativo: true,
            });
            setAddresses([]);
            setContacts([]);
        }
        setIsFormDialogOpen(true);
    };

    const handleChange = (field: keyof CreateSupplierData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleCEPBlur = async () => {
        if (!newAddress.cep || newAddress.cep.length < 8) return;

        try {
            setIsAddressLoading(true);
            const data = await EmpresaAPI.buscarCEP(newAddress.cep);
            setNewAddress(prev => ({
                ...prev,
                logradouro: data.logradouro,
                bairro: data.bairro,
                cidade: data.localidade,
                estado: data.uf,
                complemento: data.complemento
            }));
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'CEP não encontrado',
                variant: 'destructive',
            });
        } finally {
            setIsAddressLoading(false);
        }
    };

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.nome_fantasia) newErrors.nome_fantasia = 'Nome Fantasia é obrigatório';
        if (!formData.razao_social) newErrors.razao_social = 'Razão Social é obrigatória';

        if (formData.tipo_fornecedor === 'PESSOA_JURIDICA') {
            if (!formData.cnpj) newErrors.cnpj = 'CNPJ é obrigatório';
            else if (!validateCNPJ(formData.cnpj)) newErrors.cnpj = 'CNPJ inválido';
        } else {
            if (!formData.cpf) newErrors.cpf = 'CPF é obrigatório';
            else if (!validateCPF(formData.cpf)) newErrors.cpf = 'CPF inválido';
        }

        if (formData.tipo_pagamento_favorito === 'PIX' && !formData.chave_pix) {
            newErrors.chave_pix = 'Chave PIX é obrigatória para pagamentos via PIX';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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
            let supplierUuid = editingSupplier?.uuid;

            if (editingSupplier) {
                await SupplierAPI.updateSupplier(token, editingSupplier.uuid, formData);
                toast({ title: 'Sucesso', description: 'Fornecedor atualizado' });
            } else {
                const newSupplier = await SupplierAPI.createSupplier(token, formData);
                supplierUuid = newSupplier.uuid;
                toast({ title: 'Sucesso', description: 'Fornecedor criado' });
            }

            // Handle Addresses and Contacts (Simple implementation: just create new ones for now if in create mode, 
            // or we need a more complex sync logic. For this MVP, let's assume we add them after creation or 
            // we'd need to bulk create. The API seems to handle them separately.
            // So if we are creating, we might need to create the supplier first, then loop through addresses/contacts to create them.

            if (!editingSupplier && supplierUuid) {
                // Create addresses
                for (const addr of addresses) {
                    await SupplierAPI.createAddress(token, supplierUuid, addr as any);
                }
                // Create contacts
                for (const ct of contacts) {
                    await SupplierAPI.createContact(token, supplierUuid, ct as any);
                }
            }

            setIsFormDialogOpen(false);
            loadSuppliers();
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao salvar fornecedor',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddAddress = () => {
        // In a real app, this would open a sub-dialog or add to a list to be saved later.
        // For now, let's just add to the local state list.
        // We need to validate at least required fields.
        if (!newAddress.logradouro || !newAddress.numero) {
            toast({ title: 'Erro', description: 'Preencha o endereço', variant: 'destructive' });
            return;
        }
        setAddresses([...addresses, { ...newAddress, uuid: Math.random().toString() } as SupplierAddress]);
        setNewAddress({
            tipo_endereco: 'FISCAL',
            cep: '',
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            pais: 'Brasil',
            padrao: false,
        });
    };

    const handleAddContact = () => {
        if (!newContact.nome || !newContact.email) {
            toast({ title: 'Erro', description: 'Nome e Email são obrigatórios', variant: 'destructive' });
            return;
        }
        setContacts([...contacts, { ...newContact, uuid: Math.random().toString() } as SupplierContact]);
        setNewContact({
            nome: '',
            email: '',
            telefone: '',
            celular: '',
            cargo: '',
            observacao: '',
        });
    };

    if (isLoading) {
        return (
            <AppContainer>
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                    <p className="text-neutral-400">Carregando fornecedores...</p>
                </div>
            </AppContainer>
        );
    }

    return (
        <AppContainer title="Gestão de Fornecedores" description="Gerencie seus fornecedores, endereços e contatos">
            <div className="space-y-6">
                <div className="flex gap-3 items-end">
                    <div className="space-y-1 min-w-[200px]">
                        <Label>Centro / Empresa</Label>
                        <Select
                            value={selectedEmpresa?.centro}
                            onValueChange={(val) => {
                                const emp = empresas.find(e => e.centro === val);
                                setSelectedEmpresa(emp || null);
                                setFormData(prev => ({ ...prev, centro: val }));
                            }}
                        >
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                                {empresas.map(emp => (
                                    <SelectItem key={emp.uuid} value={emp.centro} className="text-white focus:bg-neutral-800">
                                        {emp.nome_empresa} ({emp.centro})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Buscar fornecedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-neutral-950 border-neutral-800 text-white"
                        />
                    </div>
                    <Button onClick={() => handleOpenFormDialog()} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Novo Fornecedor
                    </Button>
                </div>

                <div className="border border-neutral-800 rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-neutral-800 hover:bg-neutral-800/50">
                                <TableHead className="text-neutral-300">Código</TableHead>
                                <TableHead className="text-neutral-300">Razão Social / Fantasia</TableHead>
                                <TableHead className="text-neutral-300">CNPJ / CPF</TableHead>
                                <TableHead className="text-neutral-300">Categoria</TableHead>
                                <TableHead className="text-neutral-300">Status</TableHead>
                                <TableHead className="text-neutral-300 text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSuppliers.map((supplier) => (
                                <TableRow key={supplier.uuid} className="border-neutral-800 hover:bg-neutral-800/30">
                                    <TableCell className="text-white font-mono">{supplier.codigo_interno}</TableCell>
                                    <TableCell className="text-white">
                                        <div className="font-medium">{supplier.nome_fantasia}</div>
                                        <div className="text-xs text-neutral-400">{supplier.razao_social}</div>
                                    </TableCell>
                                    <TableCell className="text-neutral-300">
                                        {supplier.tipo_fornecedor === 'PESSOA_JURIDICA' ? formatCNPJ(supplier.cnpj || '') : formatCPF(supplier.cpf || '')}
                                    </TableCell>
                                    <TableCell className="text-neutral-300">
                                        <Badge variant="outline" className="border-neutral-700 text-neutral-400">
                                            {CATEGORIA_OPTIONS.find(c => c.value === supplier.categoria_fornecedor)?.label || supplier.categoria_fornecedor}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {supplier.ativo ? (
                                            <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-0">Ativo</Badge>
                                        ) : (
                                            <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0">Inativo</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleOpenFormDialog(supplier)} className="h-8 w-8 p-0">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredSuppliers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                                        Nenhum fornecedor encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Preencha os dados do fornecedor.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <TabFormContainer
                            tabs={[
                                {
                                    value: 'identificacao',
                                    label: 'Identificação Básica',
                                    icon: <Building2 className="h-4 w-4" />,
                                    content: (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-1">
                                                <Label>Centro *</Label>
                                                <Input value={formData.centro} disabled className="bg-neutral-950 border-neutral-800" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Tipo de Fornecedor</Label>
                                                <Select value={formData.tipo_fornecedor} onValueChange={(v: any) => handleChange('tipo_fornecedor', v)}>
                                                    <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-neutral-900 border-neutral-800">
                                                        {TIPO_FORNECEDOR_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-white focus:bg-neutral-800">{o.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Nome Fantasia *</Label>
                                                <Input value={formData.nome_fantasia} onChange={e => handleChange('nome_fantasia', e.target.value)} className="bg-neutral-950 border-neutral-800" />
                                                {errors.nome_fantasia && <p className="text-xs text-red-500">{errors.nome_fantasia}</p>}
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Razão Social *</Label>
                                                <Input value={formData.razao_social} onChange={e => handleChange('razao_social', e.target.value)} className="bg-neutral-950 border-neutral-800" />
                                                {errors.razao_social && <p className="text-xs text-red-500">{errors.razao_social}</p>}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Switch checked={formData.ativo} onCheckedChange={c => handleChange('ativo', c)} />
                                                    <Label>Ativo</Label>
                                                </div>
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    value: 'fiscal',
                                    label: 'Dados Fiscais',
                                    icon: <FileText className="h-4 w-4" />,
                                    content: (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {formData.tipo_fornecedor === 'PESSOA_JURIDICA' ? (
                                                <div className="space-y-1">
                                                    <Label>CNPJ *</Label>
                                                    <Input value={formData.cnpj} onChange={e => handleChange('cnpj', e.target.value)} className="bg-neutral-950 border-neutral-800" placeholder="00.000.000/0000-00" />
                                                    {errors.cnpj && <p className="text-xs text-red-500">{errors.cnpj}</p>}
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <Label>CPF *</Label>
                                                    <Input value={formData.cpf} onChange={e => handleChange('cpf', e.target.value)} className="bg-neutral-950 border-neutral-800" placeholder="000.000.000-00" />
                                                    {errors.cpf && <p className="text-xs text-red-500">{errors.cpf}</p>}
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <Label>Inscrição Estadual</Label>
                                                <Input value={formData.inscricao_estadual} onChange={e => handleChange('inscricao_estadual', e.target.value)} className="bg-neutral-950 border-neutral-800" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Inscrição Municipal</Label>
                                                <Input value={formData.inscricao_municipal} onChange={e => handleChange('inscricao_municipal', e.target.value)} className="bg-neutral-950 border-neutral-800" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Regime Tributário</Label>
                                                <Select value={formData.regime_tributario} onValueChange={(v: any) => handleChange('regime_tributario', v)}>
                                                    <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-neutral-900 border-neutral-800">
                                                        {REGIME_TRIBUTARIO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-white focus:bg-neutral-800">{o.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 mt-6">
                                                    <Switch checked={formData.substituicao_tributaria} onCheckedChange={c => handleChange('substituicao_tributaria', c)} />
                                                    <Label>Substituição Tributária</Label>
                                                </div>
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    value: 'enderecos',
                                    label: 'Endereços',
                                    icon: <MapPin className="h-4 w-4" />,
                                    content: (
                                        <div className="space-y-6">
                                            <div className="grid gap-4 p-4 border border-neutral-800 rounded-lg bg-neutral-900/50">
                                                <h4 className="font-medium text-neutral-300">Novo Endereço</h4>
                                                <div className="grid gap-3 sm:grid-cols-3">
                                                    <div className="space-y-1">
                                                        <Label>CEP</Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                value={newAddress.cep}
                                                                onChange={e => setNewAddress({ ...newAddress, cep: e.target.value })}
                                                                onBlur={handleCEPBlur}
                                                                className="bg-neutral-950 border-neutral-800"
                                                                placeholder="00000-000"
                                                            />
                                                            {isAddressLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1 sm:col-span-2">
                                                        <Label>Logradouro</Label>
                                                        <Input value={newAddress.logradouro} onChange={e => setNewAddress({ ...newAddress, logradouro: e.target.value })} className="bg-neutral-950 border-neutral-800" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>Número</Label>
                                                        <Input value={newAddress.numero} onChange={e => setNewAddress({ ...newAddress, numero: e.target.value })} className="bg-neutral-950 border-neutral-800" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>Complemento</Label>
                                                        <Input value={newAddress.complemento} onChange={e => setNewAddress({ ...newAddress, complemento: e.target.value })} className="bg-neutral-950 border-neutral-800" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>Bairro</Label>
                                                        <Input value={newAddress.bairro} onChange={e => setNewAddress({ ...newAddress, bairro: e.target.value })} className="bg-neutral-950 border-neutral-800" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>Cidade</Label>
                                                        <Input value={newAddress.cidade} onChange={e => setNewAddress({ ...newAddress, cidade: e.target.value })} className="bg-neutral-950 border-neutral-800" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>Estado</Label>
                                                        <Input value={newAddress.estado} onChange={e => setNewAddress({ ...newAddress, estado: e.target.value })} className="bg-neutral-950 border-neutral-800" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>Tipo</Label>
                                                        <Select value={newAddress.tipo_endereco} onValueChange={(v: any) => setNewAddress({ ...newAddress, tipo_endereco: v })}>
                                                            <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue /></SelectTrigger>
                                                            <SelectContent className="bg-neutral-900 border-neutral-800">
                                                                {TIPO_ENDERECO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-white focus:bg-neutral-800">{o.label}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <Button type="button" onClick={handleAddAddress} variant="secondary" size="sm" className="w-fit">Adicionar Endereço</Button>
                                            </div>

                                            <div className="space-y-2">
                                                {addresses.map((addr, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 border border-neutral-800 rounded bg-neutral-950">
                                                        <div className="text-sm">
                                                            <div className="font-medium text-white">{addr.logradouro}, {addr.numero}</div>
                                                            <div className="text-neutral-400">{addr.bairro} - {addr.cidade}/{addr.estado}</div>
                                                            <div className="text-xs text-neutral-500 mt-1">{addr.tipo_endereco}</div>
                                                        </div>
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => setAddresses(addresses.filter((_, i) => i !== idx))}>
                                                            <Trash2 className="h-4 w-4 text-red-400" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    value: 'contatos',
                                    label: 'Contatos',
                                    icon: <Users className="h-4 w-4" />,
                                    content: (
                                        <div className="space-y-6">
                                            <div className="grid gap-4 p-4 border border-neutral-800 rounded-lg bg-neutral-900/50">
                                                <h4 className="font-medium text-neutral-300">Novo Contato</h4>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div className="space-y-1">
                                                        <Label>Nome</Label>
                                                        <Input value={newContact.nome} onChange={e => setNewContact({ ...newContact, nome: e.target.value })} className="bg-neutral-950 border-neutral-800" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>Email</Label>
                                                        <Input value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} className="bg-neutral-950 border-neutral-800" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>Telefone</Label>
                                                        <Input value={newContact.telefone} onChange={e => setNewContact({ ...newContact, telefone: e.target.value })} className="bg-neutral-950 border-neutral-800" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>Cargo</Label>
                                                        <Input value={newContact.cargo} onChange={e => setNewContact({ ...newContact, cargo: e.target.value })} className="bg-neutral-950 border-neutral-800" />
                                                    </div>
                                                </div>
                                                <Button type="button" onClick={handleAddContact} variant="secondary" size="sm" className="w-fit">Adicionar Contato</Button>
                                            </div>
                                            <div className="space-y-2">
                                                {contacts.map((ct, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 border border-neutral-800 rounded bg-neutral-950">
                                                        <div className="text-sm">
                                                            <div className="font-medium text-white">{ct.nome}</div>
                                                            <div className="text-neutral-400">{ct.email}</div>
                                                            <div className="text-xs text-neutral-500 mt-1">{ct.cargo}</div>
                                                        </div>
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => setContacts(contacts.filter((_, i) => i !== idx))}>
                                                            <Trash2 className="h-4 w-4 text-red-400" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    value: 'financeiro',
                                    label: 'Informações Financeiras',
                                    icon: <DollarSign className="h-4 w-4" />,
                                    content: (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-1">
                                                <Label>Prazo de Pagamento (dias)</Label>
                                                <Input type="number" value={formData.prazo_pagamento} onChange={e => handleChange('prazo_pagamento', parseInt(e.target.value))} className="bg-neutral-950 border-neutral-800" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Tipo de Pagamento</Label>
                                                <Select value={formData.tipo_pagamento_favorito} onValueChange={(v: any) => handleChange('tipo_pagamento_favorito', v)}>
                                                    <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-neutral-900 border-neutral-800">
                                                        {TIPO_PAGAMENTO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-white focus:bg-neutral-800">{o.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {formData.tipo_pagamento_favorito === 'PIX' && (
                                                <div className="space-y-1 sm:col-span-2">
                                                    <Label>Chave PIX *</Label>
                                                    <Input value={formData.chave_pix} onChange={e => handleChange('chave_pix', e.target.value)} className="bg-neutral-950 border-neutral-800" />
                                                    {errors.chave_pix && <p className="text-xs text-red-500">{errors.chave_pix}</p>}
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <Label>Banco</Label>
                                                <Input value={formData.banco_nome} onChange={e => handleChange('banco_nome', e.target.value)} className="bg-neutral-950 border-neutral-800" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Agência</Label>
                                                <Input value={formData.banco_agencia} onChange={e => handleChange('banco_agencia', e.target.value)} className="bg-neutral-950 border-neutral-800" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Conta</Label>
                                                <Input value={formData.banco_conta} onChange={e => handleChange('banco_conta', e.target.value)} className="bg-neutral-950 border-neutral-800" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Tipo de Conta</Label>
                                                <Select value={formData.banco_tipo_conta} onValueChange={(v: any) => handleChange('banco_tipo_conta', v)}>
                                                    <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-neutral-900 border-neutral-800">
                                                        {TIPO_CONTA_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-white focus:bg-neutral-800">{o.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    value: 'comercial',
                                    label: 'Dados Comerciais',
                                    icon: <Briefcase className="h-4 w-4" />,
                                    content: (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-1">
                                                <Label>Categoria</Label>
                                                <Select value={formData.categoria_fornecedor} onValueChange={(v: any) => handleChange('categoria_fornecedor', v)}>
                                                    <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-neutral-900 border-neutral-800">
                                                        {CATEGORIA_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-white focus:bg-neutral-800">{o.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Risco</Label>
                                                <Select value={formData.classificacao_risco} onValueChange={(v: any) => handleChange('classificacao_risco', v)}>
                                                    <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-neutral-900 border-neutral-800">
                                                        {CLASSIFICACAO_RISCO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-white focus:bg-neutral-800">{o.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Avaliação (1-5)</Label>
                                                <Input type="number" min="1" max="5" value={formData.avaliacao} onChange={e => handleChange('avaliacao', parseInt(e.target.value))} className="bg-neutral-950 border-neutral-800" />
                                            </div>
                                            <div className="space-y-1 sm:col-span-2">
                                                <Label>Observações Comerciais</Label>
                                                <Textarea value={formData.observacoes_comerciais} onChange={e => handleChange('observacoes_comerciais', e.target.value)} className="bg-neutral-950 border-neutral-800" />
                                            </div>
                                        </div>
                                    ),
                                },
                            ]}
                        />
                        <div className="flex justify-end gap-2 mt-6">
                            <Button type="button" variant="ghost" onClick={() => setIsFormDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppContainer>
    );
}
