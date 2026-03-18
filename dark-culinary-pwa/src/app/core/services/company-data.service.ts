import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, shareReplay, startWith, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import { CompanyContextService } from './company-context.service';

export interface TableSummary {
  id: string;
  number: number;
  status: string;
}

export interface MenuItemSummary {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

export interface OrderSummary {
  id: string;
  tableId: string;
  status: string;
  total: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WaiterCallSummary {
  id: string;
  tableId: string;
  customerSessionId: string;
  callType: string;
  status: string;
  createdAt?: string;
  tableNumber?: number;
}

@Injectable({
  providedIn: 'root',
})
export class CompanyDataService {
  private readonly api = inject(ApiService);
  private readonly companyContext = inject(CompanyContextService);

  private readonly refreshTables$ = new Subject<void>();
  private readonly refreshOrders$ = new Subject<void>();
  private readonly refreshMenu$ = new Subject<void>();
  private readonly refreshEscalations$ = new Subject<void>();

  private readonly escalationsMap = new Map<string, WaiterCallSummary>();

  readonly tables$: Observable<TableSummary[]> = combineLatest([
    this.companyContext.companyId$,
    this.refreshTables$.asObservable().pipe(startWith(undefined)),
  ]).pipe(
    switchMap(([companyId]) => {
      if (!companyId) {
        return [[]];
      }
      return this.api.get<TableSummary[]>(`tables`, { companyId });
    }),
    shareReplay(1),
  );

  readonly menuItems$: Observable<MenuItemSummary[]> = combineLatest([
    this.companyContext.companyId$,
    this.refreshMenu$.asObservable().pipe(startWith(undefined)),
  ]).pipe(
    switchMap(([companyId]) => {
      if (!companyId) {
        return [[]];
      }
      return this.api.get<MenuItemSummary[]>(`menu`, { companyId });
    }),
    shareReplay(1),
  );

  readonly orders$: Observable<OrderSummary[]> = combineLatest([
    this.companyContext.companyId$,
    this.refreshOrders$.asObservable().pipe(startWith(undefined)),
  ]).pipe(
    switchMap(([companyId]) => {
      if (!companyId) {
        return [[]];
      }
      return this.api.get<OrderSummary[]>(`orders`, { companyId });
    }),
    shareReplay(1),
  );

  private readonly escalationsSubject = new BehaviorSubject<WaiterCallSummary[]>([]);
  readonly escalations$ = this.escalationsSubject.asObservable();

  triggerTablesRefresh(): void {
    this.refreshTables$.next();
  }

  triggerOrdersRefresh(): void {
    this.refreshOrders$.next();
  }

  triggerMenuRefresh(): void {
    this.refreshMenu$.next();
  }

  upsertEscalation(call: WaiterCallSummary): void {
    if (call.callType === 'MANAGER') {
      this.escalationsMap.set(call.id, call);
      this.publishEscalations();
    }
  }

  updateEscalationStatus(id: string, status: string): void {
    const existing = this.escalationsMap.get(id);
    if (!existing) {
      return;
    }
    this.escalationsMap.set(id, { ...existing, status });
    this.publishEscalations();
  }

  removeEscalation(id: string): void {
    this.escalationsMap.delete(id);
    this.publishEscalations();
  }

  private publishEscalations(): void {
    this.escalationsSubject.next(Array.from(this.escalationsMap.values()));
  }
}

