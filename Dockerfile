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
# Passe-as no build:  docker build --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=... .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
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
