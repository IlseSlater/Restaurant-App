export enum WaiterCallType {
  WAITER = 'WAITER',
  MANAGER = 'MANAGER',
}

export interface WaiterCall {
  id: string;
  tableId: string;
  customerSessionId: string;
  callType: string;
  message?: string;
  status: string;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

