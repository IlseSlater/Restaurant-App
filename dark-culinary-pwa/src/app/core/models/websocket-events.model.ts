/** Events emitted to customer room */
export interface OrderStatusUpdatedEvent {
  orderId: string;
  status: string;
  sessionId?: string;
}

export interface ItemStatusUpdatedEvent {
  orderId: string;
  itemId: string;
  status: string;
}

export interface WaiterCallAcknowledgedEvent {
  callId: string;
  tableId: string;
  sessionId?: string;
}

export interface ManagerCallAcknowledgedEvent {
  callId: string;
  tableId: string;
  sessionId?: string;
  acknowledgedBy?: string;
}

export interface SessionEndedEvent {
  sessionId: string;
  tableId: string;
}

/** Events emitted to staff rooms */
export interface CustomerOrderCreatedEvent {
  orderId: string;
  tableId: string;
  companyId: string;
  isBar?: boolean;
  isKitchen?: boolean;
}

export interface ManagerCallCreatedEvent {
  callId: string;
  tableId: string;
  tableNumber?: number;
  customerSessionId: string;
  createdAt: string;
}
