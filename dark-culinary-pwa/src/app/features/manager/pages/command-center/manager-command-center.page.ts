import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CompanyDataService,
  WaiterCallSummary,
  TableSummary,
  OrderSummary,
} from '../../../../core/services/company-data.service';
import { CompanyContextService } from '../../../../core/services/company-context.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { HapticService } from '../../../../core/services/haptic.service';
import { combineLatest, map, Observable, take } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { TopAppBarComponent, TopAppBarAction } from '../../../../shared/components/top-app-bar/top-app-bar.component';
import { SparklineComponent } from '../../components/sparkline/sparkline.component';
import { StatusPipe } from '../../../../shared/pipes/status.pipe';

interface TableOrderDetail {
  id: string;
  tableId: string;
  status: string;
  items: { id: string; name: string; quantity: number; status: string }[];
}

interface FloorTile {
  id: string;
  number: number;
  level: 'ok' | 'warn' | 'critical';
  ageMinutes: number | null;
  hasEscalation: boolean;
}

interface StationHealth {
  id: string;
  label: string;
  metric: string;
  detail?: string;
  level: 'ok' | 'warn' | 'critical';
  sparkData: number[];
}

/** Order shape as returned by API (includes items with menuItem when loaded). */
interface OrderWithItems {
  id: string;
  tableId: string;
  status: string;
  items?: Array<{ id: string; status: string; menuItem?: { category?: string } }>;
}

const ACTIVE_ITEM_STATUSES = ['PENDING', 'PREPARING'];

function isDrinkCategory(category: string): boolean {
  const c = (category || '').toLowerCase();
  const drinkCategories = [
    'beverage', 'beverages', 'soft drinks', 'beer', 'cocktails', 'cocktail',
    'wine', 'wines', 'beers', 'whiskeys', 'vodkas', 'spirits', 'tequilas',
    'shots', 'neat', 'brandies', 'barbecue',
  ];
  return drinkCategories.some((d) => c.includes(d));
}

function countActiveItemsByStation(orders: OrderWithItems[]): { kitchen: number; bar: number } {
  let kitchen = 0;
  let bar = 0;
  for (const order of orders) {
    const items = order.items ?? [];
    for (const item of items) {
      const status = (item.status ?? '').toUpperCase();
      if (!ACTIVE_ITEM_STATUSES.includes(status)) continue;
      const category = item.menuItem?.category ?? '';
      if (isDrinkCategory(category)) bar += 1;
      else kitchen += 1;
    }
  }
  return { kitchen, bar };
}

