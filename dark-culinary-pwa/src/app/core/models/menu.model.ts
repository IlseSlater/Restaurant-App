export enum MenuCategory {
  APPETIZER = 'APPETIZER',
  MAIN_COURSE = 'MAIN_COURSE',
  DESSERT = 'DESSERT',
  BEVERAGE = 'BEVERAGE',
  SIDE = 'SIDE',
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  isAvailable: boolean;
  isBundle?: boolean;
  prepTime?: number;
  preparationTime?: number;
  imageUrl?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

