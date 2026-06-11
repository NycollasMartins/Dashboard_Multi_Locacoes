# StageGear · Guia de Deploy (Supabase + Hostinger)

Este guia leva o painel do zero ao ar. O backend agora é o **Supabase**
(banco de dados, login, upload de arquivos e convite de usuários) e o front-end
é hospedado na **Hostinger** como um subdomínio.

Tempo estimado: ~30 a 45 minutos.

---

## Visão geral do que mudou

O projeto era construído na plataforma Base44. Toda a parte de backend foi
reescrita para o Supabase, sem mexer nas telas. Em resumo:

- **Banco de dados** → 7 tabelas no Postgres do Supabase (`supabase/schema.sql`).
- **Login** → autenticação do Supabase + nova tela `/login`.
- **Upload de arquivos** (NF em PDF, fotos) → Supabase Storage (bucket `uploads`).
- **Convite de usuários** → Edge Function `invite-user` (segura, só admin chama).
- **Hospedagem** → site estático (pasta `dist/`) na Hostinger, com `.htaccess`
  para as rotas funcionarem.

---

## Etapa 1 — Criar o projeto no Supabase

1. Acesse https://supabase.com e crie uma conta (plano grátis serve para começar).
2. **New Project** → escolha um nome, uma senha forte para o banco e a região
   mais próxima (ex.: *South America (São Paulo)*).
3. Aguarde o provisionamento (~2 min).

## Etapa 2 — Criar o banco de dados

1. No projeto, vá em **SQL Editor** → **New query**.
2. Abra o arquivo `supabase/schema.sql` deste projeto, copie **todo** o conteúdo,
   cole no editor e clique em **Run**.
3. Deve aparecer *Success*. Isso cria as 7 tabelas, os perfis de usuário, as
   permissões (RLS), os gatilhos e o bucket de arquivos `uploads`.

> Pode rodar de novo sem problema — o script é idempotente.

## Etapa 3 — Pegar as chaves de API

1. Vá em **Project Settings** (engrenagem) → **API**.
2. Anote dois valores:
   - **Project URL** → ex.: `https://abcdxyz.supabase.co`
   - **anon public** (em *Project API keys*) → uma chave longa.

> Use **somente** a chave `anon public` no front-end. A `service_role` é secreta
> e jamais deve ir para o navegador (ela só é usada na Edge Function, no servidor).

## Etapa 4 — Configurar URLs de autenticação

Em **Authentication → URL Configuration**:

- **Site URL**: a URL final do seu subdomínio (ex.: `https://painel.seudominio.com.br`).
- **Redirect URLs**: adicione também `https://painel.seudominio.com.br/login`
  e, para testar localmente, `http://localhost:5173` e `http://localhost:5173/login`.

(Opcional, recomendado) Em **Authentication → Providers → Email**, deixe
**Confirm email** ligado e configure um provedor de SMTP próprio em
**Project Settings → Auth → SMTP** para os e-mails de convite/redefinição
saírem com confiabilidade.

## Etapa 5 — Criar o primeiro usuário (admin)

O **primeiro** usuário cadastrado vira **administrador** automaticamente.

1. Em **Authentication → Users → Add user → Create new user**.
2. Informe seu e-mail e uma senha. Marque *Auto Confirm User*.
3. Pronto: ao logar, esse usuário já estará como `admin` e poderá convidar os
   demais pela tela **Configurações → Administração**.

---

## Etapa 6 — Configurar e testar localmente (opcional, mas recomendado)

1. Tenha o **Node.js 18+** instalado.
2. Na raiz do projeto:
   ```bash
   npm install
   ```
3. Crie o arquivo **`.env.local`** (copie de `.env.example`) e preencha:
   ```
   VITE_SUPABASE_URL=https://abcdxyz.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_public
   ```
4. Rode:
   ```bash
   npm run dev
   ```
5. Abra `http://localhost:5173`, faça login e teste cadastrar um cliente,
   um equipamento, etc.

## Etapa 7 — (Opcional) Ativar o convite de usuários

Para o botão **Convidar** funcionar na tela de Administração, faça o deploy da
Edge Function:

