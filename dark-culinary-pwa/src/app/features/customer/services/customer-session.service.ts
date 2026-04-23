import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, tap, map, switchMap, Observable, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { StorageService } from '../../../core/services/storage.service';
import { CustomerSession } from '../../../core/models/customer-session.model';
import { WebSocketService } from '../../../core/services/websocket.service';

const SESSION_KEY = 'dark_culinary_customer_session';

/** Response from GET customer-sessions/table/:tableId/scan-status */
export interface ScanStatusResponse {
  hasActiveSession: boolean;
  sessionId?: string;
  tableId: string;
  tableNumber: number;
  companyId: string | null;
  participants?: { id: string; displayName: string; isCreator: boolean }[];
}

/** Session as returned by GET customer-sessions/:id (includes participants and orders). */
export interface SessionWithBill {
  id: string;
  customerName: string;
  tableId: string;
  companyId: string;
  table?: { number: number };
  participants?: { id: string; displayName: string; isCreator: boolean }[];
  orders?: Array<{
    id: string;
    participantId: string | null;
    status?: string;
    subtotal?: number;
    total?: number;
    items?: Array<{ quantity: number; price: number; status?: string; menuItem?: { name: string } }>;
  }>;
}

/** Response from GET customer-sessions/:id/payment-status */
export interface PaymentStatusResponse {
  participants: { participantId: string; displayName: string; paid: boolean; paidBy?: string }[];
}

function withParticipantId(session: CustomerSession & { participants?: { id: string; displayName: string; isCreator: boolean }[] }): CustomerSession {
  if (!session || session.participantId) return session as CustomerSession;
  const creator = session.participants?.find((p) => p.isCreator);
  const first = session.participants?.[0];
  const participantId = creator?.id ?? first?.id;
  return { ...session, participantId, participants: session.participants } as CustomerSession;
}

function normalizeStoredSession(raw: CustomerSession | null): CustomerSession | null {
  if (!raw) return null;

  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const tableId = typeof raw.tableId === 'string' ? raw.tableId.trim() : '';
  const companyId = typeof raw.companyId === 'string' ? raw.companyId.trim() : '';
  if (!id || !tableId || !companyId) return null;

  const customerName =
    typeof raw.customerName === 'string' && raw.customerName.trim().length > 0
      ? raw.customerName.trim()
      : 'Guest';

  const participantId =
    typeof raw.participantId === 'string' && raw.participantId.trim().length > 0
      ? raw.participantId.trim()
      : undefined;

  const participants = Array.isArray(raw.participants)
    ? raw.participants.filter(
        (p): p is { id: string; displayName: string; isCreator: boolean } =>
          !!p &&
          typeof p.id === 'string' &&
          p.id.trim().length > 0 &&
          typeof p.displayName === 'string' &&
          p.displayName.trim().length > 0,
      )
    : undefined;

  return {
    ...raw,
    id,
    tableId,
    companyId,
    customerName,
    participantId,
    participants,
  };
}

