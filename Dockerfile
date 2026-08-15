# Dockerfile padrão (build completo dentro do container) — usado pela plataforma de preview.
# Para a VPS de produção, prefira o fluxo Dockerfile.prebuilt (build fora do container):
# ver README-DEPLOY.md.
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build && npm prune --omit=dev && npm install --no-save tsx drizzle-kit
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/boot.js"]
