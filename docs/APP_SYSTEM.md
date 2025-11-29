# Sistema de Apps Dinâmicos - Lynx ERP

Este documento descreve o sistema completo de carregamento dinâmico de apps no Lynx ERP.

## Arquitetura

### App Loader

O App Loader é responsável por:
- Carregar apps dinamicamente baseado no `internal_code`
- Implementar caching para evitar recarregamentos
- Mostrar loading states durante o carregamento
- Lidar com erros de apps não encontrados

**Arquivos principais:**
- `lib/appLoader.tsx` - Sistema de cache e carregamento
- `components/apps/AppLoader.tsx` - Componente de loading com Suspense
- `components/apps/AppNotFound.tsx` - Componente de erro

### Estrutura de Diretórios

```
apps/
├── config-empresa/          # App de configuração de empresa
│   └── index.tsx           # Componente principal do app
├── [internal-code]/        # Outros apps
│   └── index.tsx
```

Cada app deve exportar um componente default que será carregado dinamicamente.

## Componentes Universais

Componentes reutilizáveis para manter UI/UX consistente:

### AppContainer
```tsx
import { AppContainer } from '@/components/apps/common/AppContainer';

<AppContainer
  title="Título do App"
  description="Descrição opcional"
  className="custom-class"
>
  {children}
</AppContainer>
```

### FormSection
```tsx
import { FormSection } from '@/components/apps/common/FormSection';

<FormSection
  title="Seção do Formulário"
  description="Descrição da seção"
>
  {/* campos do formulário */}
</FormSection>
```

## App: Configuração de Empresa

**Internal Code:** `config-empresa`
**Rota:** `/configuracoes/empresa`

### Funcionalidades

1. **Detecção Automática de Modo**
   - Ao carregar, verifica se já existe empresa cadastrada
   - Se sim: modo edição
   - Se não: modo criação

2. **Busca de CEP**
   - Integração com ViaCEP
   - Preenchimento automático de endereço
   - Validação de CEP

3. **Validação de Documentos**
   - CPF/CNPJ com validação de dígitos verificadores
   - Formatação automática
   - Máscaras visuais

4. **Validação de Formulário**
   - Validação em tempo real
   - Mensagens de erro específicas
   - Marcação visual de campos com erro

5. **Estados de Loading**
   - Loading inicial ao verificar empresa existente
   - Loading ao buscar CEP
   - Loading ao salvar

### API Endpoints Utilizados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/configuracoes/empresa` | Lista empresas |
| GET | `/configuracoes/empresa/{uuid}` | Busca empresa específica |
| POST | `/configuracoes/empresa` | Cria nova empresa |
| PUT | `/configuracoes/empresa/{uuid}` | Atualiza empresa |

### Campos do Formulário

**Dados Gerais:**
- Nome da Empresa *
- CNPJ/CPF *
- Inscrição Estadual

**Endereço:**
- CEP * (com busca automática)
- Rua *
- Número *
- Complemento
- Bairro *
- Cidade *
- UF * (select com estados brasileiros)

**Configurações do Sistema:**
- Centro *
- Número do Armazém *

## Validadores

### CPF/CNPJ

```typescript
import { validateCPF, validateCNPJ, validateCNPJorCPF } from '@/lib/validators';

const isValid = validateCNPJorCPF('12345678000195'); // true ou false
```

### Formatação

```typescript
import {
  formatCPF,
  formatCNPJ,
  formatCNPJorCPF,
  formatCEP
} from '@/lib/validators';

const formatted = formatCNPJorCPF('12345678000195'); // 12.345.678/0001-95
const formattedCEP = formatCEP('01310100'); // 01310-100
```

## Fluxo de Uso

### 1. Usuário Clica em App

1. Usuário navega pelos módulos na home
2. Clica em um app dentro de um módulo
3. Sistema usa `openTab()` do store com `internal_code` do app
4. Nova tab é criada e se torna ativa

### 2. App Loader Carrega App

1. `AppLoader` recebe o `internal_code`
2. Verifica se app está no cache
3. Se não estiver, faz lazy import de `@/apps/{internal_code}/index`
4. Mostra loading enquanto carrega
5. Renderiza app quando pronto
6. Se falhar, mostra `AppNotFound`

### 3. App Executa

1. App monta e executa `useEffect` inicial
2. Verifica autenticação (token do store)
3. Faz chamadas API necessárias
4. Renderiza interface baseada nos dados

## Criando um Novo App

### 1. Estrutura Básica

```tsx
// apps/meu-app/index.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/session';
import { useToast } from '@/hooks/use-toast';
import { AppContainer } from '@/components/apps/common/AppContainer';
import { Loader2 } from 'lucide-react';

export default function MeuApp() {
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useSessionStore();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      // Carregar dados da API
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AppContainer>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-neutral-400">Carregando...</p>
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer
      title="Meu App"
      description="Descrição do app"
    >
      {/* Conteúdo do app */}
    </AppContainer>
  );
}
```

### 2. Criar API (se necessário)

```typescript
// lib/api/meu-recurso.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface MeuRecurso {
  uuid: string;
  campo: string;
}

export class MeuRecursoAPI {
  private static getAuthHeader(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  static async get(token: string): Promise<MeuRecurso[]> {
    const response = await fetch(`${API_BASE_URL}/meu-recurso`, {
      method: 'GET',
      headers: this.getAuthHeader(token),
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar recursos');
    }

    return await response.json();
  }
}
```

### 3. Registrar no Backend

O app deve estar cadastrado no backend para aparecer nos módulos.

## Cache de Apps

### Gerenciamento

```typescript
import { clearAppCache, getLoadedApps } from '@/lib/appLoader';

// Limpar um app específico
clearAppCache('config-empresa');

// Limpar todos os apps
clearAppCache();

// Ver apps carregados
const loadedApps = getLoadedApps();
console.log(loadedApps); // ['config-empresa', 'outro-app']
```

### Quando Limpar Cache

- Após atualização de código do app
- Ao fazer deploy de nova versão
- Se usuário relatar bugs de versão antiga

## Boas Práticas

### 1. Loading States

Sempre mostre loading ao:
- Carregar dados iniciais
- Fazer operações assíncronas
- Salvar/atualizar dados

### 2. Tratamento de Erros

- Use try/catch em todas as chamadas API
- Mostre toasts informativos ao usuário
- Não deixe o app crashar silenciosamente

### 3. Validação

- Valide no frontend antes de enviar
- Mostre erros específicos por campo
- Use mensagens claras e objetivas

### 4. Consistência Visual

- Use componentes universais (`AppContainer`, `FormSection`)
- Mantenha padding e spacing consistentes
- Use a paleta de cores padrão do sistema

### 5. Performance

- Use lazy loading para componentes pesados
- Implemente debounce em buscas
- Cache dados quando apropriado

## Troubleshooting

### App não carrega

1. Verifique se o arquivo existe em `apps/{internal-code}/index.tsx`
2. Verifique se há erro de sintaxe no console
3. Verifique se o componente está exportado como default

### Erro de autenticação

1. Verifique se o token está válido no store
2. Verifique se o endpoint da API está correto
3. Veja os logs do backend

### Dados não aparecem

1. Verifique chamadas de API no Network tab
2. Verifique se o backend está respondendo
3. Verifique se os dados estão no formato esperado

## Próximos Passos

- [ ] Adicionar sistema de permissões por app
- [ ] Implementar refresh automático de apps
- [ ] Adicionar hot reload em desenvolvimento
- [ ] Criar gerador de scaffold para novos apps
- [ ] Implementar versionamento de apps
