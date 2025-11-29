# Integração de Autenticação - Lynx ERP

Este documento descreve a integração completa do sistema de autenticação do frontend Next.js com o backend Python.

## Arquivos Modificados/Criados

### Criados

1. **`lib/api/auth.ts`** - Serviço de API para comunicação com o backend
   - `AuthAPI.login()` - Autenticação de usuários
   - `AuthAPI.validateToken()` - Validação de tokens JWT
   - `AuthAPI.logout()` - Invalidação de sessões
   - `AuthAPI.health()` - Health check do backend

2. **`.env.example`** - Arquivo de exemplo para configuração da API

3. **`docs/AUTH_INTEGRATION.md`** - Este documento

### Modificados

1. **`store/session.ts`** - Store Zustand atualizado
   - Suporte a tokens JWT
   - Login assíncrono com gestão de conflitos de sessão
   - Logout com chamada ao backend
   - Validação de sessão

2. **`app/(auth)/login/page.tsx`** - Página de login
   - Suporte a conflito de sessões com AlertDialog
   - Três opções: Cancelar, Criar Nova Sessão, Encerrar Sessão Anterior
   - Estados de loading
   - Health check integrado com backend

3. **`app/(main)/layout.tsx`** - Layout principal
   - Validação automática de sessão ao carregar
   - Redirecionamento para login se sessão inválida

4. **`components/Header.tsx`** - Header do sistema
   - Exibe nome do usuário (`user.nome`)
   - Exibe email ou login
   - Botão de logout funcional

5. **`app/api/health/route.ts`** - Health check
   - Proxy para o backend
   - Retorna status real da API

## Configuração

### 1. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

Edite o `.env.local` e configure a URL do backend:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### 2. Garantir que o backend está rodando

O backend Python deve estar rodando em `http://localhost:8000` (ou conforme configurado).

Endpoints necessários:
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/validate`
- `POST /api/v1/auth/logout`
- `GET /api/v1/health`

### 3. Instalar dependências (se necessário)

```bash
npm install
```

### 4. Rodar o projeto

```bash
npm run dev
```

Acesse `http://localhost:3000`

## Fluxo de Autenticação

### 1. Login

O usuário acessa `/login` e preenche:
- **Login**: username ou email (ex: `admin`)
- **Senha**: senha do usuário (ex: `senha123`)

Ao clicar em "Entrar":

1. Sistema faz `POST /auth/login` com `{ login, senha }`
2. Backend pode retornar:
   - **Sucesso sem conflito**: Token JWT + dados do usuário
   - **Conflito de sessão**: `session_conflict: true` + número de sessões ativas
   - **Erro**: Credenciais inválidas ou usuário inativo

3. Se houver conflito, aparece um modal com 3 opções:
   - **Cancelar**: Volta para o login
   - **Criar Nova Sessão**: Faz novo login com `action: "new_session"`
   - **Encerrar Sessão Anterior**: Faz novo login com `action: "invalidate_previous"`

### 2. Sessão Ativa

Após login bem-sucedido:
- Token JWT é salvo no localStorage (via Zustand persist)
- Dados do usuário são salvos
- Usuário é redirecionado para `/`

Em todas as páginas protegidas:
- Layout valida a sessão ao carregar
- Se token inválido/expirado, redireciona para `/login`

### 3. Dados do Usuário

O backend retorna o seguinte objeto de usuário:

```typescript
interface User {
  uuid: string;        // UUID do usuário
  login: string;       // Login/username
  nome: string;        // Nome completo
  email: string;       // Email
  role: string;        // Perfil (master, admin, user, etc)
}
```

### 4. Logout

Ao clicar em "Sair" no menu do header:

1. Sistema faz `POST /auth/logout` com token no header
2. Backend invalida a sessão
3. Frontend limpa localStorage
4. Usuário é redirecionado para `/login`

## Componentes Atualizados

### Header

- Exibe avatar com inicial do nome
- Exibe nome completo do usuário
- Dropdown com email/login e opção de logout
- Logout chama a API e redireciona

### Footer

- Exibe email do usuário logado
- Exibe tab ativa e horário atual

### Login Page

- Campo "Login / Email" (aceita username ou email)
- Campo "Senha"
- Status do sistema (API health check)
- AlertDialog para conflitos de sessão
- Estados de loading durante autenticação

## Estrutura de Dados

### SessionStore

```typescript
interface SessionState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (login: string, senha: string, action?: 'new_session' | 'invalidate_previous') => Promise<LoginResponse>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
}
```

### LoginResponse

```typescript
interface LoginResponse {
  success: boolean;
  session_conflict?: boolean;
  message?: string;
  active_sessions?: number;
  token?: string;
  expired_at?: string;
  user?: User;
}
```

## Segurança

- Tokens JWT são armazenados no localStorage via Zustand persist
- Token expira em 24 horas (configurável no backend)
- Validação automática de sessão ao carregar páginas protegidas
- Logout invalida sessão no backend imediatamente
- Senhas nunca são armazenadas (apenas hash no backend)

## Credenciais Padrão

Conforme `docs/auth.json`, as credenciais padrão são:

- **Login**: `admin`
- **Senha**: `senha123`

## Troubleshooting

### "Failed to connect to backend"

1. Verifique se o backend está rodando
2. Verifique a URL em `.env.local`
3. Verifique CORS no backend (deve permitir `http://localhost:3000`)

### "Token inválido ou expirado"

1. Faça logout e login novamente
2. Verifique se o backend está usando a mesma SECRET_KEY
3. Verifique se o token não expirou (24h)

### "Sessão ativa detectada"

Isso é esperado se você já fez login em outro dispositivo/navegador.
Escolha uma das opções no modal:
- Criar nova sessão (mantém as outras ativas)
- Encerrar sessão anterior (invalida todas as outras)

## Próximos Passos

- [ ] Implementar refresh token para sessões mais longas
- [ ] Adicionar middleware de autenticação em API routes
- [ ] Implementar "Lembrar-me" com cookies httpOnly
- [ ] Adicionar 2FA (autenticação de dois fatores)
- [ ] Implementar gestão de múltiplas sessões na UI
