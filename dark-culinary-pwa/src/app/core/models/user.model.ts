export enum UserRole {
  WAITER = 'WAITER',
  ADMIN = 'ADMIN',
  BARTENDER = 'BARTENDER',
  CHEF = 'CHEF',
  SOUS_CHEF = 'SOUS_CHEF',
  KITCHEN_STAFF = 'KITCHEN_STAFF',
  HOST = 'HOST',
  MANAGER = 'MANAGER',
  ASSISTANT_MANAGER = 'ASSISTANT_MANAGER',
  CASHIER = 'CASHIER',
  BUSSER = 'BUSSER',
  FOOD_RUNNER = 'FOOD_RUNNER',
  BARISTA = 'BARISTA',
  SECURITY = 'SECURITY',
  CLEANER = 'CLEANER',
  MAINTENANCE = 'MAINTENANCE',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  role: UserRole;
  companyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

