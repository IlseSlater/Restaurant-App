import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { BehaviorSubject, Subscription, combineLatest, map } from 'rxjs';
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
  readyKitchenItems: number;
  readyBarItems: number;
  tableTotal: number;
  occupantNames: string[];
  orderedItemsPreview: string[];
}

interface WaiterCallViewModel {
  id: string;
  tableId: string;
  tableLabel: string;
  callType: string;
  status: string;
  createdAt?: string;
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
  createdAt?: string;
  total?: number;
  customerName?: string;
  participantDisplayName?: string;
  items: TableOrderDetailItem[];
}

interface TableSessionDetail {
  id: string;
  customerName: string;
}

@Component({
  selector: 'app-waiter-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    TopAppBarComponent,
    StatusPipe,
    EmptyStateComponent,
  ],
  template: `
    <app-top-app-bar
      [title]="(appBarTitle$ | async) ?? 'Waiter Dashboard'"
      [brandName]="companyName()"
      [brandLogo]="companyLogo()"
      [showBack]="false"
      [actions]="appBarActions"
      (actionClick)="onActionClick($event)"
    />

    <div class="waiter">
      <section class="intro-card">
        <div class="intro-title-wrap">
          <h2 class="intro-title">Service board</h2>
          <p class="intro-subtitle">
            Work top-to-bottom: respond to calls, collect ready items from kitchen/bar, then check active tables and bills.
          </p>
        </div>
        @if (boardStats$ | async; as stats) {
          <div class="stats-row">
            <div class="stat">
              <span class="value">{{ stats.pendingCalls }}</span>
              <span class="label">Pending calls</span>
            </div>
            <div class="stat">
              <span class="value">{{ stats.readyKitchen + stats.readyBar }}</span>
              <span class="label">Ready items</span>
            </div>
            <div class="stat">
              <span class="value">{{ stats.activeTables }}</span>
              <span class="label">Active tables</span>
            </div>
          </div>
        }
      </section>

      <section class="board-grid">
        <article class="board-column">
          <header class="column-header">
            <div class="column-title">
              <mat-icon>support_agent</mat-icon>
              <span>Table calls</span>
            </div>
            <span class="count-pill">{{ (waiterCalls$ | async)?.length ?? 0 }}</span>
          </header>

          <div class="column-content">
            @for (call of (waiterCalls$ | async); track call.id) {
              <div class="task-card call-task">
                <div class="task-top">
                  <div>
                    <div class="task-title">{{ call.tableLabel }}</div>
                    <div class="task-subtitle">{{ getCallInstruction(call.callType) }}</div>
                  </div>
                  <mat-chip class="status-chip">{{ call.status | statusLabel }}</mat-chip>
                </div>
                <div class="task-actions">
                  <button mat-button (click)="openTableFromCall(call); $event.stopPropagation()">Open table</button>
                  <button mat-button (click)="acknowledgeCall(call.id); $event.stopPropagation()">Acknowledge</button>
                  <button mat-button (click)="resolveCall(call.id); $event.stopPropagation()">Resolve</button>
                </div>
              </div>
            }
            @if ((waiterCalls$ | async)?.length === 0) {
              <app-empty-state
                icon="support_agent"
                title="No pending calls"
                description="Guest calls will show here with suggested actions."
              />
            }
          </div>
        </article>

        <article class="board-column">
          <header class="column-header">
            <div class="column-title">
              <mat-icon>notifications_active</mat-icon>
              <span>Ready from kitchen & bar</span>
            </div>
            <span class="count-pill">{{ (readyToServeTablesVm$ | async)?.length ?? 0 }}</span>
          </header>

          <div class="column-content">
            @for (table of (readyToServeTablesVm$ | async); track table.id) {
              <div class="task-card ready-task" (click)="openTableDetails(table.id, table.number)">
                <div class="task-top">
                  <div>
                    <div class="task-title">Table {{ table.number }}</div>
                    <div class="task-subtitle">Collect and serve ready items</div>
                  </div>
                  <span class="order-badge">{{ table.orderCount }}</span>
                </div>
                <div class="ready-lanes">
                  <div class="lane kitchen">
                    <span>Kitchen ready</span>
                    <strong>{{ table.readyKitchenItems }}</strong>
                  </div>
                  <div class="lane bar">
                    <span>Bar ready</span>
                    <strong>{{ table.readyBarItems }}</strong>
                  </div>
                </div>
              </div>
            }
            @if ((readyToServeTablesVm$ | async)?.length === 0) {
              <app-empty-state
                icon="notifications_active"
                title="Nothing ready right now"
                description="When kitchen or bar marks items ready, they appear here."
              />
            }
          </div>
        </article>

        <article class="board-column">
          <header class="column-header">
            <div class="column-title">
              <mat-icon>table_restaurant</mat-icon>
              <span>Active tables</span>
            </div>
            <span class="count-pill">{{ (activeTablesVm$ | async)?.length ?? 0 }}</span>
          </header>

          <div class="column-content">
            @for (table of (activeTablesVm$ | async); track table.id) {
              <div class="table-card task-card" [class.pulse]="table.isPulsing" (click)="openTableDetails(table.id, table.number)">
                <div class="task-top">
                  <div>
                    <div class="task-title">Table {{ table.number }}</div>
                    <div class="task-subtitle">Status: {{ table.status | statusLabel }}</div>
                  </div>
                  <span class="chips">
                    @if (table.hasCall) {
                      <mat-chip-set>
                        <mat-chip class="call-chip">Call</mat-chip>
                      </mat-chip-set>
                    }
                    <span class="order-badge">{{ table.orderCount }}</span>
                  </span>
                </div>

                <div class="meta-row">
                  <span>Table bill</span>
                  <strong>{{ table.tableTotal | currency:'ZAR':'symbol':'1.0-2' }}</strong>
                </div>

                @if (table.occupantNames.length > 0) {
                  <div class="line-list">
                    <small class="line-title">Seated guests</small>
                    <div class="chip-list">
                      @for (name of table.occupantNames; track name) {
                        <span class="name-chip">{{ name }}</span>
                      }
                    </div>
                  </div>
                }

                @if (table.orderedItemsPreview.length > 0) {
                  <div class="line-list">
                    <small class="line-title">Recent orders</small>
                    <small class="line-values">{{ table.orderedItemsPreview.join(' • ') }}</small>
                  </div>
                }

                @if (table.idleMinutes !== null) {
                  <small class="idle dc-caption">Idle {{ table.idleMinutes }}m</small>
                }
              </div>
            }
            @if ((activeTablesVm$ | async)?.length === 0) {
              <app-empty-state
                icon="table_restaurant"
                title="No active tables"
                description="Tables with guest sessions, orders, or calls will appear here."
              />
            }
          </div>
        </article>
      </section>
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
        <div class="drawer-summary">
          <div class="summary-card">
            <div class="summary-label">Table bill total</div>
            <div class="summary-value">{{ drawerTableTotal() | currency:'ZAR':'symbol':'1.0-2' }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Guests seated</div>
            <div class="summary-value">{{ drawerSeatedGuests().length }}</div>
          </div>
        </div>
        @if (drawerSeatedGuests().length > 0) {
          <div class="drawer-guests">
            <h3>Guests</h3>
            <div class="chip-list">
              @for (guest of drawerSeatedGuests(); track guest.id) {
                <span class="name-chip">{{ guest.customerName }}</span>
              }
            </div>
          </div>
        }
        @if (drawerBillsByGuest().length > 0) {
          <div class="drawer-bills">
            <h3>Customer bills</h3>
            @for (bill of drawerBillsByGuest(); track bill.name) {
              <div class="bill-row">
                <span>{{ bill.name }}</span>
                <strong>{{ bill.total | currency:'ZAR':'symbol':'1.0-2' }}</strong>
              </div>
            }
          </div>
        }
        <div class="drawer-orders">
          <div class="orders-head">
            <h3>Orders</h3>
            <small>Track active items and update service status quickly.</small>
          </div>
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
                    @if (item.status.toUpperCase() !== 'SERVED' && item.status.toUpperCase() !== 'DELIVERED') {
                      <div class="item-actions">
                        @if (item.status.toUpperCase() !== 'COLLECTED') {
                          <button
                            mat-button
                            class="status-btn collected"
                            (click)="updateItemStatus(order.id, item.id, 'COLLECTED')"
                          >
                            Collected
                          </button>
                        }
                        <button
                          mat-button
                          class="status-btn served"
                          (click)="updateItemStatus(order.id, item.id, 'SERVED')"
                        >
                          Served
                        </button>
                      </div>
                    }
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
                    @if (item.status.toUpperCase() !== 'SERVED' && item.status.toUpperCase() !== 'DELIVERED') {
                      <div class="item-actions">
                        @if (item.status.toUpperCase() !== 'COLLECTED') {
                          <button
                            mat-button
                            class="status-btn collected"
                            (click)="updateItemStatus(order.id, item.id, 'COLLECTED')"
                          >
                            Collected
                          </button>
                        }
                        <button
                          mat-button
                          class="status-btn served"
                          (click)="updateItemStatus(order.id, item.id, 'SERVED')"
                        >
                          Served
                        </button>
                      </div>
                    }
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
      .intro-card {
        border: 1px solid var(--border-subtle);
        background: var(--bg-glass);
        border-radius: var(--radius-xl);
        backdrop-filter: blur(16px);
        padding: 1rem 1.1rem;
        margin-bottom: var(--space-4);
      }
      .intro-title-wrap {
        margin-bottom: var(--space-2);
      }
      .intro-title {
        margin: 0;
        font-size: 1.2rem;
      }
      .intro-subtitle {
        margin: 0.35rem 0 0;
        color: var(--text-secondary);
      }
      .stats-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.65rem;
      }
      .stat {
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        background: var(--bg-elevated);
        padding: 0.6rem 0.7rem;
        display: flex;
        flex-direction: column;
      }
      .stat .value {
        font-size: 1.15rem;
        font-weight: 700;
      }
      .stat .label {
        color: var(--text-secondary);
        font-size: 0.8rem;
      }
      .board-grid {
        display: grid;
        gap: var(--space-3);
        grid-template-columns: 1fr;
      }
      @media (min-width: 1100px) {
        .board-grid {
          grid-template-columns: 1fr 1fr 1fr;
          align-items: start;
        }
      }
      .board-column {
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-xl);
        background: var(--bg-glass);
        backdrop-filter: blur(16px);
        min-height: 18rem;
        display: flex;
        flex-direction: column;
      }
      .column-header {
        border-bottom: 1px solid var(--border-subtle);
        padding: 0.75rem 0.8rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .column-title {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        font-weight: 600;
      }
      .count-pill {
        min-width: 1.4rem;
        height: 1.4rem;
        border-radius: var(--radius-pill);
        background: var(--accent-primary);
        color: var(--text-inverse);
        font-size: 0.75rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .column-content {
        padding: 0.8rem;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }
      .task-card {
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-subtle);
        background-color: var(--bg-elevated);
        padding: 0.75rem;
      }
      .task-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .task-title {
        font-weight: 600;
      }
      .task-subtitle {
        margin-top: 0.2rem;
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
      .task-actions {
        margin-top: 0.6rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .status-chip {
        background: var(--status-warning-soft);
        color: var(--status-warning);
      }
      .ready-lanes {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        margin-top: 0.6rem;
      }
      .lane {
        border-radius: var(--radius-md);
        padding: 0.45rem 0.5rem;
        display: flex;
        justify-content: space-between;
        font-size: 0.82rem;
      }
      .lane.kitchen {
        background: var(--status-warning-soft);
        color: var(--status-warning);
      }
      .lane.bar {
        background: var(--status-info-soft);
        color: var(--status-info);
      }
      .meta-row {
        margin-top: 0.55rem;
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
      }
      .line-list {
        margin-top: 0.55rem;
      }
      .line-title {
        color: var(--text-muted);
        display: block;
      }
      .line-values {
        color: var(--text-secondary);
      }
      .chip-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-top: 0.35rem;
      }
      .name-chip {
        border-radius: var(--radius-pill);
        background: var(--bg-glass);
        border: 1px solid var(--border-subtle);
        padding: 0.2rem 0.55rem;
        font-size: 0.75rem;
      }
      .table-card {
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
        width: min(560px, 100vw);
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
      .drawer-summary {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.6rem;
        padding: 0.7rem var(--space-4);
      }
      .summary-card {
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        background: var(--bg-elevated);
        padding: 0.55rem 0.65rem;
      }
      .summary-label {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
      .summary-value {
        font-size: 1rem;
        font-weight: 600;
      }
      .drawer-guests,
      .drawer-bills {
        padding: 0.15rem var(--space-4) 0.5rem;
      }
      .drawer-bills .bill-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.4rem 0.15rem;
        border-bottom: 1px dashed var(--border-subtle);
      }
      .drawer-orders {
        flex: 1;
        overflow: auto;
        padding: var(--space-4) var(--space-4) var(--space-5);
      }
      .orders-head small {
        color: var(--text-secondary);
      }
      .drawer-item-tabs {
        display: flex;
        gap: var(--space-2);
        margin: var(--space-2) 0 var(--space-3);
        background: var(--bg-elevated);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-pill);
        padding: 0.2rem;
      }
      .drawer-item-tabs button {
        border-radius: var(--radius-pill);
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
        background-color: color-mix(in srgb, var(--bg-glass) 80%, var(--bg-elevated));
        backdrop-filter: blur(16px);
        padding: 1rem 1rem 0.85rem;
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
        max-width: 16rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
        background-color: rgba(44, 227, 109, 0.18);
        color: #2ce36d;
      }
      .order-status-chip.status-served,
      .order-status-chip.status-delivered {
        background-color: var(--status-success-soft);
        color: var(--status-success);
      }
      .order-item {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.5rem 0.75rem;
        margin-top: 0.65rem;
        padding-top: 0.6rem;
        border-top: 1px dashed var(--border-subtle);
      }
      .order-item-main {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-2);
        min-width: 0;
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
        grid-column: 1 / 2;
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
        grid-column: 1 / 2;
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
      .item-status.status-ready {
        color: #2ce36d;
      }
      .item-status.status-collected {
        color: var(--status-info);
      }
      .item-status.status-served,
      .item-status.status-delivered {
        color: var(--status-success);
      }
      .item-actions {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        grid-column: 2 / 3;
        grid-row: 1 / span 3;
        align-self: center;
      }
      .status-btn {
        border-radius: var(--radius-pill);
        min-height: 34px;
        padding-inline: 0.7rem;
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
      @media (max-width: 760px) {
        .drawer {
          width: 100vw;
        }
        .order-item {
          grid-template-columns: 1fr;
        }
        .item-actions {
          grid-column: 1 / -1;
          grid-row: auto;
          justify-content: flex-start;
          flex-wrap: wrap;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaiterDashboardPage implements OnInit, OnDestroy {
  private readonly companyData = inject(CompanyDataService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly ws = inject(WebSocketService);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly subs = new Subscription();
  private latestTables: WaiterTableViewModel[] = [];

  private readonly waiterCallsSubject = new BehaviorSubject<WaiterCallViewModel[]>([]);
  readonly waiterCalls$ = this.waiterCallsSubject.asObservable();

  private readonly drawerTableId = signal<string | null>(null);
  readonly drawerOpen = computed(() => this.drawerTableId() !== null);
  private readonly drawerTableNumberSignal = signal(0);
  readonly drawerOrders = signal<TableOrderDetail[]>([]);
  readonly drawerSeatedGuests = signal<TableSessionDetail[]>([]);
  readonly drawerTableNumber = this.drawerTableNumberSignal.asReadonly();

  private readonly drawerItemsTabSignal = signal<'active' | 'history'>('active');
  readonly drawerItemsTab = this.drawerItemsTabSignal.asReadonly();
  readonly companyName = signal<string>('');
  readonly companyLogo = signal<string | null>(null);

  // Items in PENDING / PREPARING / READY are considered "active" for the waiter
  private readonly activeItemStatuses = new Set(['PENDING', 'PREPARING', 'READY', 'COLLECTED']);
  // Items in SERVED / DELIVERED / COLLECTED are considered "history"
  private readonly historyItemStatuses = new Set(['SERVED', 'DELIVERED']);

  private normalizeItemStatus(status: unknown): string {
    return String(status ?? '').trim().toUpperCase();
  }

  private deriveDisplayedOrderStatus(items: Array<{ status?: string }>): string {
    const statuses = items
      .map((item) => this.normalizeItemStatus(item.status))
      .filter((status) => status.length > 0);
    if (statuses.length === 0) return 'PENDING';
    if (statuses.every((status) => status === 'DELIVERED')) return 'DELIVERED';
    if (statuses.every((status) => status === 'SERVED' || status === 'DELIVERED')) return 'SERVED';
    if (statuses.some((status) => status === 'READY')) return 'READY';
    if (statuses.some((status) => status === 'PREPARING')) return 'PREPARING';
    if (statuses.some((status) => status === 'PENDING' || status === 'CONFIRMED')) return 'PENDING';
    if (statuses.some((status) => status === 'COLLECTED')) return 'COLLECTED';
    return statuses[0];
  }

  readonly drawerActiveOrders = computed(() => {
    const orders = this.drawerOrders();
    const rank = (status: string): number => {
      const s = (status ?? '').toUpperCase();
      if (s === 'READY') return 0;
      if (s === 'PENDING') return 1;
      if (s === 'PREPARING') return 2;
      if (s === 'COLLECTED') return 3;
      return 4;
    };
    return orders
      .map((o) => {
        const items = o.items
          .filter((i) =>
            this.activeItemStatuses.has((i.status ?? '').toString().toUpperCase()),
          )
          .sort((a, b) => rank(a.status) - rank(b.status));
        return { ...o, items, status: this.deriveDisplayedOrderStatus(items) };
      })
      .filter((o) => o.items.length > 0)
      .sort(
        (a, b) =>
          new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
      );
  });

  readonly drawerHistoryOrders = computed(() => {
    const orders = this.drawerOrders();
    return orders
      .map((o) => {
        const items = o.items.filter((i) =>
          this.historyItemStatuses.has((i.status ?? '').toString().toUpperCase()),
        );
        return { ...o, items, status: this.deriveDisplayedOrderStatus(items) };
      })
      .filter((o) => o.items.length > 0)
      .sort(
        (a, b) =>
          new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
      );
  });

  readonly drawerTableTotal = computed(() =>
    this.drawerOrders().reduce((sum, o) => sum + (Number(o.total ?? 0) || 0), 0),
  );

  readonly drawerBillsByGuest = computed(() => {
    const grouped = new Map<string, number>();
    for (const o of this.drawerOrders()) {
      const name = o.participantDisplayName ?? o.customerName ?? 'Guest';
      grouped.set(name, (grouped.get(name) ?? 0) + (Number(o.total ?? 0) || 0));
    }
    return Array.from(grouped.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
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
        let readyKitchenItems = 0;
        let readyBarItems = 0;
        let tableTotal = 0;
        const occupantSet = new Set<string>();
        const itemSet = new Set<string>();
        if (tableOrders.length) {
          const latest = tableOrders
            .map((o: { updatedAt?: string; createdAt?: string }) => new Date(o.updatedAt ?? o.createdAt ?? Date.now()))
            .sort((a, b) => b.getTime() - a.getTime())[0];
          idleMinutes = Math.floor((Date.now() - latest.getTime()) / 60000);
          isPulsing = idleMinutes >= 15;
          hasReadyItems = tableOrders.some(
            (o) => (o as { items?: { status: string }[] })['items']?.some((i) => i.status === 'READY') ?? false,
          );
          tableTotal = tableOrders.reduce(
            (sum, o) => sum + (Number((o as { total?: number }).total ?? 0) || 0),
            0,
          );
          for (const order of tableOrders as Array<{ participantDisplayName?: string; customerName?: string; items?: Array<{ status?: string; menuItem?: { name?: string; category?: string } }> }>) {
            const occupant = order.participantDisplayName ?? order.customerName;
            if (occupant) occupantSet.add(occupant);
            for (const item of order.items ?? []) {
              if (item.menuItem?.name) itemSet.add(item.menuItem.name);
              if ((item.status ?? '').toUpperCase() === 'READY') {
                if (this.isBarCategory(item.menuItem?.category)) {
                  readyBarItems++;
                } else {
                  readyKitchenItems++;
                }
              }
            }
          }
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
          readyKitchenItems,
          readyBarItems,
          tableTotal,
          occupantNames: Array.from(occupantSet).slice(0, 5),
          orderedItemsPreview: Array.from(itemSet).slice(0, 4),
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

  readonly boardStats$ = combineLatest([this.activeTablesVm$, this.readyToServeTablesVm$, this.waiterCalls$]).pipe(
    map(([activeTables, readyTables, calls]) => ({
      pendingCalls: calls.filter((c) => (c.status ?? '').toUpperCase() !== 'RESOLVED').length,
      readyKitchen: readyTables.reduce((sum, t) => sum + t.readyKitchenItems, 0),
      readyBar: readyTables.reduce((sum, t) => sum + t.readyBarItems, 0),
      activeTables: activeTables.length,
    })),
  );

  ngOnInit(): void {
    const companyGuid = this.route.snapshot.paramMap.get('companyGuid') ?? '';
    this.ws.connect();
    this.ws.joinCompanyRooms(companyGuid, ['waiters']);

    this.companyData.triggerTablesRefresh();
    this.companyData.triggerOrdersRefresh();
    this.subs.add(
      this.companyContext.currentCompany$.subscribe((company) => {
        this.companyName.set(company?.name ?? '');
        this.companyLogo.set(company?.logo ?? null);
      }),
    );

    this.loadPendingCalls(companyGuid);
    this.bindWebSocketHandlers();
    this.subs.add(
      this.tablesVm$.subscribe((tables) => {
        this.latestTables = tables;
      }),
    );
  }

  private loadPendingCalls(companyId: string): void {
    this.api.get<unknown[]>('waiter-calls/pending', { companyId }).subscribe({
      next: (calls) => {
        const mapped: WaiterCallViewModel[] = (calls as Array<{ id: string; tableId?: string; table?: { number: number }; callType?: string; status?: string; createdAt?: string }>).map((c) => ({
          id: c.id,
          tableId: c.tableId ?? '',
          tableLabel: `Table ${c.table?.number ?? ''}`,
          callType: c.callType ?? 'WAITER',
          status: c.status ?? 'PENDING',
          createdAt: c.createdAt,
        }));
        this.waiterCallsSubject.next(mapped);
      },
    });
  }

  private bindWebSocketHandlers(): void {
    this.subs.add(this.ws.on<{ call?: WaiterCallViewModel & { table?: { number: number } }; tableNumber?: number }>('waiter_call_created').subscribe((payload) => {
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
          createdAt: (call as { createdAt?: string }).createdAt,
        },
      ]);
    }));

    this.subs.add(this.ws.on<{ callId?: string; id?: string }>('waiter_call_resolved').subscribe((payload) => {
      const id = payload.callId ?? payload.id;
      this.waiterCallsSubject.next(this.waiterCallsSubject.value.filter((c) => c.id !== id));
    }));

    this.subs.add(this.ws.on<unknown>('order_status_changed').subscribe(() => {
      this.companyData.triggerOrdersRefresh();
      this.refreshDrawerIfOpen();
    }));
    this.subs.add(this.ws.on<unknown>('customer_order_created').subscribe(() => {
      this.companyData.triggerOrdersRefresh();
      this.refreshDrawerIfOpen();
    }));
    this.subs.add(this.ws.on<unknown>('item_status_updated').subscribe(() => {
      this.companyData.triggerOrdersRefresh();
      this.refreshDrawerIfOpen();
    }));
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
          createdAt: (o as { createdAt?: string }).createdAt,
          total: Number((o as { total?: number }).total ?? 0) || 0,
          customerName: (o as { customerName?: string }).customerName,
          participantDisplayName: (o as { participantDisplayName?: string }).participantDisplayName,
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
    this.api.get<unknown[]>(`customer-sessions/table/${tableId}`).subscribe({
      next: (sessions) => {
        const guests = (sessions as Array<{ id: string; customerName?: string }>)
          .map((s) => ({ id: s.id, customerName: s.customerName ?? 'Guest' }));
        this.drawerSeatedGuests.set(guests);
      },
      error: () => this.drawerSeatedGuests.set([]),
    });
  }

  closeDrawer(): void {
    this.drawerTableId.set(null);
    this.drawerSeatedGuests.set([]);
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
            createdAt: (o as { createdAt?: string }).createdAt,
            total: Number((o as { total?: number }).total ?? 0) || 0,
            customerName: (o as { customerName?: string }).customerName,
            participantDisplayName: (o as { participantDisplayName?: string }).participantDisplayName,
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
    this.api.get<unknown[]>(`customer-sessions/table/${tableId}`).subscribe({
      next: (sessions) => {
        const guests = (sessions as Array<{ id: string; customerName?: string }>)
          .map((s) => ({ id: s.id, customerName: s.customerName ?? 'Guest' }));
        this.drawerSeatedGuests.set(guests);
      },
      error: () => this.drawerSeatedGuests.set([]),
    });
  }

  openTableFromCall(call: WaiterCallViewModel): void {
    const table = this.latestTables.find((t) => t.id === call.tableId);
    if (table) {
      this.openTableDetails(table.id, table.number);
      return;
    }
    this.notifications.info('Open table from Active Tables if it is not currently listed.');
  }

  getCallInstruction(callType: string): string {
    const type = (callType ?? '').toUpperCase();
    if (type === 'MANAGER') return 'Manager requested at this table';
    if (type === 'PAYMENT') return 'Guest needs bill/payment support';
    if (type === 'HELP') return 'Guest requested assistance';
    return 'Guest called for waiter service';
  }

  private isBarCategory(category?: string): boolean {
    const c = (category ?? '').toUpperCase();
    return ['DRINKS', 'BEVERAGES', 'BEER', 'WINE', 'COCKTAILS', 'BAR'].some((x) => c.includes(x));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
