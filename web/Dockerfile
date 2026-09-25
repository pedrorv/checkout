FROM node:24-alpine
ARG PNPM_VERSION=10.32.0
ENV PNPM_CONFIG_STRICT_DEP_BUILDS=false
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY web/package.json ./web/
COPY api/package.json api/prisma.config.ts ./api/
COPY api/prisma/ ./api/prisma/
RUN pnpm install

WORKDIR /app/web
COPY web/tsconfig.json web/vite.config.ts web/index.html ./
COPY web/src/ src/

ENV NODE_ENV=development
EXPOSE 8000
CMD ["pnpm", "run", "dev", "--host"]