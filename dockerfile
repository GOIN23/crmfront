# Стадия 1: Установка зависимостей и сборка
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем lockfile и package.json первыми → отличное кэширование
COPY package.json package-lock.json ./

# Устанавливаем зависимости (npm ci — чище и быстрее для CI/production)
RUN npm ci

# Копируем весь остальной код
COPY . .

# Собираем приложение (next build)
RUN npm run build

# Стадия 2: Минимальный production-образ
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Создаём непривилегированного пользователя (безопасность)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Копируем только необходимое из builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Права на .next (важно для standalone-режима, но и в обычном полезно)
RUN chown -R nextjs:nodejs .next

# Переключаемся на непривилегированного пользователя
USER nextjs

EXPOSE 3000

# Запуск
CMD ["npm", "run", "start"]