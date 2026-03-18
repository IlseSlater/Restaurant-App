# Prerequisites

Before running the Restaurant App, make sure you have the following installed:

## Required Software

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **PostgreSQL** (version 14 or higher)
   - Download from: https://www.postgresql.org/download/
   - Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:14`

3. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

## Optional Software

- **Git** for version control
- **Docker** for containerized PostgreSQL
- **Postman** or **Insomnia** for API testing

## Environment Setup

1. Copy the environment file:
   ```bash
   cp env.example .env
   ```

2. Update the `.env` file with your database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=restaurant_app
   DB_USER=restaurant_user
   DB_PASSWORD=restaurant_password
   ```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Setup database:**
   ```bash
   npm run setup:db
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

## Individual Commands

- **Frontend only:** `npm run dev:frontend`
- **Backend only:** `npm run dev:backend`
- **Build all:** `npm run build`

## Troubleshooting

### Node.js not found
- Make sure Node.js is installed and added to your PATH
- Restart your terminal after installation

### PostgreSQL connection issues
- Ensure PostgreSQL is running
- Check if the port 5432 is available
- Verify database credentials in `.env` file

### Port conflicts
- Frontend runs on port 4200
- Backend runs on port 3000
- Change ports in respective configuration files if needed
