import { MenuItem } from './menu.model';
import type { ModifierDisplay, BundleChoiceDisplay } from './modifier.model';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string;
  status?: string;
  menuItem?: MenuItem;
  modifiers?: ModifierDisplay[];
  bundleChoices?: BundleChoiceDisplay[];
  formattedSummary?: string;
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  participantId?: string | null;
  participantDisplayName?: string;
  customerId?: string;
  customerName?: string;
  customerSessionId?: string;
  table?: { id: string; number: number };
  isCustomerOrder?: boolean;
}

