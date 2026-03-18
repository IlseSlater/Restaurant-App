import { MenuItem } from './menu.model';
import type { ModifierDisplay, BundleChoiceDisplay } from './modifier.model';

export enum CustomerOrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

export interface CustomerOrderItem {
  id: string;
  customerOrderId: string;
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string;
  status?: CustomerOrderStatus;
  menuItem?: MenuItem;
  modifiers?: ModifierDisplay[];
  bundleChoices?: BundleChoiceDisplay[];
  formattedSummary?: string;
}

export interface CustomerOrder {
  id: string;
  customerSessionId: string;
  items: CustomerOrderItem[];
  status: CustomerOrderStatus;
  total: number;
  tableId: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

