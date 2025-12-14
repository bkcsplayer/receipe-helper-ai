FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY scripts ./scripts
COPY services ./services
COPY lib ./lib
COPY worker.js ./
COPY index.js ./
COPY gcs-helper.js ./
COPY db.json ./db.json

RUN npx prisma generate

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["/app/docker-entrypoint.sh"]

