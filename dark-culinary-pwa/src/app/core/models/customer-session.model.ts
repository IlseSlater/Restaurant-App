export interface SessionParticipant {
  id: string;
  displayName: string;
  isCreator: boolean;
}

export interface CustomerSession {
  id: string;
  customerName: string;
  phoneNumber?: string;
  dietaryPreferences?: string[];
  allergies?: string;
  tableId: string;
  companyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** Current user's participant id (set when starting or joining session). */
  participantId?: string;
  /** People at the table (from getSession / createSession). */
  participants?: SessionParticipant[];
}

