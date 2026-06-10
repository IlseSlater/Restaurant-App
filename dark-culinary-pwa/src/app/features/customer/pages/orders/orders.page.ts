import {

  ChangeDetectionStrategy,

  ChangeDetectorRef,

  Component,

  computed,

  inject,

  signal,

  OnInit,

  OnDestroy,

} from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute } from '@angular/router';

import { CustomerOrdersService } from '../../services/customer-orders.service';

import { CustomerSessionService } from '../../services/customer-session.service';

import { PendingOrderService } from '../../services/pending-order.service';

import { WebSocketService } from '../../../../core/services/websocket.service';

import { CustomerOrder } from '../../../../core/models/customer-order.model';

import { StatusPipe } from '../../../../shared/pipes/status.pipe';

import { StatusChipComponent } from '../../../../shared/components/status-chip/status-chip.component';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatTabsModule } from '@angular/material/tabs';

import { Subscription } from 'rxjs';



const TERMINAL_STATUSES = ['SERVED', 'DELIVERED', 'CANCELLED'];

const ORDERS_POLL_MS = 8_000;



@Component({

  selector: 'app-customer-orders',

  standalone: true,

  imports: [

    CommonModule,

    StatusPipe,

    StatusChipComponent,

    MatButtonModule,

    MatIconModule,

    MatTabsModule,

  ],

  template: `

    <div class="orders">

      <h1 class="dc-title">Your orders</h1>

      @if (pendingOrder().hasPendingOrder()) {

        <div class="pending-banner" [class.offline]="!pendingOrder().isOnline()">

          @if (!pendingOrder().isOnline()) {

            Order saved. We'll send it when you're back online.

          } @else {

            Sending your order…

          }

        </div>

      }

      @if (showOrderRecordedMessage()) {

        <div class="pending-banner success">Order recorded. It will be sent when you're back online.</div>

      }

      <div class="tabs">

        <button

          mat-button

          [class.active]="activeTab() === 'active'"

          (click)="setTab('active')"

        >

          <mat-icon>schedule</mat-icon>

          Active

        </button>

        <button

          mat-button

          [class.active]="activeTab() === 'history'"

          (click)="setTab('history')"

        >

          <mat-icon>history</mat-icon>

          History

        </button>

      </div>

      <div class="legend">

        <span class="leg"><mat-icon>schedule</mat-icon> Pending</span>

        <span class="leg"><mat-icon>restaurant</mat-icon> Preparing</span>

        <span class="leg"><mat-icon>notifications_active</mat-icon> Ready</span>

        <span class="leg"><mat-icon>check_circle</mat-icon> Served</span>

      </div>

      @for (order of filteredOrders(); track order.id) {

        <div class="card" [class.ready]="order.status === 'READY'">

          <div class="header">

            <span class="order-num">Order #{{ order.id }}</span>

            <app-status-chip [status]="getEffectiveOrderStatus(order)">

              {{ getEffectiveOrderStatus(order) | statusLabel }}

            </app-status-chip>

          </div>

          @if (order.status === 'READY') {

            <div class="ready-banner">

              <mat-icon>directions_walk</mat-icon>

              Your waiter is collecting your order

            </div>

          }

          <div class="items">

            @for (line of order.items; track line.id) {

              <div class="item">

                <mat-icon class="status-icon">

                  {{ statusIcon(line.status ?? order.status) }}

                </mat-icon>

                <span>{{ line.menuItem?.name ?? 'Item' }} × {{ line.quantity }}</span>

                <app-status-chip [status]="line.status ?? order.status">

                  {{ (line.status ?? order.status) | statusLabel }}

                </app-status-chip>

              </div>

            }

          </div>

          <small class="time">{{ order.createdAt | date: 'shortTime' }}</small>

        </div>

      }

      @if (filteredOrders().length === 0) {

        <p class="empty">

          {{ activeTab() === 'active' ? 'No active orders.' : 'No order history.' }}

        </p>

      }

    </div>

  `,

  styles: [

    `

      .orders { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; max-width: 100%; }

      @media (min-width: 600px) {

        .orders { max-width: 560px; margin: 0 auto; width: 100%; }

      }

      .tabs { display: flex; gap: 0.5rem; }

      .tabs button { min-height: 44px; min-width: 44px; padding: 0 1rem; }

      .tabs button.active { color: var(--accent-primary); }

      .legend {

        display: flex; flex-wrap: wrap; gap: 0.75rem;

        font-size: 0.75rem; color: var(--text-muted);

      }

      .legend mat-icon { font-size: 1rem; width: 1rem; height: 1rem; vertical-align: middle; }

      .card {

        border-radius: 16px;

        border: 1px solid var(--border-subtle);

        background-color: var(--bg-glass);

        backdrop-filter: blur(16px);

        padding: 0.8rem 1rem;

        transition: border-color 200ms ease, box-shadow 200ms ease, transform 150ms ease;

      }

.card.ready {

  border-color: var(--status-info);

  box-shadow: 0 0 0 1px var(--status-info-soft), 0 0 24px var(--status-info-soft);

  animation: dc-pulse-glow-info 2.2s infinite;

}

      .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }

      .order-num { font-weight: 600; }

      .ready-banner {

        display: flex; align-items: center; gap: 0.5rem;

        padding: 0.5rem; background: var(--status-info-soft);

        border-radius: 8px; font-size: 0.9rem; margin-bottom: 0.5rem;

      }

      .items { margin: 0.5rem 0; }

      .item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }

      .status-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; color: var(--text-muted); }

      .time { font-size: 0.8rem; color: var(--text-muted); }

      .empty { color: var(--text-muted); margin-top: 1rem; }

      .pending-banner {

        padding: 0.75rem 1rem;

        border-radius: var(--radius-md);

        font-size: 0.9rem;

        margin-bottom: 0.5rem;

      }

      .pending-banner.offline { background: var(--status-warning-soft); color: var(--text-primary); }

      .pending-banner.success { background: var(--status-success-soft); color: var(--accent-primary); }

    `,

  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

})

export class OrdersPage implements OnInit, OnDestroy {

  private readonly ordersService = inject(CustomerOrdersService);

  private readonly sessionService = inject(CustomerSessionService);

  private readonly pendingOrderService = inject(PendingOrderService);

  private readonly ws = inject(WebSocketService);

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly route = inject(ActivatedRoute);

  private subs = new Subscription();

  private loadRequestSub: Subscription | null = null;

  private pollTimer: ReturnType<typeof setInterval> | null = null;



  readonly pendingOrder = () => this.pendingOrderService;

  readonly showOrderRecordedMessage = signal(false);

  readonly activeTab = signal<'active' | 'history'>('active');

  readonly allOrders = signal<CustomerOrder[]>([]);



  readonly filteredOrders = computed(() => {

    const list = this.allOrders();

    const tab = this.activeTab();

    const notCancelled = list.filter((o) => this.getEffectiveOrderStatus(o) !== 'CANCELLED');

    if (tab === 'active') {

      return notCancelled

        .filter((o) => !TERMINAL_STATUSES.includes(this.getEffectiveOrderStatus(o)))

        .sort((a, b) => this.orderTimestamp(a) - this.orderTimestamp(b));

    }

    return notCancelled

      .filter((o) => TERMINAL_STATUSES.includes(this.getEffectiveOrderStatus(o)))

      .sort((a, b) => this.orderTimestamp(a) - this.orderTimestamp(b));

  });



  getEffectiveOrderStatus(order: { status?: string; items?: { status?: string }[] }): string {

    const status = (order?.status ?? '').toUpperCase();

    const items = order?.items ?? [];

    if (items.length === 0) return status || 'PENDING';

    const allCancelled = items.every((it) => (it.status ?? '').toUpperCase() === 'CANCELLED');

    return allCancelled ? 'CANCELLED' : status || 'PENDING';

  }



  setTab(tab: 'active' | 'history'): void {

    this.activeTab.set(tab);

  }



  statusIcon(status: string): string {

    const s = (status ?? '').toUpperCase();

    if (s === 'PENDING') return 'schedule';

    if (s === 'PREPARING' || s === 'CONFIRMED') return 'restaurant';

    if (s === 'READY') return 'notifications_active';

    return 'check_circle';

  }



  private orderTimestamp(order: unknown): number {

    const createdAt = (order as { createdAt?: unknown })?.createdAt;

    if (createdAt instanceof Date) return createdAt.getTime();

    if (typeof createdAt === 'number') return Number.isFinite(createdAt) ? createdAt : 0;

    if (typeof createdAt === 'string') {

      const t = Date.parse(createdAt);

      return Number.isFinite(t) ? t : 0;

    }

    return 0;

  }



  ngOnInit(): void {

    this.pendingOrderService.trySync();

    this.ensureWsRooms();

    this.loadOrders();



    this.subs.add(this.ordersService.orderUpdates$.subscribe(() => this.loadOrders()));

    this.subs.add(

      this.sessionService.currentSession$.subscribe((session) => {

        if (session?.id) {

          this.ws.connect();

          this.ws.joinRoom(`customer-${session.id}`);

          if (session.tableId) this.ws.joinRoom(`table-${session.tableId}`);

          if (session.companyId) this.ws.joinCompanyRooms(session.companyId, ['customer']);

        }

        this.loadOrders();

      }),

    );

    this.subs.add(this.pendingOrderService.syncDone$.subscribe(() => this.loadOrders()));

    this.subs.add(

      this.route.queryParams.subscribe((params) => {

        if (params['pending'] === '1') {

          this.showOrderRecordedMessage.set(true);

          setTimeout(() => this.showOrderRecordedMessage.set(false), 5000);

        }

      }),

    );



    this.pollTimer = setInterval(() => this.loadOrders(), ORDERS_POLL_MS);

  }



  ngOnDestroy(): void {

    if (this.pollTimer) clearInterval(this.pollTimer);

    this.loadRequestSub?.unsubscribe();

    this.subs.unsubscribe();

  }



  private ensureWsRooms(): void {

    const session = this.sessionService.currentSessionSnapshot;

    if (!session) return;

    this.ws.connect();

    this.ws.joinRoom(`customer-${session.id}`);

    if (session.tableId) this.ws.joinRoom(`table-${session.tableId}`);

    if (session.companyId) this.ws.joinCompanyRooms(session.companyId, ['customer']);

  }



  private loadOrders(): void {

    const sessionId = this.sessionService.currentSessionSnapshot?.id;

    if (!sessionId) {

      this.allOrders.set([]);

      this.cdr.markForCheck();

      return;

    }



    this.loadRequestSub?.unsubscribe();

    this.loadRequestSub = this.ordersService.getOrdersBySession(sessionId).subscribe({

      next: (orders) => {

        this.allOrders.set(orders ?? []);

        this.cdr.markForCheck();

      },

    });

  }

}