1. Instale a CLI: https://supabase.com/docs/guides/cli
2. No terminal:
   ```bash
   supabase login
   supabase link --project-ref SEU_PROJECT_REF
   supabase functions deploy invite-user
   ```
   (`SEU_PROJECT_REF` é o trecho `abcdxyz` da Project URL.)

Sem isso, você ainda pode adicionar usuários manualmente em
**Authentication → Users**, e ajustar a função (admin/operador) na tela de
Administração do painel.

---

## Etapa 8 — Gerar o build de produção

Na raiz do projeto, com o `.env.local` preenchido (as variáveis entram no build):

```bash
npm run build
```

Isso gera a pasta **`dist/`**. É **só o conteúdo dessa pasta** que vai para a
Hostinger. O `.htaccess` já vai incluído nela.

> As variáveis `VITE_*` são embutidas no momento do build. Se trocar de projeto
> Supabase, refaça o `build`.

## Etapa 9 — Criar o subdomínio na Hostinger

1. Painel da Hostinger → **Domínios → Subdomínios**.
2. Crie, por exemplo, `painel` em `seudominio.com.br` → vira
   `painel.seudominio.com.br`.
3. Anote a **pasta raiz** que a Hostinger criou para ele (algo como
   `public_html/painel`).

## Etapa 10 — Enviar os arquivos

1. Painel da Hostinger → **Gerenciador de Arquivos** (ou via FTP).
2. Entre na pasta do subdomínio (ex.: `public_html/painel`).
3. Envie **todo o conteúdo de `dist/`** para dentro dessa pasta:
   - `index.html`
   - a pasta `assets/`
   - `favicon.svg`
   - `.htaccess`  *(arquivo oculto — no Gerenciador de Arquivos, ative
     "Mostrar arquivos ocultos"; se preferir, dá para enviar tudo zipado e
     extrair lá dentro).*
4. Acesse `https://painel.seudominio.com.br` — a tela de login deve aparecer.

> **HTTPS:** na Hostinger, ative o SSL grátis do subdomínio em
> **Segurança → SSL** caso ainda não esteja ativo. O Supabase exige HTTPS.

---

## Migrar dados que já existem no Base44 (se houver)

O arquivo do projeto só continha a **estrutura** (não os registros). Se você já
tem clientes/equipamentos/etc. cadastrados no Base44, faça assim:

1. **Exporte** cada entidade do Base44 em CSV (pela interface do Base44, na lista
   de cada entidade, ou pela API/Builder).
2. No Supabase, vá em **Table Editor**, abra a tabela correspondente
   (`clients`, `equipment`, `rentals`...), e use **Insert → Import data from CSV**.
3. Combine as colunas do CSV com as da tabela. Como as chaves (`id`) são do tipo
   texto, **mantenha os IDs originais** para preservar os vínculos entre
   locações ↔ clientes ↔ equipamentos.
4. Ordem recomendada para importar (por causa das referências):
   `clients` → `equipment` → `rentals` → `quotes` → `invoices` → `expenses` →
   `accounts_payable`.

> Campos de data devem estar no formato `AAAA-MM-DD`. O campo `equipment_ids`
> (lista) deve ir como, por exemplo, `{id1,id2}`.

---

## Atualizações futuras do painel

Sempre que mexer no código:

```bash
npm run build
```

e reenvie o conteúdo de `dist/` para a pasta do subdomínio (substituindo os
arquivos). Não precisa mexer no Supabase, a não ser que mude o banco.

---

## Resolução de problemas

- **Tela branca / erro no console sobre variáveis**: o build foi feito sem o
  `.env.local` preenchido. Refaça a Etapa 8.
- **"Failed to fetch" / CORS**: confira a **Site URL** e **Redirect URLs** na
  Etapa 4 e se o subdomínio está em HTTPS.
- **Recarregar uma página interna dá 404**: o `.htaccess` não subiu. Confirme
  que ele está na pasta do subdomínio.
- **Login não entra**: usuário não confirmado. Em Authentication → Users, marque
  *Auto Confirm* ou confirme pelo e-mail.
- **Botão Convidar dá erro**: a Edge Function não foi publicada (Etapa 7).
