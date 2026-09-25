FROM node:24-alpine
ARG PNPM_VERSION=10.32.0
ENV PNPM_CONFIG_STRICT_DEP_BUILDS=false
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY api/package.json api/prisma.config.ts ./api/
COPY api/prisma/ ./api/prisma/
COPY web/package.json ./web/
RUN pnpm install

WORKDIR /app/api
COPY api/tsconfig.json ./
COPY api/src/ src/
COPY api/tests/ tests/
COPY api/jest.config.ts ./

ENV NODE_ENV=development
EXPOSE 3000
CMD ["pnpm", "run", "dev"]