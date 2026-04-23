FROM node:18-alpine

WORKDIR /app

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
