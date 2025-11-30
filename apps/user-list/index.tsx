'use client';

import { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/session';
import { useToast } from '@/hooks/use-toast';
import { UsersAPI, User, UpdateUserData } from '@/lib/api/users';
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
import {
  Loader2,
  Pencil,
  Trash2,
  Power,
  Search,
  CheckCircle2,
  XCircle,
  Circle,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { formatCEP } from '@/lib/validators';

const ROLES = [
  { value: 'user', label: 'Usuário' },
  { value: 'admin', label: 'Administrador' },
  { value: 'master', label: 'Master' },
];

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function UserListApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isKillSessionsDialogOpen, setIsKillSessionsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToKillSessions, setUserToKillSessions] = useState<User | null>(null);

  const [formData, setFormData] = useState<UpdateUserData>({
    nome: '',
    email: '',
    role: 'user',
    active: true,
    cargo: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { token } = useSessionStore();
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, [token]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const data = await UsersAPI.getUsers(token);
      setUsers(data);
      setFilteredUsers(data);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof UpdateUserData, value: any) => {
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

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenEditDialog = async (user: User) => {
    if (!token) return;

    try {
      setIsLoadingDetails(true);
      setIsEditDialogOpen(true);

      // Buscar detalhes completos do usuário
      const userDetails = await UsersAPI.getUser(token, user.uuid);

      setEditingUser(userDetails);
      setFormData({
        nome: userDetails.nome,
        email: userDetails.email,
        role: userDetails.role,
        active: userDetails.active,
        cargo: userDetails.cargo || '',
        cep: userDetails.cep || '',
        rua: userDetails.rua || '',
        numero: userDetails.numero || '',
        complemento: userDetails.complemento || '',
        bairro: userDetails.bairro || '',
        cidade: userDetails.cidade || '',
        uf: userDetails.uf || '',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar detalhes do usuário',
        variant: 'destructive',
      });
      setIsEditDialogOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingUser(null);
    setFormData({
      nome: '',
      email: '',
      role: 'user',
      active: true,
      cargo: '',
      cep: '',
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
    });
    setErrors({});
  };

  const handleCEPChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    handleChange('cep', cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !editingUser) return;

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

      await UsersAPI.updateUser(token, editingUser.uuid, formData);

      toast({
        title: 'Usuário atualizado',
        description: 'Os dados do usuário foram atualizados com sucesso',
      });

      handleCloseEditDialog();
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar usuário',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!token || !userToDelete) return;

    try {
      await UsersAPI.deleteUser(token, userToDelete.uuid);
      toast({
        title: 'Usuário deletado',
        description: 'O usuário foi deletado com sucesso',
      });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar usuário',
        variant: 'destructive',
      });
    }
  };

  const handleKillSessionsClick = (user: User) => {
    setUserToKillSessions(user);
    setIsKillSessionsDialogOpen(true);
  };

  const handleKillSessions = async () => {
    if (!token || !userToKillSessions) return;

    try {
      await UsersAPI.killSessions(token, userToKillSessions.uuid);
      toast({
        title: 'Sessões encerradas',
        description: 'Todas as sessões do usuário foram encerradas',
      });
      setIsKillSessionsDialogOpen(false);
      setUserToKillSessions(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao encerrar sessões',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: { [key: string]: { label: string; className: string } } = {
      master: { label: 'Master', className: 'bg-purple-500/20 text-purple-400' },
      admin: { label: 'Admin', className: 'bg-blue-500/20 text-blue-400' },
      user: { label: 'Usuário', className: 'bg-neutral-500/20 text-neutral-400' },
    };

    const config = roleConfig[role] || roleConfig.user;
    return (
      <Badge variant="outline" className={`${config.className} border-0`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <AppContainer>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-neutral-400">Carregando usuários...</p>
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer
      title="Gerenciar Usuários"
      description="Visualize e gerencie os usuários do sistema"
    >
      <div className="space-y-6">
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Buscar por nome, login ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-neutral-950 border-neutral-800 text-white"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400">
              {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            </p>
          </div>
        ) : (
          <div className="border border-neutral-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800 hover:bg-neutral-800/50">
                  <TableHead className="text-neutral-300">Status</TableHead>
                  <TableHead className="text-neutral-300">Nome</TableHead>
                  <TableHead className="text-neutral-300">Login</TableHead>
                  <TableHead className="text-neutral-300">Email</TableHead>
                  <TableHead className="text-neutral-300">Nível</TableHead>
                  <TableHead className="text-neutral-300">Cargo</TableHead>
                  <TableHead className="text-neutral-300 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow
                    key={user.uuid}
                    className="border-neutral-800 hover:bg-neutral-800/30"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.online ? (
                          <Circle className="h-3 w-3 fill-green-500 text-green-500" title="Online" />
                        ) : (
                          <Circle className="h-3 w-3 fill-neutral-600 text-neutral-600" title="Offline" />
                        )}
                        {user.active ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" title="Ativo" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" title="Inativo" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {user.nome}
                    </TableCell>
                    <TableCell className="text-neutral-300 font-mono text-sm">
                      {user.login}
                    </TableCell>
                    <TableCell className="text-neutral-300 text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-neutral-300 text-sm">
                      {user.cargo || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditDialog(user)}
                          className="h-8 w-8 p-0"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {user.online && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleKillSessionsClick(user)}
                            className="h-8 w-8 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                            title="Derrubar sessões"
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
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

      {/* Dialog para editar usuário */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="nome" className="text-neutral-300 text-sm">
                    Nome Completo *
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    className="bg-neutral-950 border-neutral-800 text-white h-9"
                  />
                  {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-neutral-300 text-sm">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="bg-neutral-950 border-neutral-800 text-white h-9"
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="role" className="text-neutral-300 text-sm">
                    Nível de Acesso
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleChange('role', value)}
                  >
                    <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                      {ROLES.map((role) => (
                        <SelectItem
                          key={role.value}
                          value={role.value}
                          className="text-white focus:bg-neutral-800"
                        >
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="cargo" className="text-neutral-300 text-sm">
                    Cargo
                  </Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => handleChange('cargo', e.target.value)}
                    className="bg-neutral-950 border-neutral-800 text-white h-9"
                    placeholder="Ex: Gerente de Vendas"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="border-t border-neutral-800 pt-3 pb-1">
                    <h4 className="text-sm font-medium text-white">Endereço</h4>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cep" className="text-neutral-300 text-sm">
                    CEP
                  </Label>
                  <Input
                    id="cep"
                    value={formatCEP(formData.cep || '')}
                    onChange={(e) => handleCEPChange(e.target.value)}
                    className="bg-neutral-950 border-neutral-800 text-white h-9"
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rua" className="text-neutral-300 text-sm">
                    Rua
                  </Label>
                  <Input
                    id="rua"
                    value={formData.rua}
                    onChange={(e) => handleChange('rua', e.target.value)}
                    className="bg-neutral-950 border-neutral-800 text-white h-9"
                    placeholder="Ex: Rua das Flores"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="numero" className="text-neutral-300 text-sm">
                    Número
                  </Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => handleChange('numero', e.target.value)}
                    className="bg-neutral-950 border-neutral-800 text-white h-9"
                    placeholder="123"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="complemento" className="text-neutral-300 text-sm">
                    Complemento
                  </Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) => handleChange('complemento', e.target.value)}
                    className="bg-neutral-950 border-neutral-800 text-white h-9"
                    placeholder="Ex: Apto 101"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bairro" className="text-neutral-300 text-sm">
                    Bairro
                  </Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => handleChange('bairro', e.target.value)}
                    className="bg-neutral-950 border-neutral-800 text-white h-9"
                    placeholder="Ex: Centro"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cidade" className="text-neutral-300 text-sm">
                    Cidade
                  </Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => handleChange('cidade', e.target.value)}
                    className="bg-neutral-950 border-neutral-800 text-white h-9"
                    placeholder="Ex: São Paulo"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="uf" className="text-neutral-300 text-sm">
                    UF
                  </Label>
                  <Select
                    value={formData.uf}
                    onValueChange={(value) => handleChange('uf', value)}
                  >
                    <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                      {ESTADOS_BR.map((estado) => (
                        <SelectItem
                          key={estado}
                          value={estado}
                          className="text-white focus:bg-neutral-800"
                        >
                          {estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => handleChange('active', checked)}
                    />
                    <Label htmlFor="active" className="text-neutral-300 text-sm cursor-pointer">
                      Usuário ativo
                    </Label>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={handleCloseEditDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
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
              Tem certeza que deseja deletar o usuário <strong>"{userToDelete?.nome}"</strong>?
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

      {/* Dialog de confirmação para derrubar sessões */}
      <AlertDialog open={isKillSessionsDialogOpen} onOpenChange={setIsKillSessionsDialogOpen}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Derrubar sessões</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Tem certeza que deseja encerrar todas as sessões do usuário{' '}
              <strong>"{userToKillSessions?.nome}"</strong>? O usuário será desconectado
              imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKillSessions}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Encerrar Sessões
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppContainer>
  );
}
