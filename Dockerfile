FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./
RUN chown -R node:node /app
USER node

FROM base AS prod-deps
RUN npm ci --only=production --ignore-scripts

FROM base AS build
RUN npm ci --ignore-scripts
COPY --chown=node:node . .
RUN npm run build

# Final stage
FROM node:20-slim
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --chown=node:node .env.production .env.production
COPY --chown=node:node package*.json ./
USER node
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "run", "start"]
