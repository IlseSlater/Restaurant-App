# Restaurant App MVP - Development Guide

## 🏗️ Project Structure

```
restaurant-app-mvp/
├── frontend/                 # Angular PWA Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── customer/    # Customer interface
│   │   │   ├── waiter/      # Waiter interface
│   │   │   └── admin/       # Admin interface
│   │   ├── assets/          # Static assets
│   │   └── styles.scss      # Global styles
│   ├── package.json
│   └── angular.json
├── backend/                 # NestJS API Server
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/        # Authentication
│   │   │   ├── tables/      # Table management
│   │   │   ├── menu/        # Menu management
│   │   │   ├── orders/      # Order management
│   │   │   └── prisma/      # Database service
│   │   └── main.ts          # Application entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── scripts/                 # Database scripts
│   ├── setup-database.js    # Create database and user
│   ├── seed-database.js     # Insert sample data
│   └── reset-database.js    # Reset database
└── package.json             # Root package configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd restaurant-app-mvp
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

4. **Start development:**
   ```bash
   npm run dev
   ```

## 📱 Applications

- **Customer App:** http://localhost:4200/customer
- **Waiter App:** http://localhost:4200/waiter  
- **Admin Dashboard:** http://localhost:4200/admin
- **API Documentation:** http://localhost:3000/api

## 🗄️ Database

### Schema Overview
- **Users:** Customers, waiters, admins
- **Tables:** Restaurant tables with QR codes
- **Menu Items:** Food and beverage items
- **Orders:** Customer orders with items
- **Order Items:** Individual items in orders

### Database Commands
```bash
# Setup database
npm run setup:db

# Seed with sample data
npm run seed:db

# Reset database
npm run reset:db

# Run Prisma migrations
cd backend && npx prisma migrate dev

# Open Prisma Studio
cd backend && npx prisma studio
```

## 🛠️ Development

### Frontend (Angular)
- **Framework:** Angular 17+ with standalone components
- **UI Library:** Angular Material
- **PWA:** Service workers for offline support
- **Routing:** Lazy-loaded feature modules

### Backend (NestJS)
- **Framework:** NestJS with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **API:** RESTful endpoints with Swagger documentation
- **Real-time:** Socket.IO for live updates

### Key Features
- **QR Code Scanning:** Table assignment
- **Real-time Orders:** Live order updates
- **Offline Support:** PWA capabilities
- **Responsive Design:** Mobile-first approach

## 🔧 Configuration

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_app
DB_USER=restaurant_user
DB_PASSWORD=restaurant_password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=development
```

### API Endpoints
- `GET /api` - API documentation
- `POST /auth/login` - User login
- `GET /tables` - List all tables
- `POST /tables/scan` - Scan table QR code
- `GET /menu` - Get menu items
- `POST /orders` - Create new order
- `PUT /orders/:id/status` - Update order status

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm run test
```

### Backend Testing
```bash
cd backend
npm run test
```

## 📦 Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d
```

## 🔍 Troubleshooting

### "Create company" or "Create restaurant" fails

1. **Backend must be running** – The frontend calls `http://localhost:3000/api/companies`. Start the API:
   ```bash
   cd backend && npm run start
   ```
2. **Database must be running** – PostgreSQL must be up and Prisma migrations applied:
   ```bash
   cd backend && npx prisma migrate dev
   ```
3. **Check the error message** – The app now shows the server’s error in the snackbar (e.g. duplicate slug, validation, or "Database may be down"). If you see "Cannot reach the server", the backend isn’t running or CORS/URL is wrong.
4. **Browser console (F12)** – Open DevTools → Console and Network. On failure you’ll see the response status and body. Check the **Network** tab for the `companies` request: status code (400, 409, 500) and response body tell you why it failed.
5. **Duplicate slug** – If a company with the same slug (e.g. `ilse-restaurant`) already exists, use a different name or change the slug in step 1 of the wizard.

The wizard creates the **company first** (one request with name, slug, address, etc.). Then it creates **tables** and **staff** in separate requests. So the payload you see in the network tab for `POST /api/companies` only contains company details; that’s correct.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
