import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { CustomerOrder } from '../../../core/models/customer-order.model';
import { WebSocketService } from '../../../core/services/websocket.service';
import { CustomerSessionService } from './customer-session.service';
import { merge, Observable, of, Subject, Subscription, switchMap } from 'rxjs';

const ORDER_REFRESH_EVENTS = [
  'order_status_changed',
  'order_status_updated',
  'item_status_updated',
  'customer_order_status_changed',
  'order_added',
] as const;

type OrderWsPayload = {
  customerSessionId?: string;
  sessionId?: string;
};

@Injectable({
  providedIn: 'root',
})
export class CustomerOrdersService {
  private readonly api = inject(ApiService);
  private readonly ws = inject(WebSocketService);
  private readonly sessionService = inject(CustomerSessionService);
  private readonly refresh$ = new Subject<void>();
  private realtimeSub: Subscription | null = null;

  /** Emits when orders should be refetched (WebSocket, reconnect, or manual). */
  readonly orderUpdates$ = this.refresh$.asObservable();

  constructor() {
    this.bindOrderRealtimeUpdates();
  }

  getOrdersBySession(sessionId: string): Observable<CustomerOrder[]> {
    return this.api.get<CustomerOrder[]>(`customer-orders/session/${sessionId}`);
  }

  /** Orders stream that refetches when triggerRefresh() is called (e.g. from WebSocket). */
  getOrdersBySessionWithRefresh(sessionId$: Observable<string | null>): Observable<CustomerOrder[]> {
    return sessionId$.pipe(
      switchMap((id) =>
        id
          ? merge(of(void 0), this.refresh$.asObservable()).pipe(
              switchMap(() => this.getOrdersBySession(id)),
            )
          : of([]),
      ),
    );
  }

  /** Call when WebSocket signals order status change to refetch orders. */
  triggerRefresh(): void {
    this.refresh$.next();
  }

  private bindOrderRealtimeUpdates(): void {
    this.realtimeSub?.unsubscribe();
    this.ws.connect();

    const subs = new Subscription();
    for (const event of ORDER_REFRESH_EVENTS) {
      subs.add(
        this.ws.on<OrderWsPayload>(event).subscribe((payload) => {
          if (!this.isRelevantOrderEvent(payload)) return;
          this.triggerRefresh();
        }),
      );
    }
    subs.add(this.ws.onConnect().subscribe(() => this.triggerRefresh()));
    this.realtimeSub = subs;
  }

  private isRelevantOrderEvent(payload: OrderWsPayload | undefined): boolean {
    if (!payload) return true;
    const eventSessionId = payload.customerSessionId ?? payload.sessionId;
    if (!eventSessionId) return true;
    const currentSessionId = this.sessionService.currentSessionSnapshot?.id;
    if (!currentSessionId) return true;
    return eventSessionId === currentSessionId;
  }
}
