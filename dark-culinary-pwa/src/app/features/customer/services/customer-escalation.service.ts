import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, EMPTY, merge, map, switchMap, interval, withLatestFrom, filter, takeUntil } from 'rxjs';
import { WebSocketService } from '../../../core/services/websocket.service';
import { CustomerSessionService } from './customer-session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ApiService } from '../../../core/services/api.service';

export interface PendingCall {
  id: string;
  createdAt: string;
  /** When set, customer sees "On the way" instead of "Requested X ago" */
  status?: 'PENDING' | 'ACKNOWLEDGED';
}

type EscalationPayload = { callId?: string; customerSessionId?: string; timestamp?: string };

const PENDING_SYNC_INTERVAL_MS = 15_000;

@Injectable({
  providedIn: 'root',
})
export class CustomerEscalationService implements OnDestroy {
  private readonly ws = inject(WebSocketService);
  private readonly sessionService = inject(CustomerSessionService);
  private readonly notifications = inject(NotificationService);
  private readonly api = inject(ApiService);
  private syncSubscription: { unsubscribe: () => void } | null = null;
  private readonly sessionIdForResolvedCheck = new BehaviorSubject<string | null>(null);

  private readonly hasManagerEscalationSubject = new BehaviorSubject<boolean>(false);
  readonly hasManagerEscalation$ = this.hasManagerEscalationSubject.asObservable();

  private readonly pendingWaiterCallSubject = new BehaviorSubject<PendingCall | null>(null);
  readonly pendingWaiterCall$ = this.pendingWaiterCallSubject.asObservable();

  private readonly pendingManagerCallSubject = new BehaviorSubject<PendingCall | null>(null);
  readonly pendingManagerCall$ = this.pendingManagerCallSubject.asObservable();

  constructor() {
    // Subscribe to escalation WebSocket events only when there is an active session
    // (socket is connected and customer room is joined), so we receive manager_call_created,
    // manager_call_acknowledged and waiter_call_acknowledged on any customer page.
    this.sessionService.currentSession$
      .pipe(
        switchMap((session) => {
          if (!session) {
            this.hasManagerEscalationSubject.next(false);
            this.pendingWaiterCallSubject.next(null);
            this.pendingManagerCallSubject.next(null);
            return EMPTY;
          }
          return merge(
            this.ws.on<EscalationPayload>('manager_call_created').pipe(
              map((payload) => ({ type: 'created' as const, payload })),
            ),
            this.ws.on<EscalationPayload>('manager_call_acknowledged').pipe(
              map((payload) => ({ type: 'manager_ack' as const, payload })),
            ),
            this.ws.on<EscalationPayload>('waiter_call_acknowledged').pipe(
              map((payload) => ({ type: 'waiter_ack' as const, payload })),
            ),
            this.ws.on<EscalationPayload>('waiter_call_resolved').pipe(
              map((payload) => ({ type: 'resolved' as const, payload })),
            ),
          );
        }),
      )
      .subscribe(({ type, payload }) => {
        const current = this.sessionService.currentSessionSnapshot;
        if (!current) return;
        const forThisSession =
          payload.customerSessionId === current.id || !payload.customerSessionId;
        if (type !== 'waiter_ack' && type !== 'resolved' && !forThisSession) return;

        if (type === 'created') {
          this.markManagerRequested();
        } else if (type === 'manager_ack') {
          this.hasManagerEscalationSubject.next(false);
          this.setPendingCallAcknowledged(payload.callId);
          this.notifications.success('A manager has been notified and will be with you shortly.');
        } else if (type === 'waiter_ack') {
          this.setPendingCallAcknowledged(payload.callId);
          this.notifications.success('A waiter is on the way.');
        } else if (type === 'resolved' && payload.callId) {
          this.clearPendingCallById(payload.callId);
        }
      });

    // When we have a session and a pending call, periodically refetch so we clear state when waiter/manager resolves (fallback if WebSocket is missed)
    this.sessionService.currentSession$.subscribe((s) => {
      this.sessionIdForResolvedCheck.next(s?.id ?? null);
    });
    const sessionEnd$ = this.sessionService.currentSession$.pipe(filter((s) => !s));
    this.syncSubscription = this.sessionIdForResolvedCheck
      .pipe(
        switchMap((id) => {
          if (!id) return EMPTY;
          return interval(PENDING_SYNC_INTERVAL_MS).pipe(
            takeUntil(sessionEnd$),
            withLatestFrom(
              this.sessionService.currentSession$,
              this.pendingWaiterCall$,
              this.pendingManagerCall$,
            ),
            filter(([, session, w, m]) => !!session && (w != null || m != null)),
          );
        }),
      )
      .subscribe(() => this.syncPendingCallsFromApi());
  }