@Injectable({
  providedIn: 'root',
})
export class CustomerSessionService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly ws = inject(WebSocketService);

  private readonly sessionSubject = new BehaviorSubject<CustomerSession | null>(this.loadFromStorage());
  readonly currentSession$ = this.sessionSubject.asObservable();

  get currentSessionSnapshot(): CustomerSession | null {
    return this.sessionSubject.value;
  }

  constructor() {
    const stored = this.sessionSubject.value;
    if (stored) {
      this.ws.connect();
      this.ws.joinRoom(`customer-${stored.id}`);
      if (stored.tableId) this.ws.joinRoom(`table-${stored.tableId}`);
      if (stored.companyId) this.ws.joinCompanyRooms(stored.companyId, ['customer']);
    }
  }

  startSession(companyId: string, tableId: string, payload: Partial<CustomerSession> & { dietaryPreferences?: string[]; allergies?: string }) {
    return this.api
      .post<CustomerSession & { participants?: { id: string; displayName: string; isCreator: boolean }[] }>('customer-sessions', {
        companyId,
        tableId,
        customerName: payload.customerName,
        phoneNumber: payload.phoneNumber ?? undefined,
        dietaryPreferences: payload.dietaryPreferences ?? undefined,
        allergies: payload.allergies ?? undefined,
      })
      .pipe(
        map(withParticipantId),
        tap((session) => {
          const normalized = normalizeStoredSession(session);
          if (!normalized) return;
          this.storage.set(SESSION_KEY, normalized);
          this.sessionSubject.next(normalized);
          this.ws.connect();
          this.ws.joinRoom(`customer-${normalized.id}`);
          if (normalized.tableId) this.ws.joinRoom(`table-${normalized.tableId}`);
          if (normalized.companyId) this.ws.joinCompanyRooms(normalized.companyId, ['customer']);
        }),
      );
  }

  /** Check if table has an active session (for scan flow: join vs start). */
  getScanStatus(tableId: string, companyId?: string) {
    const params = companyId ? { companyId } : {};
    return this.api.get<ScanStatusResponse>(
      `customer-sessions/table/${tableId}/scan-status`,
      params,
    );
  }

  /** Join an existing table session. Pass participantId to rejoin as that participant (e.g. after cleared cookies). */
  joinSession(
    sessionId: string,
    body: { displayName?: string; phoneNumber?: string; deviceId?: string; participantId?: string },
  ) {
    return this.api
      .post<{ participant: { id: string; displayName: string; isCreator: boolean }; sessionId: string }>(
        `customer-sessions/${sessionId}/join`,
        body,
      )
      .pipe(
        switchMap((joinRes) =>
          this.api.get<CustomerSession & { table?: { number: number }; participants?: { id: string; displayName: string; isCreator: boolean }[] }>(
            `customer-sessions/${sessionId}`,
          ).pipe(
            map((full) => ({
              ...full,
              participantId: joinRes.participant.id,
              participants: full.participants ?? [],
            })),
          ),
        ),
        tap((session) => {
          const normalized = normalizeStoredSession(session);
          if (!normalized) return;
          this.storage.set(SESSION_KEY, normalized);
          this.sessionSubject.next(normalized);
          this.ws.connect();
          this.ws.joinRoom(`customer-${normalized.id}`);
          if (normalized.tableId) this.ws.joinRoom(`table-${normalized.tableId}`);
          if (normalized.companyId) this.ws.joinCompanyRooms(normalized.companyId, ['customer']);
        }),
      );
  }

  moveSessionToTable(
    sessionId: string,
    tableId: string,
    hints?: { currentTableId?: string; companyId?: string },
  ) {
    return this.api
      .put<CustomerSession & { participants?: { id: string; displayName: string; isCreator: boolean }[] }>(
        `customer-sessions/${sessionId}/move-table`,
        {
          tableId,
          currentTableId: hints?.currentTableId,
          companyId: hints?.companyId,
        },
      )
      .pipe(
        map(withParticipantId),
        tap((session) => {
          const normalized = normalizeStoredSession(session);
          if (!normalized) return;
          const previous = this.sessionSubject.value;
          if (previous?.tableId && previous.tableId !== normalized.tableId) {
            this.ws.leaveRoom(`table-${previous.tableId}`);
          }
          this.storage.set(SESSION_KEY, normalized);
          this.sessionSubject.next(normalized);
          this.ws.connect();
          this.ws.joinRoom(`customer-${normalized.id}`);
          if (normalized.tableId) this.ws.joinRoom(`table-${normalized.tableId}`);
          if (normalized.companyId) this.ws.joinCompanyRooms(normalized.companyId, ['customer']);
        }),
      );
  }

  /** Fetch full session with participants and orders (for bill page). */
  getSessionWithBill(sessionId: string) {
    return this.api.get<SessionWithBill>(`customer-sessions/${sessionId}`);
  }

  /** Fetch payment status per participant (for leave-table check). */
  getPaymentStatus(sessionId: string) {
    return this.api.get<PaymentStatusResponse>(`customer-sessions/${sessionId}/payment-status`);
  }

  /**
   * Check if the current participant can leave (no unpaid bill).
   * Returns observable of { allowed: true } if they can leave, { allowed: false } if they must pay first.
   */
  checkCanLeave(session: CustomerSession): Observable<{ allowed: boolean }> {
    const myId = session.participantId;
    return this.getSessionWithBill(session.id).pipe(
      switchMap((swb) => {
        const myOrders = (swb.orders ?? []).filter(
          (o) => o.participantId === myId && (o.status ?? '').toUpperCase() !== 'CANCELLED',
        );
        const myTotal = myOrders.reduce((s, o) => {
          const raw =
            typeof o.total === 'number'
              ? o.total
              : typeof o.subtotal === 'number'
                ? o.subtotal
                : Number(o.subtotal);
          const n = Number.isFinite(raw) ? raw : 0;
          return s + n;
        }, 0);
        if (myTotal === 0) return of({ allowed: true });
        return this.getPaymentStatus(session.id).pipe(
          map((status) => {
            const me = status.participants?.find((p) => p.participantId === myId);
            return { allowed: me?.paid === true };
          }),
        );
      }),
    );
  }

  /** Merge participant id and participants from server into current session and persist. */
  mergeSessionParticipant(sessionId: string, participantId: string, participants?: SessionWithBill['participants']) {
    const current = this.sessionSubject.value;
    if (current?.id !== sessionId) return;
    const next: CustomerSession = {
      ...current,
      participantId,
      participants: participants ?? current.participants,
    };
    this.storage.set(SESSION_KEY, next);
    this.sessionSubject.next(next);
  }

  endSession(sessionId: string) {
    return this.api.put<void>(`customer-sessions/${sessionId}/end`, {}).pipe(
      tap(() => {
        this.clearLocalSession(sessionId);
      }),
    );
  }

  /** Clear session from storage and state without calling API (e.g. after payment success). */
  clearLocalSession(sessionId?: string): void {
    const current = this.sessionSubject.value;
    if (sessionId && current?.id === sessionId && current.tableId) {
      this.ws.leaveRoom(`table-${current.tableId}`);
    }
    if (sessionId) {
      this.ws.leaveRoom(`customer-${sessionId}`);
    }
    this.storage.remove(SESSION_KEY);
    this.sessionSubject.next(null);
  }

  private loadFromStorage(): CustomerSession | null {
    const stored = this.storage.get<CustomerSession | null>(SESSION_KEY);
    const normalized = normalizeStoredSession(stored);
    if (!normalized && stored) {
      this.storage.remove(SESSION_KEY);
    } else if (normalized && JSON.stringify(stored) !== JSON.stringify(normalized)) {
      this.storage.set(SESSION_KEY, normalized);
    }
    return normalized;
  }
}

