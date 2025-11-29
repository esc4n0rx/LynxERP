# Integração de Módulos e Apps - Lynx ERP

Este documento descreve a integração completa do sistema de módulos hierárquicos e gerenciamento de apps do frontend Next.js com o backend Python.

## Resumo das Mudanças

### Arquivos Removidos

- **`modules/`** - Pasta com apps mockup removida completamente
- **`components/RecentApps.tsx`** - Componente mockup de apps recentes
- **`components/InsightsGrid.tsx`** - Componente mockup de insights

### Arquivos Criados

1. **`lib/api/modules.ts`** - Serviço de API para gerenciamento de módulos
   - `ModulesAPI.getModulesTree()` - Busca árvore hierárquica de módulos
   - `ModulesAPI.getModules()` - Lista módulos em formato plano
   - `ModulesAPI.getModule()` - Busca módulo específico
   - `ModulesAPI.createModule()` - Cria novo módulo
   - `ModulesAPI.updateModule()` - Atualiza módulo existente
   - `ModulesAPI.deleteModule()` - Deleta módulo (soft delete)

2. **`lib/api/apps.ts`** - Serviço de API para gerenciamento de apps
   - `AppsAPI.getApps()` - Lista todos os apps
   - `AppsAPI.getApp()` - Busca app específico
   - `AppsAPI.getAppRoutes()` - Busca rotas de um app
   - `AppsAPI.activateApp()` - Ativa um app
   - `AppsAPI.deactivateApp()` - Desativa um app
   - `AppsAPI.rediscoverApps()` - Redescobre apps no sistema

3. **`components/AppsManagementModal.tsx`** - Modal de gerenciamento de apps
   - Listagem de todos os apps (ativos e inativos)
   - Busca por nome/código/descrição
   - Ativar/desativar apps
   - Botão de redescoberta
   - Estatísticas de rotas e versão

### Arquivos Modificados

1. **`app/(main)/page.tsx`** - Página inicial completamente reescrita
   - Remove código mockup
   - Integra com `GET /modules/tree`
   - Renderiza módulos hierárquicos dinamicamente
   - Mostra apps associados a cada módulo
   - Botão de edição para usuários master
   - Suporta aninhamento de módulos (até 4 níveis)
   - Loading states e tratamento de erros

2. **`components/Header.tsx`** - Header atualizado
   - Nova opção "Gerenciamento de Apps" no dropdown do usuário
   - Visível apenas para usuários master e admin
   - Abre modal de gerenciamento de apps

## Estrutura de Dados

### Módulo (Module)

```typescript
interface Module {
  uuid: string;
  parent_uuid: string | null;
  nome: string;
  slug: string;
  descricao?: string;
  icone?: string;
  rota?: string;
  level: number;          // 0-3 (4 níveis de hierarquia)
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  apps?: App[];          // Apps associados
  children?: Module[];   // Sub-módulos
}
```

### App

```typescript
interface App {
  uuid?: string;
  internal_code: string;
  name: string;
  version: string;
  description?: string;
  icon?: string;
  route_prefix: string;
  enabled: boolean;
  routes_count: number;
}
```

## Hierarquia de Módulos

O sistema suporta até 4 níveis de hierarquia:

```
Level 0 (Módulo Principal)
├── Level 1 (Sub-módulo)
│   ├── Level 2 (Sub-sub-módulo)
│   │   └── Level 3 (Sub-sub-sub-módulo)
│   └── Apps
└── Apps
```

**Exemplo Real:**

```
Cadastros (level 0)
├── Clientes (level 1)
│   ├── Pessoa Física (level 2)
│   │   └── App: Cadastro PF
│   ├── Pessoa Jurídica (level 2)
│   │   └── App: Cadastro PJ
│   └── App: Gestão de Clientes
└── Fornecedores (level 1)
    └── App: Gestão de Fornecedores
```

## Funcionalidades Implementadas

### 1. Visualização de Módulos

- Tela inicial carrega árvore completa de módulos via `GET /modules/tree`
- Módulos são renderizados hierarquicamente em cards
- Ícones dinâmicos baseados no campo `icone` (Lucide Icons)
- Sub-módulos aparecem aninhados dentro do módulo pai
- Apps aparecem dentro do módulo ao qual pertencem

### 2. Gestão de Apps (Master/Admin)

**Acesso:**
- Header → Clique no nome do usuário → "Gerenciamento de Apps"

