FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY . .
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV INPUT_PATH=/app/P08_school_results_public.json
# Ensure output dir exists
RUN mkdir -p /app/output
CMD ["node", "src/infrastructure/http/server.js"]
