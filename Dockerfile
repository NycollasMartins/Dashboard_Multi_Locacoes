# ============================================================================
# StageGear Dashboard · Dockerfile (multi-stage)
# Etapa 1: builda o app Vite (React) para arquivos estáticos.
# Etapa 2: serve os estáticos com Nginx (leve e rápido).
# ============================================================================

# ----------------------------------------------------------------------------
# Etapa 1 — BUILD
# ----------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# As variáveis do Supabase são "assadas" no build (Vite embute VITE_* no bundle).
# Os valores abaixo são o PADRÃO (a chave anon é pública, seguro versionar).
# O EasyPanel pode sobrescrever passando-as como build args, se quiser.
ARG VITE_SUPABASE_URL=https://cttzssotzlwnjckaspzt.supabase.co
ARG VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dHpzc290emx3bmpja2FzcHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MjQ1OTgsImV4cCI6MjA5OTAwMDU5OH0.80-yNzb2CMIFUOd5uiHmCPr-Qx1T02KO8KJpBZ7j4Zs
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Instala dependências primeiro (aproveita cache de camadas do Docker).
COPY package.json package-lock.json ./
RUN npm ci

# Copia o restante do código e gera a pasta dist/.
COPY . .
RUN npm run build

# ----------------------------------------------------------------------------
# Etapa 2 — SERVE (Nginx)
# ----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS serve

# Config de SPA (fallback de rotas + cache + gzip), equivalente ao .htaccess.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os estáticos gerados na etapa de build.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
