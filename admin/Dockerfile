# Production Dockerfile for Vite React App
# Multi-stage build for optimized production image

# Stage 1: Dependencies
# Pin pnpm to the version that wrote pnpm-lock.yaml. An unpinned install
# pulls the newest major, which fails --frozen-lockfile with
# ERR_PNPM_IGNORED_BUILDS because it ignores the build-script allowlist in
# pnpm-workspace.yaml. Bump this together with the lockfile.
ARG PNPM_VERSION=10.28.0

FROM node:18-alpine AS deps
ARG PNPM_VERSION
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@${PNPM_VERSION}

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:18-alpine AS builder
ARG PNPM_VERSION
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@${PNPM_VERSION}

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build arguments and environment variables
ARG VITE_API_URL
ENV NODE_ENV=production
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN pnpm run build

# Stage 3: Production server with nginx
FROM nginx:alpine AS runner

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf.default 2>/dev/null || true

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /usr/share/nginx/html
RUN chown -R nextjs:nodejs /var/cache/nginx
RUN chown -R nextjs:nodejs /var/log/nginx
RUN chown -R nextjs:nodejs /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nextjs:nodejs /var/run/nginx.pid

USER nextjs

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
