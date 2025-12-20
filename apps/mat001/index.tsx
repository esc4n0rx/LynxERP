'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSessionStore } from '@/store/session';
import { useToast } from '@/hooks/use-toast';
import { AppContainer } from '@/components/apps/common/AppContainer';
import { Loader2, Plus, Upload, Filter, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MaterialAPI, Material } from '@/lib/api/material';
import { DepositAPI, Deposit } from '@/lib/api/wm-deposit';
import { MatGroupAPI, MatGroup } from '@/lib/api/mat-group';
import { MaterialFormModal } from './MaterialFormModal';
import { MaterialUploadModal } from './MaterialUploadModal';

const ITEMS_PER_PAGE = 20;

export default function Mat001() {
    const [isLoading, setIsLoading] = useState(true);
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [groups, setGroups] = useState<MatGroup[]>([]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [depositFilter, setDepositFilter] = useState<string>('all');

    // Pagination
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

    const { token } = useSessionStore();
    const { toast } = useToast();

    const loadAuxiliaryData = async () => {
        if (!token) return;
        try {
            const [depositsData, groupsData] = await Promise.all([
                DepositAPI.getDeposits(token),
                MatGroupAPI.getGroups(token)
            ]);
            setDeposits(depositsData);
            setGroups(groupsData);
        } catch (error: any) {
            console.error('Error loading aux data', error);
            toast({
                title: 'Erro',
                description: 'Falha ao carregar dados auxiliares',
                variant: 'destructive',
            });
        }
    };

    const loadMaterials = useCallback(async () => {
        if (!token) return;
        try {
            setIsTableLoading(true);
            const filters: any = {
                limit: ITEMS_PER_PAGE,
                offset: offset,
            };

            if (depositFilter !== 'all') filters.centro = depositFilter;
            if (statusFilter !== 'all') filters.ativo = statusFilter === 'active';
            if (search) filters.search = search;

            const data = await MaterialAPI.getAll(token, filters);
            setMaterials(data);
            setHasMore(data.length === ITEMS_PER_PAGE);
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Falha ao carregar materiais',
                variant: 'destructive',
            });
        } finally {
            setIsTableLoading(false);
            setIsLoading(false);
        }
    }, [token, offset, depositFilter, statusFilter, search, toast]);

    useEffect(() => {
        loadAuxiliaryData();
    }, [token]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadMaterials();
        }, 500);
        return () => clearTimeout(timer);
    }, [loadMaterials]);

    const getGroupName = (uuid: string) => {
        const group = groups.find(g => g.uuid === uuid);
        return group ? group.description : uuid;
    };

    const handleCreate = () => {
        setEditingMaterial(null);
        setIsModalOpen(true);
    };

    const handleEdit = (material: Material) => {
        setEditingMaterial(material);
        setIsModalOpen(true);
    };

    const handleDelete = async (material: Material) => {
        if (!confirm(`Tem certeza que deseja excluir o material ${material.codigo_material}?`)) return;

        try {
            await MaterialAPI.delete(token!, material.codigo_material);
            toast({ title: 'Sucesso', description: 'Material excluído com sucesso' });
            loadMaterials();
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message || 'Erro ao excluir material', variant: 'destructive' });
        }
    };

    if (isLoading) {
        return (
            <AppContainer title="Cadastro de Materiais">
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Carregando materiais...</p>
                </div>
            </AppContainer>
        );
    }

    return (
        <AppContainer
            title="Cadastro de Materiais"
            description="Gestão completa de materiais e produtos"
            className="h-full flex flex-col"
        >
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex flex-col md:flex-row gap-4 flex-1 w-full md:max-w-4xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por código ou descrição..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setOffset(0);
                            }}
                            className="pl-8"
                        />
                    </div>

                    <Select value={depositFilter} onValueChange={(v) => { setDepositFilter(v); setOffset(0); }}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Filtrar por Depósito" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Depósitos</SelectItem>
                            {deposits.map((dep) => (
                                <SelectItem key={dep.uuid} value={dep.codigo_deposito}>
                                    {dep.descricao}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setOffset(0); }}>
                        <SelectTrigger className="w-full md:w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none" onClick={() => setIsUploadModalOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                    </Button>
                    <Button className="flex-1 md:flex-none" onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Criar
                    </Button>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 border rounded-md overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Unidade</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Grupo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isTableLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : materials.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        Nenhum material encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                materials.map((material) => (
                                    <TableRow key={material.uuid}>
                                        <TableCell className="font-medium">{material.codigo_material}</TableCell>
                                        <TableCell>{material.descricao}</TableCell>
                                        <TableCell>{material.unidade_medida_basica}</TableCell>
                                        <TableCell>{material.tipo_material}</TableCell>
                                        <TableCell>{getGroupName(material.grupo_uuid)}</TableCell>
                                        <TableCell>
                                            <Badge variant={material.ativo ? 'default' : 'secondary'}>
                                                {material.ativo ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(material)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(material)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-end space-x-2 p-4 border-t bg-muted/20">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOffset(Math.max(0, offset - ITEMS_PER_PAGE))}
                        disabled={offset === 0 || isTableLoading}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOffset(offset + ITEMS_PER_PAGE)}
                        disabled={!hasMore || isTableLoading}
                    >
                        Próximo
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <MaterialFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={loadMaterials}
                materialToEdit={editingMaterial}
            />

            <MaterialUploadModal
                open={isUploadModalOpen}
                onOpenChange={setIsUploadModalOpen}
                onSuccess={loadMaterials}
            />
        </AppContainer>
    );
}
