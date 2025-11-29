# Arquitetura de Comunicação - API

## Visão Geral

O Lynx ERP usa uma arquitetura de comunicação direta entre o frontend Next.js e o backend Python FastAPI.

## Fluxo de Requisições

```
Browser (React) → Backend Python FastAPI
     ↓                    ↓
  Client-side        http://localhost:8000/api/v1
```

### URLs Absolutas vs Relativas

**URLs Absolutas (Usadas no projeto):**
- ✅ Vão direto do browser para o backend Python
- ✅ Não passam pelo servidor Next.js
- ✅ Mais rápido (sem proxy intermediário)
- ✅ Usado em `NEXT_PUBLIC_API_BASE_URL`

**Exemplo:**
```typescript
// lib/api/empresa.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// Esta chamada vai DIRETO do browser para o backend Python
fetch(`${API_BASE_URL}/configuracoes/empresa`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

**URLs Relativas (NÃO usadas):**
- ❌ Passariam primeiro pelo Next.js
- ❌ Next.js teria que fazer proxy para o backend
- ❌ Mais lento (duplo hop)
- ❌ Problemático com `output: 'export'`

## Configuração de CORS

Como as requisições vão direto do browser para o backend Python, o backend deve ter CORS configurado:

```python
# Backend Python (FastAPI)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Variáveis de Ambiente

### `.env.local` (Frontend)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

**IMPORTANTE:**
- Use `NEXT_PUBLIC_` para variáveis expostas ao browser
- Sem `NEXT_PUBLIC_`, a variável só funciona no servidor Next.js
- Como usamos `output: 'export'`, tudo é client-side

## Estrutura de APIs

### Serviços de API (`lib/api/`)

Cada recurso tem sua própria classe de API:

```
lib/api/
├── auth.ts         # Autenticação (login, logout, validate)
├── modules.ts      # Módulos hierárquicos
├── apps.ts         # Gerenciamento de apps
└── empresa.ts      # CRUD de empresas
```

### Padrão de API

```typescript
export class RecursoAPI {
  private static getAuthHeader(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  static async get(token: string): Promise<Recurso[]> {
    const response = await fetch(`${API_BASE_URL}/recurso`, {
      method: 'GET',
      headers: this.getAuthHeader(token),
      cache: 'no-store', // Importante: evita cache do Next.js
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar recurso');
    }

    return await response.json();
  }
}
```

### Cache no Next.js

**Importante:** Use `cache: 'no-store'` para evitar que o Next.js faça cache das requisições:

```typescript
fetch(url, {
  cache: 'no-store'  // ← Importante!
});
```

Sem isso, o Next.js pode fazer cache agressivo das requisições GET.

## Endpoints Externos

### ViaCEP

Para APIs externas (como ViaCEP), usamos URLs absolutas normalmente:

```typescript
fetch('https://viacep.com.br/ws/01310100/json/', {
  cache: 'no-store'
});
```

## Autenticação

### JWT Token

O token JWT é armazenado no **localStorage** via Zustand persist:

```typescript
// store/session.ts
export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      // ...
    }),
    {
      name: 'lynx-session', // ← localStorage key
    }
  )
);
```

### Inclusão do Token

Todas as requisições autenticadas incluem o token no header:

```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

## Tratamento de Erros

### Padrão de Erro

```typescript
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erro genérico');
  }

  return await response.json();
} catch (error) {
  console.error('Error:', error);
  throw error; // Propaga para o componente tratar
}
```

### No Componente

```typescript
try {
  await RecursoAPI.get(token);
  toast({ title: 'Sucesso' });
} catch (error: any) {
  toast({
    title: 'Erro',
    description: error.message,
    variant: 'destructive',
  });
}
```

## Deploy

### Desenvolvimento

```
Frontend: http://localhost:3000
Backend:  http://localhost:8000
```

### Produção

```env
# Frontend .env.production
NEXT_PUBLIC_API_BASE_URL=https://api.meusite.com/api/v1
```

```
Frontend: https://meusite.com
Backend:  https://api.meusite.com
```

## Troubleshooting

### CORS Error

**Sintoma:** `Access-Control-Allow-Origin` error no console

**Solução:**
1. Verifique se o backend tem CORS configurado
2. Adicione a URL do frontend em `allow_origins`
3. Reinicie o backend

### Request vai para http://localhost:3000

**Sintoma:** Request aparece como `http://localhost:3000/api/...` ao invés de `localhost:8000`

**Causa:** Usando URL relativa ao invés de absoluta

**Solução:**
```typescript
// ❌ Errado
fetch('/api/empresa');

// ✅ Correto
fetch(`${API_BASE_URL}/configuracoes/empresa`);
```

### Token não está sendo enviado

**Sintoma:** 401 Unauthorized

**Solução:**
1. Verifique se o token está no localStorage (DevTools → Application → Local Storage)
2. Verifique se está passando o token para a função da API
3. Verifique o formato: `Bearer {token}`

### Cache indesejado

**Sintoma:** Dados antigos aparecem após atualizar

**Solução:** Adicione `cache: 'no-store'` no fetch

```typescript
fetch(url, {
  cache: 'no-store'
});
```

## Resumo

- ✅ Use `NEXT_PUBLIC_API_BASE_URL` para o backend
- ✅ Requisições vão DIRETO do browser para o backend Python
- ✅ Configure CORS no backend Python
- ✅ Use `cache: 'no-store'` em todas as requisições
- ✅ Token no header: `Authorization: Bearer {token}`
- ✅ Trate erros com try/catch + toast
