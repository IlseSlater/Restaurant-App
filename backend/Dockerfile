FROM node:20-bookworm-slim

WORKDIR /app

# Prisma needs OpenSSL available to detect/load the correct engine
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all deps (build needs Nest CLI/TypeScript from devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Ensure Prisma client/enums are generated inside container
RUN npx prisma generate

# Build the application
RUN npm run build

# Keep runtime image lean after build
RUN npm prune --omit=dev

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
