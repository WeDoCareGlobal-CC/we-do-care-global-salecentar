FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

EXPOSE 3101

CMD ["node", "server.mjs"]