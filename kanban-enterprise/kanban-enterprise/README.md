# OpsKanban Enterprise

Plataforma de Gerenciamento Operacional baseada em Kanban para NOC, SOC e Service Desk.

## Stack

- **Frontend**: React + Vite + TailwindCSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Hospedagem**: Netlify
- **DnD**: @dnd-kit/core

## Configuração Rápida

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute o arquivo `supabase-schema.sql`
3. Após criar seu primeiro usuário, execute:
   ```sql
   UPDATE profiles SET role = 'administrador' WHERE email = 'seu@email.com';
   ```

### 2. Variáveis de Ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha com suas credenciais do Supabase:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhb...
```

### 3. Instalar e Rodar

```bash
npm install
npm run dev
```

### 4. Deploy no Netlify

1. Faça push para GitHub
2. Conecte o repositório no Netlify
3. Configure as variáveis de ambiente no painel do Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Build command: `npm run build`
5. Publish directory: `dist`

O arquivo `netlify.toml` já configura o redirect para SPA.

## Perfis de Acesso

| Perfil | Capacidades |
|--------|-------------|
| **Administrador** | Tudo: usuários, equipes, configurações, tarefas |
| **Gestor** | Criar/editar/excluir tarefas, gerenciar equipe |
| **Supervisor** | Acompanhar, mover e reatribuir tarefas |
| **Técnico** | Ver tarefas atribuídas, atualizar status, comentar |
| **Visualizador** | Somente leitura |

## Funcionalidades

- ✅ Kanban com Drag & Drop (10 colunas)
- ✅ SLA automático com contador regressivo e indicador visual
- ✅ Realtime: todas as atualizações propagadas instantaneamente
- ✅ Comentários e histórico de mudanças por tarefa
- ✅ Filtros por equipe, responsável, status, prioridade, criticidade e SLA
- ✅ Dashboard com métricas e alertas SLA
- ✅ Gerenciamento de equipes e usuários
- ✅ Controle de acesso por perfil (RLS no banco)
- ✅ Tema Dark Enterprise com Glassmorphism
- ✅ Login, logout e recuperação de senha

## Estrutura

```
src/
├── components/
│   ├── auth/          # AuthGuard
│   ├── kanban/        # KanbanColumn, TaskCard
│   ├── tasks/         # TaskModal
│   └── shared/        # Layout, Sidebar, Header, Modal, SLATimer, LoadingScreen
├── pages/             # Dashboard, Kanban, Tasks, Teams, Users, Settings, Login
├── store/             # authStore, tasksStore, teamsStore (Zustand)
├── lib/               # supabase.js, constants.js
└── styles/            # globals.css
```
