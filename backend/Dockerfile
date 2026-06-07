# ── Stage 1: install dependencies ──────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

# ── Stage 2: production image ───────────────────────────────────
FROM node:18-alpine
WORKDIR /app

# Copy installed packages from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY src ./src
COPY package.json ./

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000
CMD ["node", "src/server.js"]
