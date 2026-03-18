import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { CustomerOrder } from '../../../core/models/customer-order.model';
import { merge, Observable, of, Subject, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CustomerOrdersService {
  private readonly api = inject(ApiService);
  private readonly refresh$ = new Subject<void>();

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
}