  private stopPendingSync(): void {
    this.syncSubscription?.unsubscribe();
    this.syncSubscription = null;
  }

  private syncPendingCallsFromApi(): void {
    const session = this.sessionService.currentSessionSnapshot;
    if (!session?.tableId) return;
    this.api
      .get<Array<{ id: string; createdAt: string; callType: string; customerSessionId: string; status: string }>>(
        `waiter-calls/table/${session.tableId}`,
      )
      .subscribe({
        next: (calls) => {
          const pending = calls.filter(
            (c) =>
              c.customerSessionId === session.id && c.status !== 'RESOLVED',
          );
          this.setPendingCallsFromApi(pending);
        },
      });
  }

  ngOnDestroy(): void {
    this.stopPendingSync();
  }

  markManagerRequested(): void {
    this.hasManagerEscalationSubject.next(true);
  }

  setPendingWaiterCall(call: PendingCall): void {
    this.pendingWaiterCallSubject.next({ ...call, status: call.status ?? 'PENDING' });
  }

  setPendingManagerCall(call: PendingCall): void {
    this.pendingManagerCallSubject.next({ ...call, status: call.status ?? 'PENDING' });
    this.hasManagerEscalationSubject.next(true);
  }

  /** Mark the pending waiter or manager call as acknowledged so UI shows "On the way". */
  setPendingCallAcknowledged(callId: string | undefined): void {
    if (!callId) return;
    const waiter = this.pendingWaiterCallSubject.value;
    if (waiter?.id === callId) {
      this.pendingWaiterCallSubject.next({ ...waiter, status: 'ACKNOWLEDGED' });
    }
    const manager = this.pendingManagerCallSubject.value;
    if (manager?.id === callId) {
      this.pendingManagerCallSubject.next({ ...manager, status: 'ACKNOWLEDGED' });
    }
  }

  clearPendingCallById(callId: string): void {
    if (this.pendingWaiterCallSubject.value?.id === callId) {
      this.pendingWaiterCallSubject.next(null);
    }
    if (this.pendingManagerCallSubject.value?.id === callId) {
      this.pendingManagerCallSubject.next(null);
      this.hasManagerEscalationSubject.next(false);
    }
  }

  /** Sync pending state from API (e.g. when opening help sheet). Expects non-resolved calls for this session, newest first. */
  setPendingCallsFromApi(calls: Array<{ id: string; createdAt: string; callType: string; status?: string }>): void {
    let waiter: PendingCall | null = null;
    let manager: PendingCall | null = null;
    for (const c of calls) {
      const type = (c.callType ?? '').toUpperCase();
      const status = (c.status ?? 'PENDING').toUpperCase() === 'ACKNOWLEDGED' ? 'ACKNOWLEDGED' : 'PENDING';
      if (type === 'MANAGER' && !manager) manager = { id: c.id, createdAt: c.createdAt, status };
      else if (type === 'WAITER' && !waiter) waiter = { id: c.id, createdAt: c.createdAt, status };
    }
    this.pendingWaiterCallSubject.next(waiter);
    this.pendingManagerCallSubject.next(manager);
    if (manager) this.hasManagerEscalationSubject.next(true);
    else this.hasManagerEscalationSubject.next(false);
  }

  /** Format time since request for display (e.g. "2m ago", "1h ago"). */
  static timeAgo(createdAt: string): string {
    if (!createdAt) return '';
    const ms = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const h = Math.floor(mins / 60);
    return `${h}h ago`;
  }
}

