# StageGear · Painel de Gestão de Locação

Dashboard para gestão de locação de equipamentos de palco/eventos: clientes,
equipamentos, locações, orçamentos, notas fiscais, despesas, contas a pagar e
um painel financeiro.

**Stack:** React + Vite · Tailwind + shadcn/ui · TanStack Query · **Supabase**
(banco de dados, autenticação, storage).

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # e preencha com suas chaves do Supabase
npm run dev
```

## Variáveis de ambiente

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_publica
```

## Backend (Supabase)

- Banco de dados, RLS, perfis e storage: rode `supabase/schema.sql` no SQL Editor.
- Convite de usuários: Edge Function em `supabase/functions/invite-user`.

## Deploy

Build estático para a Hostinger:

```bash
npm run build   # gera a pasta dist/
```

Passo a passo completo (Supabase + Hostinger + subdomínio + migração de dados)
em **[DEPLOY.md](./DEPLOY.md)**.
