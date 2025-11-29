'use client';

import { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/session';
import { useToast } from '@/hooks/use-toast';
import { EmpresaAPI, Empresa, CreateEmpresaData } from '@/lib/api/empresa';
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
import { Loader2, Save, Search } from 'lucide-react';
import {
  validateCNPJorCPF,
  formatCNPJorCPF,
  formatCEP,
} from '@/lib/validators';

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function ConfigEmpresaApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingCEP, setIsSearchingCEP] = useState(false);
  const [isGeneratingCliente, setIsGeneratingCliente] = useState(false);
  const [isGeneratingFornecedor, setIsGeneratingFornecedor] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [empresaUuid, setEmpresaUuid] = useState<string | null>(null);
  const [codigoCliente, setCodigoCliente] = useState<string | null>(null);
  const [codigoFornecedor, setCodigoFornecedor] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateEmpresaData>({
    nome_empresa: '',
    cnpj_cpf: '',
    inscricao_estadual: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    centro: '',
    warehouse_number: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { token } = useSessionStore();
  const { toast } = useToast();

  useEffect(() => {
    checkExistingEmpresa();
  }, [token]);

  const checkExistingEmpresa = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const empresas = await EmpresaAPI.getEmpresas(token);

      if (empresas.length > 0) {
        const empresa = empresas[0];
        setIsEditMode(true);
        setEmpresaUuid(empresa.uuid);
        setCodigoCliente(empresa.codigo_cliente || null);
        setCodigoFornecedor(empresa.codigo_fornecedor || null);
        setFormData({
          nome_empresa: empresa.nome_empresa,
          cnpj_cpf: empresa.cnpj_cpf,
          inscricao_estadual: empresa.inscricao_estadual || '',
          cep: empresa.cep,
          rua: empresa.rua,
          numero: empresa.numero,
          complemento: empresa.complemento || '',
          bairro: empresa.bairro,
          cidade: empresa.cidade,
          uf: empresa.uf,
          centro: empresa.centro,
          warehouse_number: empresa.warehouse_number,
        });
      }
    } catch (error: any) {
      console.error('Error checking empresa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof CreateEmpresaData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCNPJCPFChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    handleChange('cnpj_cpf', cleaned);
  };

  const handleCEPChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    handleChange('cep', cleaned);
  };

  const handleBuscarCEP = async () => {
    if (!formData.cep || formData.cep.length !== 8) {
      toast({
        title: 'Erro',
        description: 'CEP deve ter 8 dígitos',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSearchingCEP(true);
      const data = await EmpresaAPI.buscarCEP(formData.cep);

      setFormData((prev) => ({
        ...prev,
        rua: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        uf: data.uf,
        complemento: data.complemento || prev.complemento,
      }));

      toast({
        title: 'CEP encontrado',
        description: 'Endereço preenchido automaticamente',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'CEP não encontrado',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingCEP(false);
    }
  };

  const handleGerarCodigoCliente = async () => {
    if (!token || !empresaUuid) return;

    try {
      setIsGeneratingCliente(true);
      const response = await EmpresaAPI.gerarCodigoCliente(token, empresaUuid);
      setCodigoCliente(response.codigo_cliente);
      toast({
        title: 'Código gerado',
        description: `Código de cliente: ${response.codigo_cliente}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao gerar código de cliente',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingCliente(false);
    }
  };

  const handleGerarCodigoFornecedor = async () => {
    if (!token || !empresaUuid) return;

    try {
      setIsGeneratingFornecedor(true);
      const response = await EmpresaAPI.gerarCodigoFornecedor(token, empresaUuid);
      setCodigoFornecedor(response.codigo_fornecedor);
      toast({
        title: 'Código gerado',
        description: `Código de fornecedor: ${response.codigo_fornecedor}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao gerar código de fornecedor',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingFornecedor(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nome_empresa || formData.nome_empresa.length < 3) {
      newErrors.nome_empresa = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!formData.cnpj_cpf) {
      newErrors.cnpj_cpf = 'CNPJ/CPF é obrigatório';
    } else if (!validateCNPJorCPF(formData.cnpj_cpf)) {
      newErrors.cnpj_cpf = 'CNPJ/CPF inválido';
    }

    if (!formData.cep || formData.cep.length !== 8) {
      newErrors.cep = 'CEP inválido';
    }

    if (!formData.rua || formData.rua.length < 3) {
      newErrors.rua = 'Rua é obrigatória';
    }

    if (!formData.numero) {
      newErrors.numero = 'Número é obrigatório';
    }

    if (!formData.bairro || formData.bairro.length < 2) {
      newErrors.bairro = 'Bairro é obrigatório';
    }

    if (!formData.cidade || formData.cidade.length < 2) {
      newErrors.cidade = 'Cidade é obrigatória';
    }

    if (!formData.uf) {
      newErrors.uf = 'UF é obrigatória';
    }

    if (!formData.centro) {
      newErrors.centro = 'Centro é obrigatório';
    }

    if (!formData.warehouse_number) {
      newErrors.warehouse_number = 'Número do armazém é obrigatório';
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
        description: 'Verifique os campos do formulário',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      if (isEditMode && empresaUuid) {
        await EmpresaAPI.updateEmpresa(token, empresaUuid, formData);
        toast({
          title: 'Empresa atualizada',
          description: 'Os dados da empresa foram atualizados com sucesso',
        });
      } else {
        const empresa = await EmpresaAPI.createEmpresa(token, formData);
        setIsEditMode(true);
        setEmpresaUuid(empresa.uuid);
        toast({
          title: 'Empresa criada',
          description: 'A empresa foi criada com sucesso',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar empresa',
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
          <p className="text-neutral-400">Carregando dados da empresa...</p>
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer
      title="Configuração de Empresa"
      description={isEditMode ? 'Edite os dados da sua empresa' : 'Configure os dados da sua empresa'}
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <FormSection
          title="Dados Gerais"
          description="Informações básicas da empresa"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nome_empresa" className="text-neutral-300">
                Nome da Empresa *
              </Label>
              <Input
                id="nome_empresa"
                value={formData.nome_empresa}
                onChange={(e) => handleChange('nome_empresa', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Ex: Lynx Sistemas Ltda"
              />
              {errors.nome_empresa && (
                <p className="text-xs text-red-500">{errors.nome_empresa}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj_cpf" className="text-neutral-300">
                CNPJ/CPF *
              </Label>
              <Input
                id="cnpj_cpf"
                value={formatCNPJorCPF(formData.cnpj_cpf)}
                onChange={(e) => handleCNPJCPFChange(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="00.000.000/0000-00"
              />
              {errors.cnpj_cpf && (
                <p className="text-xs text-red-500">{errors.cnpj_cpf}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inscricao_estadual" className="text-neutral-300">
                Inscrição Estadual
              </Label>
              <Input
                id="inscricao_estadual"
                value={formData.inscricao_estadual}
                onChange={(e) => handleChange('inscricao_estadual', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="000.000.000.000"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Endereço"
          description="Localização da empresa"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cep" className="text-neutral-300">
                CEP *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="cep"
                  value={formatCEP(formData.cep)}
                  onChange={(e) => handleCEPChange(e.target.value)}
                  className="bg-neutral-950 border-neutral-800 text-white"
                  placeholder="00000-000"
                  maxLength={9}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBuscarCEP}
                  disabled={isSearchingCEP || formData.cep.length !== 8}
                >
                  {isSearchingCEP ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.cep && (
                <p className="text-xs text-red-500">{errors.cep}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rua" className="text-neutral-300">
                Rua *
              </Label>
              <Input
                id="rua"
                value={formData.rua}
                onChange={(e) => handleChange('rua', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Ex: Rua das Flores"
              />
              {errors.rua && (
                <p className="text-xs text-red-500">{errors.rua}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero" className="text-neutral-300">
                Número *
              </Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleChange('numero', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="123"
              />
              {errors.numero && (
                <p className="text-xs text-red-500">{errors.numero}</p>
              )}
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
                placeholder="Ex: Sala 101"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro" className="text-neutral-300">
                Bairro *
              </Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => handleChange('bairro', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Ex: Centro"
              />
              {errors.bairro && (
                <p className="text-xs text-red-500">{errors.bairro}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade" className="text-neutral-300">
                Cidade *
              </Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => handleChange('cidade', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Ex: São Paulo"
              />
              {errors.cidade && (
                <p className="text-xs text-red-500">{errors.cidade}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf" className="text-neutral-300">
                UF *
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
              {errors.uf && (
                <p className="text-xs text-red-500">{errors.uf}</p>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Configurações do Sistema"
          description="Parâmetros operacionais"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="centro" className="text-neutral-300">
                Centro *
              </Label>
              <Input
                id="centro"
                value={formData.centro}
                onChange={(e) => handleChange('centro', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Ex: 001"
              />
              {errors.centro && (
                <p className="text-xs text-red-500">{errors.centro}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse_number" className="text-neutral-300">
                Número do Armazém *
              </Label>
              <Input
                id="warehouse_number"
                value={formData.warehouse_number}
                onChange={(e) => handleChange('warehouse_number', e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Ex: WH001"
              />
              {errors.warehouse_number && (
                <p className="text-xs text-red-500">{errors.warehouse_number}</p>
              )}
            </div>

            {isEditMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="codigo_cliente" className="text-neutral-300">
                    Código de Cliente
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="codigo_cliente"
                      value={codigoCliente || 'Não gerado'}
                      readOnly
                      className="bg-neutral-950 border-neutral-800 text-white"
                      disabled
                    />
                    {!codigoCliente && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGerarCodigoCliente}
                        disabled={isGeneratingCliente}
                      >
                        {isGeneratingCliente ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Gerar'
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo_fornecedor" className="text-neutral-300">
                    Código de Fornecedor
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="codigo_fornecedor"
                      value={codigoFornecedor || 'Não gerado'}
                      readOnly
                      className="bg-neutral-950 border-neutral-800 text-white"
                      disabled
                    />
                    {!codigoFornecedor && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGerarCodigoFornecedor}
                        disabled={isGeneratingFornecedor}
                      >
                        {isGeneratingFornecedor ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Gerar'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </FormSection>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditMode ? 'Atualizar' : 'Salvar'}
              </>
            )}
          </Button>
        </div>
      </form>
    </AppContainer>
  );
}
