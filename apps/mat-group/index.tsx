'use client';

import { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/session';
import { useToast } from '@/hooks/use-toast';
import {
  MatGroupAPI,
  MatGroup,
  MatCategory,
  MatSubCategory,
  CreateMatGroupData,
  CreateMatCategoryData,
  CreateMatSubCategoryData,
} from '@/lib/api/mat-group';
import { EmpresaAPI } from '@/lib/api/empresa';
import { AppContainer } from '@/components/apps/common/AppContainer';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Layers,
  Grid3x3,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

type EntityType = 'group' | 'category' | 'subcategory';

export default function MatGroupApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Data
  const [groups, setGroups] = useState<MatGroup[]>([]);
  const [categories, setCategories] = useState<MatCategory[]>([]);
  const [subCategories, setSubCategories] = useState<MatSubCategory[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');

  // Modais
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentEntityType, setCurrentEntityType] = useState<EntityType>('group');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Form data
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    group_id: '',
    category_id: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const { token } = useSessionStore();
  const { toast } = useToast();

  useEffect(() => {
    loadEmpresa();
  }, [token]);

  useEffect(() => {
    if (empresaId) {
      loadAllData();
    }
  }, [empresaId, token]);

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

  const loadAllData = async () => {
    if (!token || !empresaId) return;

    try {
      setIsLoading(true);
      const [groupsData, categoriesData, subCategoriesData] = await Promise.all([
        MatGroupAPI.getGroups(token, empresaId),
        MatGroupAPI.getCategories(token),
        MatGroupAPI.getSubCategories(token),
      ]);

      setGroups(groupsData);
      setCategories(categoriesData);
      setSubCategories(subCategoriesData);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar dados',
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

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.code || formData.code.length < 2) {
      newErrors.code = 'Código deve ter pelo menos 2 caracteres';
    }

    if (!formData.description || formData.description.length < 3) {
      newErrors.description = 'Descrição deve ter pelo menos 3 caracteres';
    }

    if (currentEntityType === 'category' && !formData.group_id) {
      newErrors.group_id = 'Grupo é obrigatório';
    }

    if (currentEntityType === 'subcategory' && !formData.category_id) {
      newErrors.category_id = 'Categoria é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenFormDialog = (type: EntityType, item?: any) => {
    setCurrentEntityType(type);
    setEditingItem(item || null);

    if (item) {
      setFormData({
        code: item.code,
        description: item.description,
        group_id: item.group_id || '',
        category_id: item.category_id || '',
      });
    } else {
      setFormData({
        code: '',
        description: '',
        group_id: type === 'category' && selectedGroupFilter ? selectedGroupFilter : '',
        category_id: type === 'subcategory' && selectedCategoryFilter ? selectedCategoryFilter : '',
      });
    }

    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setIsFormDialogOpen(false);
    setEditingItem(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !empresaId) return;

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

      if (currentEntityType === 'group') {
        if (editingItem) {
          await MatGroupAPI.updateGroup(token, editingItem.uuid, {
            description: formData.description,
          });
          toast({
            title: 'Grupo atualizado',
            description: 'O grupo foi atualizado com sucesso',
          });
        } else {
          await MatGroupAPI.createGroup(token, {
            code: formData.code,
            description: formData.description,
            empresa_id: empresaId,
          });
          toast({
            title: 'Grupo criado',
            description: 'O grupo foi criado com sucesso',
          });
        }
      } else if (currentEntityType === 'category') {
        if (editingItem) {
          await MatGroupAPI.updateCategory(token, editingItem.uuid, {
            description: formData.description,
          });
          toast({
            title: 'Categoria atualizada',
            description: 'A categoria foi atualizada com sucesso',
          });
        } else {
          await MatGroupAPI.createCategory(token, {
            code: formData.code,
            description: formData.description,
            group_id: formData.group_id,
          });
          toast({
            title: 'Categoria criada',
            description: 'A categoria foi criada com sucesso',
          });
        }
      } else if (currentEntityType === 'subcategory') {
        if (editingItem) {
          await MatGroupAPI.updateSubCategory(token, editingItem.uuid, {
            description: formData.description,
          });
          toast({
            title: 'Subcategoria atualizada',
            description: 'A subcategoria foi atualizada com sucesso',
          });
        } else {
          await MatGroupAPI.createSubCategory(token, {
            code: formData.code,
            description: formData.description,
            category_id: formData.category_id,
          });
          toast({
            title: 'Subcategoria criada',
            description: 'A subcategoria foi criada com sucesso',
          });
        }
      }

      handleCloseFormDialog();
      loadAllData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (type: EntityType, item: any) => {
    setCurrentEntityType(type);
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!token || !itemToDelete) return;

    try {
      if (currentEntityType === 'group') {
        await MatGroupAPI.deleteGroup(token, itemToDelete.uuid);
        toast({
          title: 'Grupo deletado',
          description: 'O grupo foi deletado com sucesso',
        });
      } else if (currentEntityType === 'category') {
        await MatGroupAPI.deleteCategory(token, itemToDelete.uuid);
        toast({
          title: 'Categoria deletada',
          description: 'A categoria foi deletada com sucesso',
        });
      } else if (currentEntityType === 'subcategory') {
        await MatGroupAPI.deleteSubCategory(token, itemToDelete.uuid);
        toast({
          title: 'Subcategoria deletada',
          description: 'A subcategoria foi deletada com sucesso',
        });
      }

      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      loadAllData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar',
        variant: 'destructive',
      });
    }
  };

  const getFilteredGroups = () => {
    if (!searchTerm) return groups;
    return groups.filter(
      (g) =>
        g.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredCategories = () => {
    let filtered = categories;

    if (selectedGroupFilter) {
      filtered = filtered.filter((c) => c.group_id === selectedGroupFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getFilteredSubCategories = () => {
    let filtered = subCategories;

    if (selectedCategoryFilter) {
      filtered = filtered.filter((s) => s.category_id === selectedCategoryFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find((g) => g.uuid === groupId);
    return group ? `${group.code} - ${group.description}` : groupId;
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.uuid === categoryId);
    return category ? `${category.code} - ${category.description}` : categoryId;
  };

  const getFormTitle = () => {
    if (currentEntityType === 'group') {
      return editingItem ? 'Editar Grupo' : 'Novo Grupo';
    } else if (currentEntityType === 'category') {
      return editingItem ? 'Editar Categoria' : 'Nova Categoria';
    } else {
      return editingItem ? 'Editar Subcategoria' : 'Nova Subcategoria';
    }
  };

  if (isLoading) {
    return (
      <AppContainer>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-neutral-400">Carregando grupos de materiais...</p>
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
          <p className="text-sm text-neutral-500">Configure uma empresa para gerenciar grupos de materiais</p>
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer
      title="Grupos de Materiais"
      description="Gerencie grupos, categorias e subcategorias de materiais"
    >
      <Tabs defaultValue="groups" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-neutral-900 border border-neutral-800">
          <TabsTrigger
            value="groups"
            className="text-neutral-400 data-[state=active]:text-white data-[state=active]:bg-neutral-800"
          >
            <Package className="h-4 w-4 mr-2" />
            Grupos
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="text-neutral-400 data-[state=active]:text-white data-[state=active]:bg-neutral-800"
          >
            <Layers className="h-4 w-4 mr-2" />
            Categorias
          </TabsTrigger>
          <TabsTrigger
            value="subcategories"
            className="text-neutral-400 data-[state=active]:text-white data-[state=active]:bg-neutral-800"
          >
            <Grid3x3 className="h-4 w-4 mr-2" />
            Subcategorias
          </TabsTrigger>
        </TabsList>

        {/* GRUPOS */}
        <TabsContent value="groups" className="mt-4">
          <Card className="border-neutral-800 bg-neutral-900 p-6">
            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Buscar por código ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-neutral-950 border-neutral-800 text-white"
                  />
                </div>
                <Button onClick={() => handleOpenFormDialog('group')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Grupo
                </Button>
              </div>

              {getFilteredGroups().length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-400">
                    {searchTerm ? 'Nenhum grupo encontrado' : 'Nenhum grupo cadastrado'}
                  </p>
                  {!searchTerm && (
                    <p className="text-sm text-neutral-500 mt-2">
                      Clique em "Novo Grupo" para criar seu primeiro grupo
                    </p>
                  )}
                </div>
              ) : (
                <div className="border border-neutral-800 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-neutral-800 hover:bg-neutral-800/50">
                        <TableHead className="text-neutral-300">Código</TableHead>
                        <TableHead className="text-neutral-300">Descrição</TableHead>
                        <TableHead className="text-neutral-300">Data de Criação</TableHead>
                        <TableHead className="text-neutral-300 text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredGroups().map((group) => (
                        <TableRow
                          key={group.uuid}
                          className="border-neutral-800 hover:bg-neutral-800/30"
                        >
                          <TableCell className="text-white font-mono text-sm font-medium">
                            {group.code}
                          </TableCell>
                          <TableCell className="text-white">{group.description}</TableCell>
                          <TableCell className="text-neutral-300 text-sm">
                            {group.created_at
                              ? new Date(group.created_at).toLocaleDateString('pt-BR')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenFormDialog('group', group)}
                                className="h-8 w-8 p-0"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick('group', group)}
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
          </Card>
        </TabsContent>

        {/* CATEGORIAS */}
        <TabsContent value="categories" className="mt-4">
          <Card className="border-neutral-800 bg-neutral-900 p-6">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Buscar por código ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-neutral-950 border-neutral-800 text-white"
                  />
                </div>

                <Select value={selectedGroupFilter} onValueChange={setSelectedGroupFilter}>
                  <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white w-full sm:w-64">
                    <SelectValue placeholder="Filtrar por grupo" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
                    <SelectItem value=" " className="text-white focus:bg-neutral-800">
                      Todos os grupos
                    </SelectItem>
                    {groups.map((group) => (
                      <SelectItem
                        key={group.uuid}
                        value={group.uuid}
                        className="text-white focus:bg-neutral-800"
                      >
                        {group.code} - {group.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button onClick={() => handleOpenFormDialog('category')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Categoria
                </Button>
              </div>

              {getFilteredCategories().length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-400">
                    {searchTerm || selectedGroupFilter
                      ? 'Nenhuma categoria encontrada'
                      : 'Nenhuma categoria cadastrada'}
                  </p>
                  {!searchTerm && !selectedGroupFilter && (
                    <p className="text-sm text-neutral-500 mt-2">
                      Clique em "Nova Categoria" para criar sua primeira categoria
                    </p>
                  )}
                </div>
              ) : (
                <div className="border border-neutral-800 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-neutral-800 hover:bg-neutral-800/50">
                        <TableHead className="text-neutral-300">Código</TableHead>
                        <TableHead className="text-neutral-300">Descrição</TableHead>
                        <TableHead className="text-neutral-300">Grupo</TableHead>
                        <TableHead className="text-neutral-300">Data de Criação</TableHead>
                        <TableHead className="text-neutral-300 text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredCategories().map((category) => (
                        <TableRow
                          key={category.uuid}
                          className="border-neutral-800 hover:bg-neutral-800/30"
                        >
                          <TableCell className="text-white font-mono text-sm font-medium">
                            {category.code}
                          </TableCell>
                          <TableCell className="text-white">{category.description}</TableCell>
                          <TableCell className="text-neutral-300 text-sm">
                            {category.group_id ? getGroupName(category.group_id) : '-'}
                          </TableCell>
                          <TableCell className="text-neutral-300 text-sm">
                            {category.created_at
                              ? new Date(category.created_at).toLocaleDateString('pt-BR')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenFormDialog('category', category)}
                                className="h-8 w-8 p-0"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick('category', category)}
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
          </Card>
        </TabsContent>

        {/* SUBCATEGORIAS */}
        <TabsContent value="subcategories" className="mt-4">
          <Card className="border-neutral-800 bg-neutral-900 p-6">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Buscar por código ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-neutral-950 border-neutral-800 text-white"
                  />
                </div>

                <Select
                  value={selectedCategoryFilter}
                  onValueChange={setSelectedCategoryFilter}
                >
                  <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white w-full sm:w-64">
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
                    <SelectItem value=" " className="text-white focus:bg-neutral-800">
                      Todas as categorias
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.uuid}
                        value={category.uuid}
                        className="text-white focus:bg-neutral-800"
                      >
                        {category.code} - {category.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button onClick={() => handleOpenFormDialog('subcategory')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Subcategoria
                </Button>
              </div>

              {getFilteredSubCategories().length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-400">
                    {searchTerm || selectedCategoryFilter
                      ? 'Nenhuma subcategoria encontrada'
                      : 'Nenhuma subcategoria cadastrada'}
                  </p>
                  {!searchTerm && !selectedCategoryFilter && (
                    <p className="text-sm text-neutral-500 mt-2">
                      Clique em "Nova Subcategoria" para criar sua primeira subcategoria
                    </p>
                  )}
                </div>
              ) : (
                <div className="border border-neutral-800 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-neutral-800 hover:bg-neutral-800/50">
                        <TableHead className="text-neutral-300">Código</TableHead>
                        <TableHead className="text-neutral-300">Descrição</TableHead>
                        <TableHead className="text-neutral-300">Categoria</TableHead>
                        <TableHead className="text-neutral-300">Data de Criação</TableHead>
                        <TableHead className="text-neutral-300 text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredSubCategories().map((subcategory) => (
                        <TableRow
                          key={subcategory.uuid}
                          className="border-neutral-800 hover:bg-neutral-800/30"
                        >
                          <TableCell className="text-white font-mono text-sm font-medium">
                            {subcategory.code}
                          </TableCell>
                          <TableCell className="text-white">{subcategory.description}</TableCell>
                          <TableCell className="text-neutral-300 text-sm">
                            {subcategory.category_id
                              ? getCategoryName(subcategory.category_id)
                              : '-'}
                          </TableCell>
                          <TableCell className="text-neutral-300 text-sm">
                            {subcategory.created_at
                              ? new Date(subcategory.created_at).toLocaleDateString('pt-BR')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenFormDialog('subcategory', subcategory)}
                                className="h-8 w-8 p-0"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick('subcategory', subcategory)}
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
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de formulário */}
      <Dialog open={isFormDialogOpen} onOpenChange={handleCloseFormDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{getFormTitle()}</DialogTitle>
            <DialogDescription className="text-neutral-400">
              {editingItem
                ? 'Atualize as informações'
                : `Preencha os dados para criar ${
                    currentEntityType === 'group'
                      ? 'um novo grupo'
                      : currentEntityType === 'category'
                      ? 'uma nova categoria'
                      : 'uma nova subcategoria'
                  }`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-neutral-300">
                  Código {!editingItem && '*'}
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  className="bg-neutral-950 border-neutral-800 text-white"
                  placeholder="Ex: GRP-001"
                  disabled={!!editingItem}
                />
                {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
                {editingItem && (
                  <p className="text-xs text-neutral-500">O código não pode ser alterado</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-neutral-300">
                  Descrição *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="bg-neutral-950 border-neutral-800 text-white"
                  placeholder="Descrição detalhada"
                  rows={3}
                />
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description}</p>
                )}
              </div>

              {currentEntityType === 'category' && !editingItem && (
                <div className="space-y-2">
                  <Label htmlFor="group_id" className="text-neutral-300">
                    Grupo *
                  </Label>
                  <Select
                    value={formData.group_id}
                    onValueChange={(value) => handleChange('group_id', value)}
                  >
                    <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white">
                      <SelectValue placeholder="Selecione o grupo" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                      {groups.map((group) => (
                        <SelectItem
                          key={group.uuid}
                          value={group.uuid}
                          className="text-white focus:bg-neutral-800"
                        >
                          {group.code} - {group.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.group_id && <p className="text-xs text-red-500">{errors.group_id}</p>}
                </div>
              )}

              {currentEntityType === 'subcategory' && !editingItem && (
                <div className="space-y-2">
                  <Label htmlFor="category_id" className="text-neutral-300">
                    Categoria *
                  </Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => handleChange('category_id', value)}
                  >
                    <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                      {categories.map((category) => (
                        <SelectItem
                          key={category.uuid}
                          value={category.uuid}
                          className="text-white focus:bg-neutral-800"
                        >
                          {category.code} - {category.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-xs text-red-500">{errors.category_id}</p>
                  )}
                </div>
              )}
            </div>

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
                  <>{editingItem ? 'Atualizar' : 'Criar'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para deletar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Tem certeza que deseja deletar{' '}
              {currentEntityType === 'group'
                ? 'o grupo'
                : currentEntityType === 'category'
                ? 'a categoria'
                : 'a subcategoria'}{' '}
              <strong>"{itemToDelete?.code} - {itemToDelete?.description}"</strong>? Esta ação não pode
              ser desfeita.
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