**Funcionalidades:**
- Listar todos os apps (ativos e inativos)
- Buscar apps por nome, código ou descrição
- Visualizar informações: nome, código, versão, nº de rotas
- Ativar app (carrega rotas no sistema)
- Desativar app (remove rotas do sistema)
- Redescobrir apps (escaneia sistema em busca de novos apps)

**Estatísticas de Redescoberta:**
- Descobertos: Total de apps encontrados
- Registrados: Novos apps adicionados
- Atualizados: Apps existentes atualizados

### 3. Edição de Módulos (Master)

**Recursos:**
- Botão de edição aparece no canto superior direito de cada card de módulo
- Visível apenas para usuários com `role = 'master'`
- Permite criar, editar e deletar módulos

## Endpoints Utilizados

### Módulos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/modules/tree` | Árvore hierárquica completa |
| GET | `/modules` | Lista plana de módulos |
| GET | `/modules/{uuid}` | Busca módulo específico |
| GET | `/modules/{uuid}/children` | Filhos diretos de um módulo |
| POST | `/modules` | Cria novo módulo |
| PUT | `/modules/{uuid}` | Atualiza módulo |
| DELETE | `/modules/{uuid}` | Deleta módulo |

### Apps

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/apps` | Lista todos os apps |
| GET | `/apps/{code}` | Busca app específico |
| GET | `/apps/{code}/routes` | Rotas de um app |
| POST | `/apps/{code}/activate` | Ativa app |
| POST | `/apps/{code}/deactivate` | Desativa app |
| POST | `/apps/rediscover` | Redescobre apps |

## Permissões

### Visualização
- **Todos os usuários autenticados** podem visualizar módulos e apps

### Gerenciamento de Apps
- **Master** e **Admin** podem:
  - Ativar/desativar apps
  - Redescobrir apps

### Gerenciamento de Módulos
- **Master** e **Admin** podem:
  - Criar módulos
  - Editar módulos
  - Deletar módulos

## Ícones

O sistema utiliza **Lucide Icons** com conversão automática de nomes:

**Exemplos:**
- `database` → `Database`
- `shopping-cart` → `ShoppingCart`
- `user-check` → `UserCheck`

Se um ícone não for encontrado, usa `Box` como fallback.

## Fluxo de Uso

### 1. Usuário Acessa o Sistema

1. Login bem-sucedido
2. Redirecionado para página inicial
3. Sistema carrega `GET /modules/tree`
4. Módulos são renderizados hierarquicamente
5. Usuário clica em um app
6. Sistema abre tab com o app selecionado

### 2. Admin Descobre Novos Apps

1. Header → Nome do usuário → "Gerenciamento de Apps"
2. Modal abre com lista de apps
3. Clica em "Redescobrir"
4. Sistema escaneia e retorna estatísticas
5. Lista é atualizada automaticamente
6. Admin ativa novos apps encontrados

### 3. Master Cria Novo Módulo

1. Página inicial → Botão "Novo Módulo"
2. Modal de criação abre
3. Preenche dados: nome, slug, ícone, etc.
4. Pode selecionar módulo pai (hierarquia)
5. Salva
6. Lista de módulos é atualizada

## Próximos Passos

- [ ] Implementar modal de criação/edição de módulos
- [ ] Adicionar drag & drop para reordenar módulos
- [ ] Implementar cache de módulos no frontend
- [ ] Adicionar filtros na listagem de módulos
- [ ] Implementar breadcrumbs de navegação
- [ ] Adicionar métricas de uso de apps
- [ ] Implementar logs de ativação/desativação de apps

## Troubleshooting

### "Nenhum módulo encontrado"

1. Verifique se o backend está rodando
2. Verifique se há módulos cadastrados no banco
3. Verifique se o usuário tem token válido
4. Veja o console do navegador para erros

### "Erro ao carregar apps"

1. Verifique permissões do usuário (master/admin)
2. Verifique se o token está válido
3. Verifique conexão com backend

### Apps não aparecem nos módulos

1. Verifique se os apps estão ativados
2. Verifique se o `route_prefix` do app corresponde à `rota` do módulo
3. Verifique logs do backend

## Considerações Técnicas

- Módulos são carregados uma vez ao montar a página inicial
- Apps são carregados ao abrir o modal de gerenciamento
- Todas as chamadas usam o token JWT do usuário
- Erros são exibidos via toast notifications
- Loading states impedem múltiplos cliques
- Busca de apps é client-side (filtro local)
