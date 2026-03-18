# Restaurant App MVP

A Progressive Web App for restaurant ordering system with customer, waiter, and admin interfaces.

## 🏗️ Project Structure

```
restaurant-app-mvp/
├── dark-culinary-pwa/   # Angular PWA – main customer/waiter/admin app (run this)
├── backend/             # NestJS API server
├── scripts/             # Database setup scripts
├── docs/                # Documentation
└── package.json         # Root package configuration
```

**Important:** The main frontend to run is **`dark-culinary-pwa/`**. From repo root run `npm run dev` (runs backend + frontend). To run only the PWA: `cd dark-culinary-pwa && npm run start`. The **`frontend/`** folder is a legacy copy; use **dark-culinary-pwa** for development.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Setup environment:**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup database:**
   ```bash
   npm run setup:db
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

### Individual Commands

- **Frontend only:** `npm run dev:frontend`
- **Backend only:** `npm run dev:backend`
- **Build all:** `npm run build`

## 📱 Apps

- **Customer App:** http://localhost:4200/customer
- **Waiter App:** http://localhost:4200/waiter
- **Admin Dashboard:** http://localhost:4200/admin
- **API Server:** http://localhost:3000
- **API Documentation:** http://localhost:3000/api

## 🗄️ Database

### Default Configuration
- **Host:** localhost:5432
- **Database:** restaurant_app
- **Username:** restaurant_user
- **Password:** restaurant_password

### Database Commands
```bash
# Setup database and user
npm run setup:db

# Seed with sample data
npm run seed:db

# Reset database
cd scripts && node reset-database.js
```

## 🛠️ Tech Stack

- **Frontend:** Angular 17+ PWA
- **Backend:** NestJS + TypeScript
- **Database:** PostgreSQL + Prisma
- **Real-time:** Socket.IO
- **UI:** Angular Material

## 📋 Features

### Customer App
- QR code table scanning
- Menu browsing and ordering
- Real-time order status
- Offline support (PWA)

### Waiter App
- Table management
- Order notifications
- Order status updates
- Customer assistance

### Admin Dashboard
- Menu management
- Staff management
- Order analytics
- Table monitoring

## 🔧 Configuration

Update `.env` file with your settings:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_app
DB_USER=restaurant_user
DB_PASSWORD=restaurant_password
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
```

## 📚 Documentation

- [Setup Guide](SETUP.md) - Detailed setup instructions
- [Development Guide](DEVELOPMENT.md) - Development workflow and architecture

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Docker (Optional)
```bash
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License