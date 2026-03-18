import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { CompanyDataService } from '../../../../core/services/company-data.service';
import { CompanyContextService } from '../../../../core/services/company-context.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TopAppBarComponent, TopAppBarAction } from '../../../../shared/components/top-app-bar/top-app-bar.component';
import { StatusPipe } from '../../../../shared/pipes/status.pipe';
import { ConfirmClearTableDialogComponent } from '../../components/confirm-clear-table-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

interface WaiterTableViewModel {
  id: string;
  number: number;
  status: string;
  idleMinutes: number | null;
  isPulsing: boolean;
  orderCount: number;
  hasCall: boolean;
  hasReadyItems: boolean;
}

interface WaiterCallViewModel {
  id: string;
  tableId: string;
  tableLabel: string;
  callType: string;
  status: string;
}

interface TableOrderDetailItem {
  id: string;
  name: string;
  quantity: number;
  status: string;
  modifiers?: Array<{ groupName: string; optionName: string }>;
  bundleChoices?: Array<{ slotName: string; chosenItemName: string }>;
  notes?: string;
}

interface TableOrderDetail {
  id: string;
  tableId: string;
  status: string;
  items: TableOrderDetailItem[];
}

@Component({
  selector: 'app-waiter-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    TopAppBarComponent,
    StatusPipe,
    EmptyStateComponent,
  ],
  template: `
    <app-top-app-bar
      [title]="(appBarTitle$ | async) ?? 'Waiter Dashboard'"
      [showBack]="false"
      [actions]="appBarActions"
      (actionClick)="onActionClick($event)"
    />

    <div class="waiter">
      <div class="tab-row">
        <button
          mat-button
          [class.active]="activeTab() === 0"
          (click)="setTab(0)"
        >
          <mat-icon>table_restaurant</mat-icon>
          Active tables
        </button>
        <button
          mat-button
          [class.active]="activeTab() === 1"
          (click)="setTab(1)"
        >
          <mat-icon>notifications_active</mat-icon>
          Ready to serve
        </button>
        <button
          mat-button
          [class.active]="activeTab() === 2"
          (click)="setTab(2)"
        >
          <mat-icon>support_agent</mat-icon>
          Waiter calls
          @if ((waiterCalls$ | async)?.length) {
            <span matBadge="{{ (waiterCalls$ | async)!.length }}" matBadgeSize="small" class="call-badge"></span>
          }
        </button>
      </div>

      @if (activeTab() === 0) {
        <section class="section table-grid">
          @if (activeTablesVm$ | async; as tables) {
            @if (tables.length === 0) {
              <app-empty-state
                icon="table_restaurant"
                title="No active tables"
                description="Tables with orders or waiter calls will appear here."
              />
            } @else {
              @for (table of tables; track table.id) {
                <div class="table-card" [class.pulse]="table.isPulsing" (click)="openTableDetails(table.id, table.number)">
                  <div class="header">
                    <span class="label dc-heading">Table {{ table.number }}</span>
                    <span class="chips">
                      @if (table.hasCall) {
                        <mat-chip-set>
                          <mat-chip class="call-chip">Call</mat-chip>
                        </mat-chip-set>
                      }
                      @if (table.orderCount > 0) {
                        <span class="order-badge">{{ table.orderCount }}</span>
                      }
                    </span>
                  </div>
                  <small class="dc-body">Status: {{ table.status | statusLabel }}</small>
                  @if (table.idleMinutes !== null) {
                    <small class="idle dc-caption">Idle {{ table.idleMinutes }}m</small>
                  }
                </div>
              }
            }
          }
        </section>
      }

      @if (activeTab() === 1) {
        <section class="section table-grid">
          @if (readyToServeTablesVm$ | async; as tables) {
            @if (tables.length === 0) {
              <app-empty-state
                icon="notifications_active"
                title="Nothing ready to serve"
                description="Items marked ready by kitchen or bar will appear here."
              />
            } @else {
              @for (table of tables; track table.id) {
                <div class="table-card" (click)="openTableDetails(table.id, table.number)">
                  <div class="header">
                    <span class="label dc-heading">Table {{ table.number }}</span>
                    <span class="order-badge">{{ table.orderCount }}</span>
                  </div>
                  <small class="dc-body">Ready to collect</small>
                </div>
              }
            }
          }
        </section>
      }

      @if (activeTab() === 2) {
        <section class="section">
          @for (call of (waiterCalls$ | async); track call.id) {
            <div class="call-card">
              <div class="call-header">
                <mat-icon>support_agent</mat-icon>
                <span>{{ call.tableLabel }} – {{ call.callType }}</span>
              </div>
              <small class="dc-body">Status: {{ call.status | statusLabel }}</small>
              <div class="actions">
                <button mat-button (click)="acknowledgeCall(call.id); $event.stopPropagation()">
                  Acknowledge
                </button>
                <button mat-button (click)="resolveCall(call.id); $event.stopPropagation()">
                  Resolve
                </button>
              </div>
            </div>
          }
          @if ((waiterCalls$ | async)?.length === 0) {
            <app-empty-state
              icon="support_agent"
              title="No pending calls"
              description="Waiter calls from guests will appear here."
            />
          }
        </section>
      }
    </div>

    @if (drawerOpen()) {
      <div class="drawer-overlay" (click)="closeDrawer()"></div>
      <div class="drawer">
        <div class="drawer-header">
          <h2>Table {{ drawerTableNumber() }}</h2>
          <button mat-icon-button (click)="closeDrawer()" aria-label="Close">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="drawer-actions">
          <button mat-flat-button color="warn" (click)="clearTableWithConfirm()">
            <mat-icon>cleaning_services</mat-icon>
            Clear table
          </button>
        </div>
        <div class="drawer-orders">
          <h3>Orders</h3>
          <div class="drawer-item-tabs">
            <button
              mat-button
              [class.active]="drawerItemsTab() === 'active'"
              (click)="setDrawerItemsTab('active')"
            >
              Active
            </button>
            <button
              mat-button
              [class.active]="drawerItemsTab() === 'history'"
              (click)="setDrawerItemsTab('history')"
            >
              History
            </button>
          </div>
          @if (drawerItemsTab() === 'active') {
            @for (order of drawerActiveOrders(); track order.id) {
              <div class="order-card">
                <div class="order-header">
                  <div class="order-title">
                    <span class="order-label">Order</span>
                    <span class="order-id">#{{ order.id }}</span>
                  </div>
                  <mat-chip
                    class="order-status-chip"
                    [ngClass]="'status-' + order.status.toLowerCase()"
                  >
                    {{ order.status | statusLabel }}
                  </mat-chip>
                </div>
                @for (item of order.items; track item.id) {
                  <div class="order-item">
                    <div class="order-item-main">
                      <span>{{ item.name }} × {{ item.quantity }}</span>
                      <span
                        class="item-status"
                        [ngClass]="'status-' + item.status.toLowerCase()"
                      >
                        {{ item.status | statusLabel }}
                      </span>
                    </div>
                    @if (item.modifiers?.length) {
                      <div class="item-modifiers">
                        <span *ngFor="let mod of item.modifiers" class="modifier-tag" [class.modifier-exclusion]="mod.optionName.startsWith('No ')">{{ mod.optionName }}</span>
                      </div>
                    }
                    @if (item.bundleChoices?.length) {
                      <div class="item-bundle-choices">
                        <div *ngFor="let choice of item.bundleChoices" class="bundle-choice-line">{{ choice.slotName }}: {{ choice.chosenItemName }}</div>
                      </div>
                    }
                    @if (item.notes) {
                      <div class="item-notes">{{ item.notes }}</div>
                    }
                    <div class="item-actions">
                      <button
                        mat-button
                        class="status-btn collected"
                        (click)="updateItemStatus(order.id, item.id, 'COLLECTED')"
                      >
                        Collected
                      </button>
                      <button
                        mat-button
                        class="status-btn served"
                        (click)="updateItemStatus(order.id, item.id, 'SERVED')"
                      >
                        Served
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          } @else {
            @for (order of drawerHistoryOrders(); track order.id) {
              <div class="order-card">
                <div class="order-header">
                  <div class="order-title">
                    <span class="order-label">Order</span>
                    <span class="order-id">#{{ order.id }}</span>
                  </div>
                  <mat-chip
                    class="order-status-chip"
                    [ngClass]="'status-' + order.status.toLowerCase()"
                  >
                    {{ order.status | statusLabel }}
                  </mat-chip>
                </div>
                @for (item of order.items; track item.id) {
                  <div class="order-item">
                    <div class="order-item-main">
                      <span>{{ item.name }} × {{ item.quantity }}</span>
                      <span
                        class="item-status"
                        [ngClass]="'status-' + item.status.toLowerCase()"
                      >
                        {{ item.status | statusLabel }}
                      </span>
                    </div>
                    @if (item.modifiers?.length) {
                      <div class="item-modifiers">
                        <span *ngFor="let mod of item.modifiers" class="modifier-tag" [class.modifier-exclusion]="mod.optionName.startsWith('No ')">{{ mod.optionName }}</span>
                      </div>
                    }
                    @if (item.bundleChoices?.length) {
                      <div class="item-bundle-choices">
                        <div *ngFor="let choice of item.bundleChoices" class="bundle-choice-line">{{ choice.slotName }}: {{ choice.chosenItemName }}</div>
                      </div>
                    }
                    @if (item.notes) {
                      <div class="item-notes">{{ item.notes }}</div>
                    }
                    <div class="item-actions">
                      <button
                        mat-button
                        class="status-btn collected"
                        (click)="updateItemStatus(order.id, item.id, 'COLLECTED')"
                      >
                        Collected
                      </button>
                      <button
                        mat-button
                        class="status-btn served"
                        (click)="updateItemStatus(order.id, item.id, 'SERVED')"
                      >
                        Served
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .waiter {
        padding: var(--space-4);
        padding-bottom: var(--space-7);
      }
      .tab-row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
      }
      .tab-row button {
        text-transform: none;
        transition: background-color 200ms ease, color 200ms ease;
      }
      .tab-row button.active {
        background-color: var(--accent-primary);
        color: var(--text-inverse);
      }
      .call-badge {
        margin-left: var(--space-1);
      }
      .section {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }
      .table-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-3);
      }
      @media (min-width: 600px) {
        .table-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (min-width: 960px) {
        .table-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }
      .table-card {
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-subtle);
        background-color: var(--bg-glass);
        backdrop-filter: blur(16px);
        padding: 1rem;
        cursor: pointer;
        transition: transform 150ms ease, box-shadow 200ms ease, border-color 200ms ease;
      }
      .table-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--accent-border);
      }
      .table-card.pulse {
        animation: waiter-pulse 2s ease-in-out infinite;
      }
      @keyframes waiter-pulse {
        0%, 100% {
          box-shadow: 0 0 0 0 var(--status-warning-soft);
          }
          70% {
          box-shadow: 0 0 0 10px transparent;
        }
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-1);
      }
      .label {
        font-weight: 600;
      }
      .chips {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .call-chip {
        background: var(--status-warning);
        color: var(--text-inverse);
      }
      .order-badge {
        background: var(--accent-primary);
        color: var(--text-inverse);
        border-radius: var(--radius-pill);
        min-width: 1.25rem;
        height: 1.25rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
      }
      .idle {
        display: block;
        margin-top: var(--space-1);
      }
      .call-card {
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-subtle);
        background-color: var(--bg-glass);
        backdrop-filter: blur(16px);
        padding: 1rem;
        transition: transform 150ms ease, box-shadow 200ms ease, border-color 200ms ease;
      }
      .call-card:hover {
        border-color: var(--accent-border);
        box-shadow: var(--shadow-sm);
      }
      .call-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .actions {
        margin-top: var(--space-2);
        display: flex;
        gap: var(--space-2);
      }
      .drawer-overlay {
        position: fixed;
        inset: 0;
        background: var(--overlay-bg);
        z-index: var(--z-overlay);
        animation: dc-fade-in 200ms ease-out;
      }
      .drawer {
        position: fixed;
        top: 0;
        right: 0;
        width: min(400px, 100vw);
        height: 100%;
        background: var(--bg-glass);
        backdrop-filter: blur(18px);
        border-left: 1px solid var(--border-subtle);
        box-shadow: var(--shadow-lg);
        z-index: var(--z-drawer);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: dc-slide-in-right 250ms ease-out;
      }
      .drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        border-bottom: 1px solid var(--border-subtle);
      }
      .drawer-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
      }
      .drawer-actions {
        padding: var(--space-4);
        border-bottom: 1px solid var(--border-subtle);
      }
      .drawer-orders {
        flex: 1;
        overflow: auto;
        padding: var(--space-4);
      }
      .drawer-item-tabs {
        display: flex;
        gap: var(--space-2);
        margin-bottom: var(--space-2);
      }
      .drawer-item-tabs button {
        transition: background-color 200ms ease, color 200ms ease;
      }
      .drawer-item-tabs button.active {
        background-color: var(--accent-primary);
        color: var(--text-inverse);
      }
      .drawer-orders h3 {
        margin: 0 0 var(--space-2) 0;
        font-size: 1rem;
        font-weight: 600;
      }
      .order-card {
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-lg);
        background-color: var(--bg-glass);
        backdrop-filter: blur(16px);
        padding: 1rem;
        margin-bottom: var(--space-3);
        box-shadow: var(--shadow-sm);
      }
      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-2);
      }
      .order-title {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }
      .order-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-muted);
      }
      .order-id {
        font-weight: 600;
        font-size: 0.95rem;
      }
      .order-status-chip {
        border-radius: var(--radius-pill);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: none;
      }
      .order-status-chip.status-pending,
      .order-status-chip.status-confirmed,
      .order-status-chip.status-preparing {
        background-color: var(--status-warning-soft);
        color: var(--status-warning);
      }
      .order-status-chip.status-ready {
        background-color: var(--status-info-soft);
        color: var(--status-info);
      }
      .order-status-chip.status-served,
      .order-status-chip.status-delivered {
        background-color: var(--status-success-soft);
        color: var(--status-success);
      }
      .order-item {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: var(--space-2);
        margin-top: var(--space-1);
      }
      .order-item-main {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-2);
      }
      .item-modifiers {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        width: 100%;
      }
      .modifier-tag {
        font-size: 0.75rem;
        padding: 0.2rem 0.5rem;
        border-radius: var(--radius-sm);
        background: var(--status-warning-soft);
        color: var(--status-warning);
      }
      .modifier-tag.modifier-exclusion {
        background: var(--status-error-soft);
        color: var(--status-error);
        text-decoration: line-through;
      }
      .item-bundle-choices {
        font-size: 0.85rem;
        color: var(--text-secondary);
        width: 100%;
      }
      .bundle-choice-line { margin: 0.15rem 0; }
      .item-notes {
        font-size: 0.85rem;
        font-style: italic;
        color: var(--text-secondary);
        padding: 0.35rem;
        background: var(--bg-elevated);
        border-radius: var(--radius-sm);
        width: 100%;
      }
      .item-status {
        font-size: 0.8rem;
        font-weight: 500;
      }
      .item-status.status-pending,
      .item-status.status-confirmed,
      .item-status.status-preparing {
        color: var(--status-warning);
      }
      .item-status.status-ready,
      .item-status.status-collected {
        color: var(--status-info);
      }
      .item-status.status-served,
      .item-status.status-delivered {
        color: var(--status-success);
      }
      .item-actions {
        margin-left: auto;
        display: inline-flex;
        gap: var(--space-2);
      }
      .status-btn {
        border-radius: var(--radius-pill);
        padding-inline: 0.75rem;
        font-size: 0.8rem;
        text-transform: none;
      }
      .status-btn.collected {
        background-color: var(--status-info-soft);
        color: var(--status-info);
      }
      .status-btn.served {
        background-color: var(--status-success-soft);
        color: var(--status-success);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaiterDashboardPage implements OnInit {
  private readonly companyData = inject(CompanyDataService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly ws = inject(WebSocketService);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  private readonly waiterCallsSubject = new BehaviorSubject<WaiterCallViewModel[]>([]);
  readonly waiterCalls$ = this.waiterCallsSubject.asObservable();

  private readonly tabIndex = signal(0);
  activeTab = this.tabIndex.asReadonly();

  private readonly drawerTableId = signal<string | null>(null);
  readonly drawerOpen = computed(() => this.drawerTableId() !== null);
  private readonly drawerTableNumberSignal = signal(0);
  readonly drawerOrders = signal<TableOrderDetail[]>([]);
  readonly drawerTableNumber = this.drawerTableNumberSignal.asReadonly();

  private readonly drawerItemsTabSignal = signal<'active' | 'history'>('active');
  readonly drawerItemsTab = this.drawerItemsTabSignal.asReadonly();

  // Items in PENDING / PREPARING / READY are considered "active" for the waiter
  private readonly activeItemStatuses = new Set(['PENDING', 'PREPARING', 'READY', 'COLLECTED']);
  // Items in SERVED / DELIVERED / COLLECTED are considered "history"
  private readonly historyItemStatuses = new Set(['SERVED', 'DELIVERED']);

  readonly drawerActiveOrders = computed(() => {
    const orders = this.drawerOrders();
    return orders
      .map((o) => {
        const items = o.items.filter((i) =>
          this.activeItemStatuses.has((i.status ?? '').toString().toUpperCase()),
        );
        return { ...o, items };
      })
      .filter((o) => o.items.length > 0);
  });

  readonly drawerHistoryOrders = computed(() => {
    const orders = this.drawerOrders();
    return orders
      .map((o) => {
        const items = o.items.filter((i) =>
          this.historyItemStatuses.has((i.status ?? '').toString().toUpperCase()),
        );
        return { ...o, items };
      })
      .filter((o) => o.items.length > 0);
  });

  appBarTitle$ = this.companyContext.currentCompany$.pipe(
    map((c) => (c ? `${c.name} — Waiter` : 'Waiter Dashboard')),
  );

  appBarActions: TopAppBarAction[] = [
    { icon: 'logout', label: 'Logout', id: 'logout' },
  ];

  readonly tablesVm$ = combineLatest([
    this.companyData.tables$,
    this.companyData.orders$,
    this.waiterCalls$,
  ]).pipe(
    map(([tables, orders, calls]) =>
      tables.map<WaiterTableViewModel>((t) => {
        const tableOrders = orders.filter((o) => o.tableId === t.id);
        const hasCall = calls.some((c) => c.tableId === t.id);
        const orderCount = tableOrders.length;
        let idleMinutes: number | null = null;
        let isPulsing = false;
        let hasReadyItems = false;
        if (tableOrders.length) {
          const latest = tableOrders
            .map((o: { updatedAt?: string; createdAt?: string }) => new Date(o.updatedAt ?? o.createdAt ?? Date.now()))
            .sort((a, b) => b.getTime() - a.getTime())[0];
          idleMinutes = Math.floor((Date.now() - latest.getTime()) / 60000);
          isPulsing = idleMinutes >= 15;
          hasReadyItems = tableOrders.some(
            (o) => (o as { items?: { status: string }[] })['items']?.some((i) => i.status === 'READY') ?? false,
          );
        }
        return {
          id: t.id,
          number: t.number,
          status: t.status,
          idleMinutes,
          isPulsing,
          orderCount,
          hasCall,
          hasReadyItems: !!hasReadyItems,
        };
      }),
    ),
  );

  activeTablesVm$ = this.tablesVm$.pipe(
    map((list) => list.filter((t) => t.orderCount > 0 || t.hasCall)),
  );

  readyToServeTablesVm$ = this.tablesVm$.pipe(
    map((list) => list.filter((t) => t.hasReadyItems)),
  );

  ngOnInit(): void {
    const companyGuid = this.route.snapshot.paramMap.get('companyGuid') ?? '';
    this.ws.connect();
    this.ws.joinCompanyRooms(companyGuid, ['waiters']);

    this.companyData.triggerTablesRefresh();
    this.companyData.triggerOrdersRefresh();

    this.loadPendingCalls(companyGuid);
    this.bindWebSocketHandlers(companyGuid);
  }

  private loadPendingCalls(companyId: string): void {
    this.api.get<unknown[]>('waiter-calls/pending', { companyId }).subscribe({
      next: (calls) => {
        const mapped: WaiterCallViewModel[] = (calls as Array<{ id: string; tableId?: string; table?: { number: number }; callType?: string; status?: string }>).map((c) => ({
          id: c.id,
          tableId: c.tableId ?? '',
          tableLabel: `Table ${c.table?.number ?? ''}`,
          callType: c.callType ?? 'WAITER',
          status: c.status ?? 'PENDING',
        }));
        this.waiterCallsSubject.next(mapped);
      },
    });
  }

  private bindWebSocketHandlers(companyId: string): void {
    this.ws.on<{ call?: WaiterCallViewModel & { table?: { number: number } }; tableNumber?: number }>('waiter_call_created').subscribe((payload) => {
      const call = payload.call ?? payload;
      const tableLabel = `Table ${payload.tableNumber ?? (payload.call as { table?: { number: number } })?.table?.number ?? ''}`;
      const current = this.waiterCallsSubject.value.filter((c) => c.id !== (call as { id: string }).id);
      this.waiterCallsSubject.next([
        ...current,
        {
          id: (call as { id: string }).id,
          tableId: (call as { tableId?: string }).tableId ?? '',
          tableLabel,
          callType: (call as { callType?: string }).callType ?? 'WAITER',
          status: (call as { status?: string }).status ?? 'PENDING',
        },
      ]);
    });

    this.ws.on<{ callId?: string; id?: string }>('waiter_call_resolved').subscribe((payload) => {
      const id = payload.callId ?? payload.id;
      this.waiterCallsSubject.next(this.waiterCallsSubject.value.filter((c) => c.id !== id));
    });

    this.ws.on<unknown>('order_status_changed').subscribe(() => {
      this.companyData.triggerOrdersRefresh();
      this.refreshDrawerIfOpen();
    });
    this.ws.on<unknown>('customer_order_created').subscribe(() => {
      this.companyData.triggerOrdersRefresh();
      this.refreshDrawerIfOpen();
    });
    this.ws.on<unknown>('item_status_updated').subscribe(() => {
      this.companyData.triggerOrdersRefresh();
      this.refreshDrawerIfOpen();
    });
  }

  setTab(index: number): void {
    this.tabIndex.set(index);
  }

  setDrawerItemsTab(tab: 'active' | 'history'): void {
    this.drawerItemsTabSignal.set(tab);
  }

  onActionClick(action: TopAppBarAction): void {
    if (action.id === 'logout') {
      this.auth.logout();
    }
  }

  openTableDetails(tableId: string, tableNumber: number): void {
    this.drawerTableId.set(tableId);
    this.drawerTableNumberSignal.set(tableNumber);
    this.api.get<unknown[]>(`orders/table/${tableId}`).subscribe({
      next: (orders) => {
        const raw = orders as Array<{
          id: string;
          tableId: string;
          status: string;
          items?: Array<{
            id: string;
            menuItem?: { name: string };
            quantity: number;
            status: string;
            modifiers?: Array<{ groupName: string; optionName: string }>;
            bundleChoices?: Array<{ slotName: string; chosenItemName: string }>;
            specialInstructions?: string;
            notes?: string;
          }>;
        }>;
        const mapped: TableOrderDetail[] = raw.map((o) => ({
          id: o.id,
          tableId: o.tableId,
          status: o.status,
          items: (o.items ?? []).map((i) => ({
            id: i.id,
            name: i.menuItem?.name ?? '',
            quantity: i.quantity,
            status: i.status,
            modifiers: i.modifiers,
            bundleChoices: i.bundleChoices,
            notes: i.specialInstructions ?? i.notes,
          })),
        }));
        this.drawerOrders.set(mapped);
      },
    });
  }

  closeDrawer(): void {
    this.drawerTableId.set(null);
  }

  clearTableWithConfirm(): void {
    const tableId = this.drawerTableId();
    if (!tableId) return;
    const tableNum = this.drawerTableNumberSignal();
    const ref = this.dialog.open(ConfirmClearTableDialogComponent, {
      data: { tableNumber: tableNum },
      width: '320px',
      maxWidth: '90vw',
      panelClass: 'dc-glass-dialog',
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.api.post(`tables/${tableId}/clear`, {}).subscribe({
          next: () => {
            this.notifications.success('Table cleared');
            this.closeDrawer();
            this.companyData.triggerTablesRefresh();
            this.companyData.triggerOrdersRefresh();
          },
          error: () => this.notifications.error('Failed to clear table'),
        });
      }
    });
  }

  acknowledgeCall(callId: string): void {
    this.api.put(`waiter-calls/${callId}/acknowledge`, {}).subscribe({
      next: () => {
        this.waiterCallsSubject.next(
          this.waiterCallsSubject.value.map((c) =>
            c.id === callId ? { ...c, status: 'ACKNOWLEDGED' } : c,
          ),
        );
      },
    });
  }

  resolveCall(callId: string): void {
    this.api.put(`waiter-calls/${callId}/resolve`, {}).subscribe({
      next: () => {
        this.waiterCallsSubject.next(this.waiterCallsSubject.value.filter((c) => c.id !== callId));
      },
    });
  }

  updateItemStatus(orderId: string, itemId: string, status: string): void {
    this.api.put(`orders/${orderId}/items/${itemId}/status`, { status }).subscribe({
      next: () => {
        this.refreshDrawerIfOpen();
      },
    });
  }

  private refreshDrawerIfOpen(): void {
    const tableId = this.drawerTableId();
    if (!tableId) {
      return;
    }
    this.api.get(`orders/table/${tableId}`).subscribe({
      next: (orders: unknown) => {
        const ords = orders as {
          id: string;
          tableId: string;
          status: string;
          items?: Array<{
            id: string;
            menuItem?: { name: string };
            quantity: number;
            status: string;
            modifiers?: Array<{ groupName: string; optionName: string }>;
            bundleChoices?: Array<{ slotName: string; chosenItemName: string }>;
            specialInstructions?: string;
            notes?: string;
          }>;
        }[];
        this.drawerOrders.set(
          ords.map((o) => ({
            id: o.id,
            tableId: o.tableId,
            status: o.status,
            items: (o.items ?? []).map((i) => ({
              id: i.id,
              name: i.menuItem?.name ?? '',
              quantity: i.quantity,
              status: i.status,
              modifiers: i.modifiers,
              bundleChoices: i.bundleChoices,
              notes: i.specialInstructions ?? i.notes,
            })),
          })),
        );
      },
    });
  }
}
