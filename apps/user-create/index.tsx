'use client';

import { useState } from 'react';
import { useSessionStore } from '@/store/session';
import { useToast } from '@/hooks/use-toast';
import { UsersAPI, CreateUserData } from '@/lib/api/users';
import { AppContainer } from '@/components/apps/common/AppContainer';
import { FormSection } from '@/components/apps/common/FormSection';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Save, UserPlus, Copy, Check } from 'lucide-react';
import { validateCPF, formatCPF, formatCEP } from '@/lib/validators';

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const ROLES = [
  { value: 'user', label: 'Usuário' },
  { value: 'admin', label: 'Administrador' },
  { value: 'master', label: 'Master' },
];

export default function UserCreateApp() {
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [createdUserLogin, setCreatedUserLogin] = useState('');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<CreateUserData>({
    login: '',
    nome: '',
    email: '',
    cpf: '',
    role: 'user',
    cargo: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    allowed_modules: [],
    blocked_apps: [],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { token } = useSessionStore();
  const { toast } = useToast();

  const handleChange = (field: keyof CreateUserData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCPFChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    handleChange('cpf', cleaned);
  };

  const handleCEPChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    handleChange('cep', cleaned);
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.login || formData.login.length < 3) {
      newErrors.login = 'Login deve ter pelo menos 3 caracteres';
    }

    if (!formData.nome || formData.nome.length < 3) {
      newErrors.nome = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.cpf) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      login: '',
      nome: '',
      email: '',
      cpf: '',
      role: 'user',
      cargo: '',
      cep: '',
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      allowed_modules: [],
      blocked_apps: [],
    });
    setErrors({});
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      // Remove campos vazios opcionais
      const dataToSend = { ...formData };
      Object.keys(dataToSend).forEach((key) => {
        const value = dataToSend[key as keyof CreateUserData];
        if (value === '' || value === null || value === undefined) {
          delete dataToSend[key as keyof CreateUserData];
        }
      });

      const result = await UsersAPI.createUser(token, dataToSend);

      setTempPassword(result.temp_password);
      setCreatedUserLogin(result.login);
      setShowPasswordDialog(true);

      toast({
        title: 'Usuário criado',
        description: result.message || 'Usuário criado com sucesso',
      });

      resetForm();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar usuário',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppContainer
      title="Criar Usuário"
      description="Cadastre um novo usuário no sistema"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <FormSection
          title="Dados Gerais"
          description="Informações básicas do usuário"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="login" className="text-neutral-300">
                Login *
              </Label>
              <Input
                id="login"
                value={formData.login}
                onChange={(e) => handleChange('login', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Ex: joao.silva"
              />
              {errors.login && (
                <p className="text-xs text-red-500">{errors.login}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome" className="text-neutral-300">
                Nome Completo *
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Ex: João da Silva"
              />
              {errors.nome && (
                <p className="text-xs text-red-500">{errors.nome}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-300">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Ex: joao@empresa.com"
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf" className="text-neutral-300">
                CPF *
              </Label>
              <Input
                id="cpf"
                value={formatCPF(formData.cpf)}
                onChange={(e) => handleCPFChange(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="000.000.000-00"
              />
              {errors.cpf && (
                <p className="text-xs text-red-500">{errors.cpf}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-neutral-300">
                Nível de Acesso
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange('role', value)}
              >
                <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white">
                  <SelectValue placeholder="Selecione" />
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

            <div className="space-y-2">
              <Label htmlFor="cargo" className="text-neutral-300">
                Cargo
              </Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => handleChange('cargo', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Ex: Gerente de Vendas"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Endereço"
          description="Informações de localização (opcional)"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cep" className="text-neutral-300">
                CEP
              </Label>
              <Input
                id="cep"
                value={formatCEP(formData.cep || '')}
                onChange={(e) => handleCEPChange(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="00000-000"
                maxLength={9}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rua" className="text-neutral-300">
                Rua
              </Label>
              <Input
                id="rua"
                value={formData.rua}
                onChange={(e) => handleChange('rua', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Ex: Rua das Flores"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero" className="text-neutral-300">
                Número
              </Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleChange('numero', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="123"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="complemento" className="text-neutral-300">
                Complemento
              </Label>
              <Input
                id="complemento"
                value={formData.complemento}
                onChange={(e) => handleChange('complemento', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Ex: Apto 101"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro" className="text-neutral-300">
                Bairro
              </Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => handleChange('bairro', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Ex: Centro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade" className="text-neutral-300">
                Cidade
              </Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => handleChange('cidade', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Ex: São Paulo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf" className="text-neutral-300">
                UF
              </Label>
              <Select
                value={formData.uf}
                onValueChange={(value) => handleChange('uf', value)}
              >
                <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white">
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
          </div>
        </FormSection>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isSaving}
          >
            Limpar
          </Button>
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Criar Usuário
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Dialog com senha temporária */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-500" />
              Usuário Criado com Sucesso
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Anote a senha temporária abaixo. Ela será necessária no primeiro acesso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-neutral-300 text-sm">Login</Label>
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded font-mono text-white">
                {createdUserLogin}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-300 text-sm">Senha Temporária</Label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-neutral-950 border border-neutral-800 rounded font-mono text-white">
                  {tempPassword}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPassword}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <p className="text-sm text-yellow-400">
                <strong>Importante:</strong> Esta senha é temporária e deverá ser alterada no primeiro login.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowPasswordDialog(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppContainer>
  );
}
