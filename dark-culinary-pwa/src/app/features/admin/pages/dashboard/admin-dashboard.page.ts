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
import { RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../../core/services/api.service';
import { CompanyContextService } from '../../../../core/services/company-context.service';
import { CompanyDataService } from '../../../../core/services/company-data.service';
import { AuthService } from '../../../../core/services/auth.service';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { StatusChipComponent } from '../../../../shared/components/status-chip/status-chip.component';
import { ThemeEditorComponent } from '../../components/theme-editor/theme-editor.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { APP_CURRENCY_CODE } from '../../../../core/constants/app-currency';

interface RealtimeData {
  activeOrders: number;
  completedToday: number;
  revenueToday: number;
  activeTables?: number;
  activeSessions?: number;
}

interface OverviewData {
  orderStatusDistribution?: { status: string; count: number; percentage: number }[];
  topSellingItems?: { name: string; quantity: number; revenue: number }[];
}

interface LowStockItem {
  id: string;
  name?: string;
  currentStock?: number;
  minStock?: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatCardComponent,
    StatusChipComponent,
    ThemeEditorComponent,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <div class="dashboard">
      <div class="welcome">
        <h2 class="welcome-title">Welcome back, {{ userName() }}</h2>
        <p class="welcome-date">{{ todayLabel() }}</p>
      </div>

      <section class="kpi-row">
        <app-stat-card
          icon="attach_money"
          iconColor="var(--accent-primary)"
          iconBgColor="var(--accent-primary-soft)"
          label="Revenue today"
          [value]="revenueDisplay()"
        />
        <app-stat-card
          icon="receipt_long"
          iconColor="var(--accent-secondary)"
          iconBgColor="var(--accent-primary-soft)"
          label="Active orders"
          [value]="realtime()?.activeOrders ?? '—'"
        />
        <app-stat-card
          icon="check_circle"
          iconColor="var(--status-success)"
          iconBgColor="var(--status-success-soft)"
          label="Completed today"
          [value]="realtime()?.completedToday ?? '—'"
        />
        <app-stat-card
          icon="table_restaurant"
          iconColor="var(--status-info)"
          iconBgColor="var(--status-info-soft)"
          label="Active tables"
        [value]="realtime()?.activeTables ?? activeTablesCount()"
        />
      </section>

      <section class="middle-row">
        <div class="card chart-card">
          <h3>Top selling items</h3>
          @if (topItems().length > 0) {
            <div class="bar-chart">
              @for (item of topItems(); track item.name) {
                <div class="bar-row">
                  <span class="bar-label">{{ item.name }}</span>
                  <div class="bar-wrap">
                    <div class="bar" [style.width.%]="barWidth(item)"></div>
                  </div>
                  <span class="bar-value">{{ item.quantity }}</span>
                </div>
              }
            </div>
          } @else if (!loading()) {
            <p class="empty">No data yet</p>
          } @else {
            <p class="empty">Loading…</p>
          }
        </div>
        <div class="card status-card">
          <h3>Order status</h3>
          @if (orderStatusList().length > 0) {
            <div class="status-pills">
              @for (s of orderStatusList(); track s.status) {
                <span class="pill" [attr.data-status]="s.status">
                  {{ s.status }}: {{ s.count }}
                </span>
              }
            </div>
          } @else if (!loading()) {
            <p class="empty">No orders</p>
          }
        </div>
      </section>

      <section class="bottom-row">
        <div class="card recent-orders-card">
          <h3>Recent orders</h3>
          <a routerLink="analytics" class="card-link">View analytics</a>
          @if (recentOrders().length > 0) {
            <ul class="order-list">
              @for (order of recentOrders(); track order.id) {
                <li class="order-item">
                  <span class="order-table">Table {{ tableNumber(order.tableId) }}</span>
                  <app-status-chip [status]="order.status">{{ order.status }}</app-status-chip>
                  <span class="order-time">{{ timeAgo(order.createdAt) }}</span>
                </li>
              }
            </ul>
          } @else {
            <p class="empty">No recent orders</p>
          }
        </div>
        <div class="card inventory-card">
          <h3>Inventory alerts</h3>
          <a routerLink="inventory" class="card-link">View inventory</a>
          @if (lowStockItems().length > 0) {
            <ul class="stock-list">
              @for (item of lowStockItems(); track item.id) {
                <li class="stock-item">
                  <mat-icon class="warn-icon">warning</mat-icon>
                  <span>{{ item.name ?? 'Item' }}</span>
                  <span class="stock-count">{{ item.currentStock ?? 0 }} / {{ item.minStock ?? '—' }}</span>
                </li>
              }
            </ul>
          } @else if (lowStockLoaded()) {
            <p class="empty">All stocked</p>
          } @else {
            <p class="empty">Loading…</p>
          }
        </div>
        <div class="card actions-card">
          <h3>Quick actions</h3>
          <div class="quick-actions">
            <a routerLink="menu" class="action-link">
              <mat-icon>restaurant_menu</mat-icon>
              <span>Manage menu</span>
            </a>
            <a routerLink="tables" class="action-link">
              <mat-icon>table_restaurant</mat-icon>
              <span>Manage tables</span>
            </a>
            <a routerLink="staff" class="action-link">
              <mat-icon>people</mat-icon>
              <span>Manage staff</span>
            </a>
            <a routerLink="analytics" class="action-link">
              <mat-icon>analytics</mat-icon>
              <span>View analytics</span>
            </a>
            <a routerLink="inventory" class="action-link">
              <mat-icon>inventory_2</mat-icon>
              <span>View inventory</span>
            </a>
            <button type="button" class="action-link" (click)="openThemeEditor()">
              <mat-icon>palette</mat-icon>
              <span>Theme settings</span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <app-theme-editor [open]="themeEditorOpen()" (openChange)="themeEditorOpen.set($event)" />
  `,
  styles: [
    `
      .dashboard {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .welcome {
        margin-bottom: 0.25rem;
      }

      .welcome-title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .welcome-date {
        margin: 0.25rem 0 0 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .kpi-row {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }

      .middle-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      @media (max-width: 900px) {
        .middle-row {
          grid-template-columns: 1fr;
        }
      }

      .bottom-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }

      @media (max-width: 1024px) {
        .bottom-row {
          grid-template-columns: 1fr;
        }
      }

      .card {
        background: var(--bg-glass);
        border: 1px solid var(--border-subtle);
        border-radius: 16px;
        padding: 1.25rem;
        backdrop-filter: blur(16px);
        position: relative;
      }

      .card h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-secondary);
      }

      .card-link {
        position: absolute;
        top: 1.25rem;
        right: 1.25rem;
        font-size: 0.8125rem;
        color: var(--accent-primary);
        text-decoration: none;
      }

      .card-link:hover {
        text-decoration: underline;
      }

      .bar-chart {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .bar-row {
        display: grid;
        grid-template-columns: 120px 1fr auto;
        align-items: center;
        gap: 0.75rem;
      }

      .bar-wrap {
        height: 20px;
        background: var(--bg-canvas);
        border-radius: 4px;
        overflow: hidden;
      }

      .bar {
        height: 100%;
        background: var(--accent-primary);
        border-radius: 4px;
        min-width: 2px;
        transition: width 0.2s ease;
      }

      .bar-label {
        font-size: 0.875rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .bar-value {
        font-size: 0.875rem;
        font-weight: 600;
      }

      .status-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .pill {
        padding: 0.35rem 0.75rem;
        border-radius: 999px;
        font-size: 0.8125rem;
        background: var(--bg-elevated);
        border: 1px solid var(--border-subtle);
        color: var(--text-secondary);
      }

      .pill[data-status='PENDING'] { border-color: var(--accent-secondary); color: var(--accent-secondary); }
      .pill[data-status='PREPARING'] { border-color: var(--accent-primary); color: var(--accent-primary); }
      .pill[data-status='READY'] { border-color: var(--status-info); color: var(--status-info); }
      .pill[data-status='SERVED'] { border-color: var(--status-success); color: var(--status-success); }

      .order-list, .stock-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .order-item, .stock-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--border-subtle);
        font-size: 0.875rem;
      }

      .order-item:last-child, .stock-item:last-child {
        border-bottom: none;
      }

      .order-table {
        font-weight: 500;
        min-width: 4rem;
      }

      .order-time {
        margin-left: auto;
        color: var(--text-muted);
        font-size: 0.75rem;
      }

      .stock-item .warn-icon {
        color: var(--status-warning);
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .stock-count {
        margin-left: auto;
        color: var(--text-muted);
      }

      .quick-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .action-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0;
        color: var(--text-primary);
        text-decoration: none;
        background: none;
        border: none;
        font: inherit;
        cursor: pointer;
        text-align: left;
      }

      .action-link:hover {
        color: var(--accent-primary);
      }

      .action-link mat-icon {
        color: var(--accent-primary);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .empty {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-muted);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly companyData = inject(CompanyDataService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(true);
  readonly realtime = signal<RealtimeData | null>(null);
  readonly overview = signal<OverviewData | null>(null);
  readonly lowStockItems = signal<LowStockItem[]>([]);
  readonly lowStockLoaded = signal(false);
  readonly themeEditorOpen = signal(false);

  readonly companyId = toSignal(this.companyContext.companyId$, { initialValue: null });
  readonly orders = toSignal(this.companyData.orders$, { initialValue: [] });
  readonly tables = toSignal(this.companyData.tables$, { initialValue: [] });

  readonly userName = computed(() => {
    const u = this.auth.currentUserSnapshot;
    return u?.name || u?.email || 'Admin';
  });

  readonly todayLabel = computed(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  readonly revenueDisplay = computed(() => {
    const r = this.realtime();
    if (r?.revenueToday != null) {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: APP_CURRENCY_CODE }).format(r.revenueToday);
    }
    return '—';
  });

  readonly activeTablesCount = computed(() => this.realtime()?.activeTables ?? 0);

  readonly topItems = computed(() => {
    const o = this.overview()?.topSellingItems;
    if (o?.length) return o;
    return [];
  });

  readonly orderStatusList = computed(() => {
    const o = this.overview()?.orderStatusDistribution;
    if (o?.length) return o;
    return [];
  });

  readonly recentOrders = computed(() => {
    const list = this.orders() ?? [];
    return [...list]
      .sort((a, b) => {
        const ta = a.updatedAt || a.createdAt || '';
        const tb = b.updatedAt || b.createdAt || '';
        return tb.localeCompare(ta);
      })
      .slice(0, 5);
  });

  ngOnInit(): void {
    const openTheme = this.route.snapshot.queryParamMap.get('theme');
    if (openTheme === '1') {
      this.themeEditorOpen.set(true);
    }

    this.companyContext.companyId$.subscribe((companyId) => {
      if (!companyId) return;
      this.loading.set(true);
      this.cdr.markForCheck();

      this.api.get<RealtimeData>('analytics/realtime', { companyId }).subscribe({
        next: (data) => {
          this.realtime.set(data);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading.set(false);
          this.cdr.markForCheck();
        },
      });

      this.api.get<OverviewData>('analytics/overview', { companyId }).subscribe({
        next: (data) => {
          this.overview.set(data);
          this.cdr.markForCheck();
        },
      });

      this.api.get<LowStockItem[]>(`inventory/items/company/${companyId}/low-stock`).subscribe({
        next: (items) => {
          this.lowStockItems.set(Array.isArray(items) ? items : []);
          this.lowStockLoaded.set(true);
          this.cdr.markForCheck();
        },
      });
    });
  }

  barWidth(item: { quantity: number }): number {
    const list = this.topItems();
    const max = Math.max(...list.map((i) => i.quantity), 1);
    return (item.quantity / max) * 100;
  }

  tableNumber(tableId: string): string {
    const t = (this.tables() ?? []).find((x) => x.id === tableId);
    return t ? String(t.number) : tableId.slice(0, 8);
  }

  timeAgo(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    const now = new Date();
    const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (sec < 60) return 'Just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  }

  openThemeEditor(): void {
    this.themeEditorOpen.set(true);
  }
}
