export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
}

export interface Table {
  id: string;
  number: number;
  qrCode: string;
  status: TableStatus;
  waiterId?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