@Component({
  selector: 'app-manager-command-center',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    TopAppBarComponent,
    SparklineComponent,
    StatusPipe,
  ],
  template: `
    <app-top-app-bar
      [title]="appBarTitle"
      [brandName]="companyName()"
      [brandLogo]="companyLogo()"
      [showBack]="false"
      [actions]="appBarActions"
      (actionClick)="onActionClick($event)"
    />

    <div class="manager">
      <section class="station-health" *ngIf="stationHealth$ | async as stationHealth">
        <h2 class="dc-heading">Station health</h2>
        <div class="station-grid">
          <div
            *ngFor="let station of stationHealth"
            class="station-card"
            [class.ok]="station.level === 'ok'"
            [class.warn]="station.level === 'warn'"
            [class.critical]="station.level === 'critical'"
          >
            <div class="label">{{ station.label }}</div>
            <div class="metric">{{ station.metric }}</div>
            @if (station.detail) {
              <div class="detail">{{ station.detail }}</div>
            }
            <app-sparkline [values]="station.sparkData" [level]="station.level" />
          </div>
        </div>
      </section>

      <section class="pulse">
        <h2 class="dc-heading">Floor Pulse</h2>
        <div class="pulse-grid" *ngIf="floorPulse$ | async as pulse">
          <button
            *ngFor="let tile of pulse"
            type="button"
            class="pulse-tile"
            [class.ok]="tile.level === 'ok'"
            [class.warn]="tile.level === 'warn'"
            [class.critical]="tile.level === 'critical'"
            (click)="openTablePanel(tile.id, tile.number)"
          >
            <div class="number">T{{ tile.number }}</div>
            <div class="detail">
              <small *ngIf="tile.ageMinutes !== null">Age {{ tile.ageMinutes }}m</small>
              <small *ngIf="tile.hasEscalation">Escalation</small>
            </div>
          </button>
        </div>
        <p *ngIf="(floorPulse$ | async)?.length === 0">No active tables.</p>
      </section>

      <section class="escalations">
        <h2 class="dc-heading">Escalations</h2>
        <div
          *ngFor="let esc of (escalations$ | async)"
          class="esc-card"
          [class.acknowledged]="esc.status === 'ACKNOWLEDGED'"
        >
          <div class="esc-header">
            <mat-icon class="esc-icon">priority_high</mat-icon>
            <mat-icon class="esc-icon">support_agent</mat-icon>
            <div class="esc-title">Table {{ esc.tableNumber ?? esc.tableId }} — Manager requested</div>
          </div>
          <div class="esc-subtitle">
            {{ timeSince(esc.createdAt) }} · Status: {{ esc.status }}
          </div>
          <div class="actions">
            <button mat-button (click)="claimEscalation(esc)">Claim</button>
            <button mat-button (click)="notifyWaiter(esc)">Notify waiter</button>
            <button mat-button color="warn" (click)="resolveEscalation(esc)">Resolve</button>
          </div>
        </div>
        <p *ngIf="(escalations$ | async)?.length === 0">No active escalations.</p>
      </section>
    </div>

    @if (panelOpen()) {
      <div class="panel-overlay" (click)="closePanel()"></div>
      <div class="panel">
        <div class="panel-header">
          <h2>Table {{ panelTableNumber() }}</h2>
          <button mat-icon-button (click)="closePanel()" aria-label="Close">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="panel-actions">
          <button mat-flat-button color="warn" (click)="forceClearFromPanel()">
            <mat-icon>cleaning_services</mat-icon>
            Force clear table
          </button>
        </div>
        <div class="panel-orders">
          <h3>Orders</h3>
          <div class="panel-item-tabs">
            <button
              mat-button
              [class.active]="panelItemsTab() === 'active'"
              (click)="setPanelItemsTab('active')"
            >
              Active
            </button>
            <button
              mat-button
              [class.active]="panelItemsTab() === 'history'"
              (click)="setPanelItemsTab('history')"
            >
              History
            </button>
          </div>
          @if (panelItemsTab() === 'active') {
            @for (order of panelActiveOrders(); track order.id) {
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
                    <span>{{ item.name }} × {{ item.quantity }}</span>
                    <span
                      class="item-status"
                      [ngClass]="'status-' + item.status.toLowerCase()"
                    >
                      {{ item.status | statusLabel }}
                    </span>
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
                      <button
                        mat-button
                        class="status-btn cancel"
                        (click)="updateItemStatus(order.id, item.id, 'CANCELLED')"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          } @else {
            @for (order of panelHistoryOrders(); track order.id) {
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
                    <span>{{ item.name }} × {{ item.quantity }}</span>
                    <span
                      class="item-status"
                      [ngClass]="'status-' + item.status.toLowerCase()"
                    >
                      {{ item.status | statusLabel }}
                    </span>
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
          <h3 class="calls-heading">Calls</h3>
          @for (call of panelCalls(); track call.id) {
            <div class="panel-call">
              <span>{{ call.callType }}</span>
              <small>{{ call.status | statusLabel }}</small>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .manager {
        padding: var(--space-4);
        padding-bottom: var(--space-7);
      }
      .station-health {
        margin-bottom: var(--space-4);
      }
      .station-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--space-3);
      }
      .station-card {
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-subtle);
        background-color: var(--bg-glass);
        backdrop-filter: blur(16px);
        padding: 1rem;
        transition: box-shadow 200ms ease, transform 150ms ease;
      }
      .station-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
      .station-card.ok {
        box-shadow: 0 0 0 1px var(--status-success-soft);
      }
      .station-card.warn {
        box-shadow: 0 0 0 1px var(--status-warning-soft);
      }
      .station-card.critical {
        box-shadow: 0 0 0 1px var(--status-error-soft);
      }
      .station-card .label {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-bottom: 0.25rem;
      }
      .station-card .metric {
        font-size: 1.1rem;
        font-weight: 600;
      }
      .station-card .detail {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin-bottom: 0.5rem;
      }
      .pulse-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: 0.5rem;
      }
      .pulse-tile {
        border-radius: var(--radius-md);
        padding: 0.5rem 0.6rem;
        background: var(--bg-glass);
        backdrop-filter: blur(16px);
        border: 1px solid var(--border-subtle);
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        cursor: pointer;
        text-align: left;
        font: inherit;
        color: inherit;
        transition: box-shadow 200ms ease, transform 150ms ease, border-color 200ms ease;
      }
      .pulse-tile:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-sm);
        border-color: var(--accent-border);
      }
      .pulse-tile.ok {
        box-shadow: 0 0 0 1px var(--status-success-soft);
      }
      .pulse-tile.warn {
        box-shadow: 0 0 0 1px var(--status-warning-soft);
      }
      .pulse-tile.critical {
        box-shadow: 0 0 0 1px var(--status-error-soft);
      }
      .pulse-tile.critical:hover {
        animation: dc-pulse-glow 2s ease-in-out infinite;
      }
      .pulse-tile .number {
        font-weight: 600;
      }
      .pulse-tile .detail {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
      .escalations .esc-card {
        border-radius: var(--radius-lg);
        border: 2px solid var(--accent-secondary);
        background-color: var(--bg-glass);
        backdrop-filter: blur(16px);
        padding: 1rem;
        margin-bottom: var(--space-2);
      }
      .escalations .esc-card.acknowledged {
        border-color: var(--border-subtle);
      }
      .esc-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
      }
      .esc-icon {
        font-size: 1.2rem;
        width: 1.2rem;
        height: 1.2rem;
        color: var(--accent-secondary, #ffb86c);
      }
      .esc-title {
        font-weight: 600;
      }
      .esc-subtitle {
        font-size: 0.85rem;
        color: var(--text-muted);
        margin-bottom: 0.5rem;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .panel-overlay {
        position: fixed;
        inset: 0;
        background: var(--overlay-bg);
        z-index: var(--z-overlay);
        animation: dc-fade-in 200ms ease-out;
      }
      .panel {
        position: fixed;
        top: 0;
        right: 0;
        width: min(360px, 100vw);
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
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        border-bottom: 1px solid var(--border-subtle);
      }
      .panel-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
      }
      .panel-actions {
        padding: var(--space-4);
        border-bottom: 1px solid var(--border-subtle);
      }
      .panel-actions button mat-icon {
        margin-right: var(--space-2);
        vertical-align: middle;
      }
      .panel-orders {
        flex: 1;
        overflow: auto;
        padding: var(--space-4);
      }
      .panel-orders h3 {
        margin: 0 0 var(--space-2) 0;
        font-size: 1rem;
        font-weight: 600;
      }
      .panel-orders h3.calls-heading {
        margin-top: var(--space-4);
      }
      .panel-item-tabs {
        display: flex;
        gap: var(--space-2);
        margin-bottom: var(--space-2);
      }
      .panel-item-tabs button {
        transition: background-color 200ms ease, color 200ms ease;
      }
      .panel-item-tabs button.active {
        background-color: var(--accent-primary);
        color: var(--text-inverse);
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
        align-items: center;
        gap: var(--space-2);
        margin-top: var(--space-1);
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
      .status-btn.cancel {
        background-color: var(--status-error-soft);
        color: var(--status-error);
      }
      .panel-call {
        padding: var(--space-2) 0;
        border-bottom: 1px solid var(--border-subtle);
        font-size: 0.9rem;
      }
      .panel-call small {
        color: var(--text-muted);
        margin-left: var(--space-2);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerCommandCenterPage implements OnInit {
  private readonly companyData = inject(CompanyDataService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly ws = inject(WebSocketService);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly haptics = inject(HapticService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly panelTableId = signal<string | null>(null);
  private readonly panelTableNumberSignal = signal(0);
  readonly panelOrders = signal<TableOrderDetail[]>([]);
  readonly panelCalls = signal<WaiterCallSummary[]>([]);

  private readonly panelItemsTabSignal = signal<'active' | 'history'>('active');
  readonly panelItemsTab = this.panelItemsTabSignal.asReadonly();

  private readonly activeItemStatuses = new Set(['PENDING', 'PREPARING', 'READY', 'COLLECTED']);
  private readonly historyItemStatuses = new Set(['SERVED', 'DELIVERED']);

  readonly panelActiveOrders = computed(() => {
    const orders = this.panelOrders();
    return orders
      .map((o) => {
        const items = o.items.filter((i) =>
          this.activeItemStatuses.has((i.status ?? '').toString().toUpperCase()),
        );
        return { ...o, items };
      })
      .filter((o) => o.items.length > 0);
  });

  readonly panelHistoryOrders = computed(() => {
    const orders = this.panelOrders();
    return orders
      .map((o) => {
        const items = o.items.filter((i) =>
          this.historyItemStatuses.has((i.status ?? '').toString().toUpperCase()),
        );
        return { ...o, items };
      })
      .filter((o) => o.items.length > 0);
  });

  readonly panelTableNumber = this.panelTableNumberSignal.asReadonly();
  readonly panelOpen = computed(() => this.panelTableId() !== null);

  appBarTitle = '';
  readonly companyName = signal('');
  readonly companyLogo = signal<string | null>(null);
  appBarActions: TopAppBarAction[] = [];

  readonly escalations$ = this.companyData.escalations$;

  readonly floorPulse$: Observable<FloorTile[]> = combineLatest([
    this.companyData.tables$,
    this.companyData.orders$,
    this.companyData.escalations$,
  ]).pipe(
    map(([tables, orders, escalations]) =>
      tables.map((t: TableSummary) => {
        const tableOrders = orders.filter(
          (o: OrderSummary) => o.tableId === t.id && ['PENDING', 'PREPARING'].includes(o.status),
        );
        const hasEscalation = escalations.some((e) => e.tableId === t.id);
        if (!tableOrders.length && !hasEscalation) {
          return {
            id: t.id,
            number: t.number,
            level: 'ok' as const,
            ageMinutes: null,
            hasEscalation,
          };
        }
        let oldest = Date.now();
        tableOrders.forEach((o: OrderSummary & { updatedAt?: string; createdAt?: string }) => {
          const ts = new Date(o.updatedAt ?? o.createdAt ?? Date.now()).getTime();
          if (ts < oldest) oldest = ts;
        });
        const ageMinutes = Math.floor((Date.now() - oldest) / 60000);
        let level: 'ok' | 'warn' | 'critical' =
          ageMinutes < 10 ? (hasEscalation ? 'warn' : 'ok') : ageMinutes < 20 ? 'warn' : 'critical';
        if (hasEscalation && level !== 'critical') level = 'warn';
        return {
          id: t.id,
          number: t.number,
          level,
          ageMinutes,
          hasEscalation,
        };
      }),
    ),
  );

  private lastKitchenCounts: number[] = [];
  private lastBarCounts: number[] = [];
  private lastWaiterCounts: number[] = [];

  readonly stationHealth$: Observable<StationHealth[]> = combineLatest([
    this.companyData.orders$,
    this.companyData.escalations$,
  ]).pipe(
    map(([orders, escalations]) => {
      const ordersWithItems = orders as unknown as OrderWithItems[];
      const { kitchen: activeKitchen, bar: activeBar } = countActiveItemsByStation(ordersWithItems);
      const escalationsCount = escalations.length;
      this.lastKitchenCounts = this.roll(this.lastKitchenCounts, activeKitchen);
      this.lastBarCounts = this.roll(this.lastBarCounts, activeBar);
      this.lastWaiterCounts = this.roll(this.lastWaiterCounts, escalationsCount);
      const level = (count: number): 'ok' | 'warn' | 'critical' =>
        count === 0 ? 'ok' : count <= 5 ? 'warn' : 'critical';
      return [
        {
          id: 'kitchen',
          label: 'Kitchen',
          metric: `${activeKitchen} active`,
          detail: 'Items in progress',
          level: level(activeKitchen),
          sparkData: this.lastKitchenCounts,
        },
        {
          id: 'bar',
          label: 'Bar',
          metric: `${activeBar} active`,
          detail: 'Items in progress',
          level: level(activeBar),
          sparkData: this.lastBarCounts,
        },
        {
          id: 'waiter',
          label: 'Waiters',
          metric: `${escalationsCount} escalations`,
          level: level(escalationsCount),
          sparkData: this.lastWaiterCounts,
        },
      ];
    }),
  );

  ngOnInit(): void {
    this.companyContext.currentCompany$.subscribe((c) => {
      this.appBarTitle = c ? `${c.name} — Command Center` : 'Command Center';
      this.companyName.set(c?.name ?? '');
      this.companyLogo.set(c?.logo ?? null);
      this.appBarActions = [
        { icon: 'notifications', label: 'Escalations', badge: 0, id: 'escalations' },
        { icon: 'logout', label: 'Logout', id: 'logout' },
      ];
      this.cdr.markForCheck();
    });
    this.escalations$.subscribe((list) => {
      const badge = list.length;
      this.appBarActions = [
        { icon: 'notifications', label: 'Escalations', badge, id: 'escalations' },
        { icon: 'logout', label: 'Logout', id: 'logout' },
      ];
      this.cdr.markForCheck();
    });

    const companyId = this.route.snapshot.paramMap.get('companyGuid') ?? '';
    this.ws.connect();
    this.ws.joinCompanyRooms(companyId, ['manager']);

    this.companyData.triggerTablesRefresh();
    this.companyData.triggerOrdersRefresh();

    this.loadInitialEscalations(companyId);
    this.bindWebSocketHandlers();
  }

  private roll(arr: number[], val: number, max = 5): number[] {
    const next = [...arr, val].slice(-max);
    return next.length < max ? Array(max - next.length).fill(val).concat(next) : next;
  }

  onActionClick(action: TopAppBarAction): void {
    if (action.id === 'logout') {
      this.auth.logout();
    }
  }

  timeSince(iso?: string): string {
    if (!iso) return '';
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const h = Math.floor(mins / 60);
    return `${h}h ago`;
  }

  openTablePanel(tableId: string, tableNumber: number): void {
    this.panelTableId.set(tableId);
    this.panelTableNumberSignal.set(tableNumber);
    this.panelItemsTabSignal.set('active');
    this.companyData.escalations$.pipe(take(1)).subscribe((list) => {
      this.panelCalls.set(list.filter((e) => e.tableId === tableId));
      this.cdr.markForCheck();
    });
    this.api.get<unknown[]>(`orders/table/${tableId}`).subscribe({
      next: (orders) => {
        const raw = orders as Array<{
          id: string;
          tableId: string;
          status: string;
          items?: { id: string; menuItem?: { name: string }; quantity: number; status: string }[];
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
          })),
        }));
        this.panelOrders.set(mapped);
        this.cdr.markForCheck();
      },
    });
  }

  setPanelItemsTab(tab: 'active' | 'history'): void {
    this.panelItemsTabSignal.set(tab);
  }

  updateItemStatus(orderId: string, itemId: string, status: string): void {
    this.api.put(`orders/${orderId}/items/${itemId}/status`, { status }).subscribe({
      next: () => {
        this.refreshPanelOrders();
      },
    });
  }

  private refreshPanelOrders(): void {
    const tableId = this.panelTableId();
    if (!tableId) return;
    this.api.get<unknown[]>(`orders/table/${tableId}`).subscribe({
      next: (orders) => {
        const raw = orders as Array<{
          id: string;
          tableId: string;
          status: string;
          items?: { id: string; menuItem?: { name: string }; quantity: number; status: string }[];
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
          })),
        }));
        this.panelOrders.set(mapped);
        this.cdr.markForCheck();
      },
    });
  }

  closePanel(): void {
    this.panelTableId.set(null);
  }

  forceClearFromPanel(): void {
    const tableId = this.panelTableId();
    if (!tableId) return;
    const esc = this.panelCalls()[0];
    if (esc) {
      this.forceClear(esc);
    } else {
      this.api.post(`tables/${tableId}/clear`, {}, { force: true }).subscribe({
        next: () => {
          this.companyData.triggerTablesRefresh();
          this.companyData.triggerOrdersRefresh();
          this.closePanel();
          this.cdr.markForCheck();
        },
      });
    }
  }

  claimEscalation(esc: WaiterCallSummary): void {
    const user = this.auth.currentUserSnapshot;
    const acknowledgedBy = user?.id ?? 'manager';
    this.api.put(`waiter-calls/${esc.id}/acknowledge`, { acknowledgedBy }).subscribe({
      next: () => {
        this.companyData.updateEscalationStatus(esc.id, 'ACKNOWLEDGED');
        this.cdr.markForCheck();
      },
    });
  }

  notifyWaiter(esc: WaiterCallSummary): void {
    this.claimEscalation(esc);
  }

  /**
   * Resolve a manager escalation without clearing the table.
   * This removes the escalation from the manager view and allows the customer
   * help button to become active again via the waiter-call resolve flow.
   */
  resolveEscalation(esc: WaiterCallSummary): void {
    this.api.put(`waiter-calls/${esc.id}/resolve`, {}).subscribe({
      next: () => {
        this.companyData.removeEscalation(esc.id);
        this.cdr.markForCheck();
      },
    });
  }

  forceClear(esc: WaiterCallSummary): void {
    this.api.post(`tables/${esc.tableId}/clear`, {}, { force: true }).subscribe({
      next: () => {
        this.companyData.removeEscalation(esc.id);
        this.companyData.triggerTablesRefresh();
        this.companyData.triggerOrdersRefresh();
        this.closePanel();
        this.cdr.markForCheck();
      },
    });
  }

  private loadInitialEscalations(companyId: string): void {
    this.api.get<Array<{ id: string; tableId: string; customerSessionId: string; callType: string; status: string; createdAt?: string; table?: { number: number } }>>('waiter-calls/pending', { companyId, type: 'MANAGER' }).subscribe({
      next: (calls) => {
        calls.forEach((c) => {
          this.companyData.upsertEscalation({
            id: c.id,
            tableId: c.tableId,
            customerSessionId: c.customerSessionId,
            callType: c.callType,
            status: c.status,
            createdAt: c.createdAt,
            tableNumber: c.table?.number,
          });
        });
        this.cdr.markForCheck();
      },
    });
  }

  private bindWebSocketHandlers(): void {
    this.ws.on<{ call?: WaiterCallSummary & { table?: { number: number } }; tableNumber?: number }>('manager_call_created').subscribe((payload) => {
      this.haptics.longPulse();
      const call = payload.call ?? payload;
      const summary: WaiterCallSummary = {
        id: (call as WaiterCallSummary).id,
        tableId: (call as WaiterCallSummary).tableId,
        customerSessionId: (call as WaiterCallSummary).customerSessionId,
        callType: (call as WaiterCallSummary).callType,
        status: (call as WaiterCallSummary).status,
        createdAt: (call as WaiterCallSummary).createdAt,
        tableNumber: payload.tableNumber ?? (call as { table?: { number: number } }).table?.number,
      };
      this.companyData.upsertEscalation(summary);
      this.cdr.markForCheck();
    });

    this.ws.on<{ callId?: string; id?: string }>('manager_call_acknowledged').subscribe((payload) => {
      const id = payload.callId ?? payload.id;
      if (id) this.companyData.updateEscalationStatus(id, 'ACKNOWLEDGED');
      this.cdr.markForCheck();
    });

    this.ws.on<{ callId?: string; id?: string }>('manager_call_resolved').subscribe((payload) => {
      const id = payload.callId ?? payload.id;
      if (id) this.companyData.removeEscalation(id);
      this.cdr.markForCheck();
    });
  }
}
