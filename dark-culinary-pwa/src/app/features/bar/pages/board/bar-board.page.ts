import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, Subscription, interval } from 'rxjs';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { ApiService } from '../../../../core/services/api.service';
import { CompanyContextService } from '../../../../core/services/company-context.service';

interface BarBoardItem {
  orderId: string;
  tableNumber: number | string;
  itemId: string;
  name: string;
  quantity: number;
  status: string;
  placedAt: Date;
  modifiers?: Array<{ groupName: string; optionName: string; priceAdjustment?: number }>;
  bundleChoices?: Array<{ slotName: string; chosenItemName: string }>;
  notes?: string;
}

@Component({
  selector: 'app-bar-board',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="board">
      <h1 class="dc-title">
        <mat-icon>local_bar</mat-icon>
        Bar
      </h1>

      <div class="columns">
        <section>
          <h2 class="dc-heading">
            <mat-icon>schedule</mat-icon>
            Pending
          </h2>
          <div *ngFor="let item of pending" class="card" [class.sla-breach]="isSlaBreached(item)">
            <div class="header">
              <span>Order #{{ item.orderId | slice:0:8 }} · Table {{ item.tableNumber }}</span>
              <span class="badge">{{ item.quantity }}</span>
            </div>
            <div class="meta">{{ minutesSince(item) }}m</div>
            <div class="item-name">{{ item.name }} × {{ item.quantity }}</div>
            <div *ngIf="item.modifiers?.length" class="item-modifiers">
              <span *ngFor="let mod of item.modifiers" class="modifier-tag" [class.modifier-exclusion]="mod.optionName.startsWith('No ')">{{ mod.optionName }}</span>
            </div>
            <div *ngIf="item.bundleChoices?.length" class="item-bundle-choices">
              <div *ngFor="let choice of item.bundleChoices" class="bundle-choice-line">{{ choice.slotName }}: {{ choice.chosenItemName }}</div>
            </div>
            <div *ngIf="item.notes" class="item-notes">{{ item.notes }}</div>
            <div class="actions">
              <button mat-flat-button color="primary" (click)="updateItemStatus(item, 'PREPARING')">
                <mat-icon>emoji_food_beverage</mat-icon>
                Start pouring
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 class="dc-heading">
            <mat-icon>wine_bar</mat-icon>
            Preparing
          </h2>
          <div *ngFor="let item of preparing" class="card" [class.sla-breach]="isSlaBreached(item)">
            <div class="header">
              <span>Order #{{ item.orderId | slice:0:8 }} · Table {{ item.tableNumber }}</span>
              <span class="badge">{{ item.quantity }}</span>
            </div>
            <div class="meta">{{ minutesSince(item) }}m</div>
            <div class="item-name">{{ item.name }} × {{ item.quantity }}</div>
            <div *ngIf="item.modifiers?.length" class="item-modifiers">
              <span *ngFor="let mod of item.modifiers" class="modifier-tag" [class.modifier-exclusion]="mod.optionName.startsWith('No ')">{{ mod.optionName }}</span>
            </div>
            <div *ngIf="item.bundleChoices?.length" class="item-bundle-choices">
              <div *ngFor="let choice of item.bundleChoices" class="bundle-choice-line">{{ choice.slotName }}: {{ choice.chosenItemName }}</div>
            </div>
            <div *ngIf="item.notes" class="item-notes">{{ item.notes }}</div>
            <div class="actions">
              <button mat-button color="primary" (click)="updateItemStatus(item, 'PENDING')">
                <mat-icon>undo</mat-icon>
                Back to pending
              </button>
              <button mat-flat-button color="primary" (click)="updateItemStatus(item, 'READY')">
                <mat-icon>check_circle</mat-icon>
                Drinks ready
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 class="dc-heading">
            <mat-icon>check_circle</mat-icon>
            Ready
          </h2>
          <div *ngFor="let item of ready" class="card">
            <div class="header">
              <span>Order #{{ item.orderId | slice:0:8 }} · Table {{ item.tableNumber }}</span>
              <span class="badge">{{ item.quantity }}</span>
            </div>
            <div class="meta">{{ minutesSince(item) }}m</div>
            <div class="item-name">{{ item.name }} × {{ item.quantity }}</div>
            <div *ngIf="item.modifiers?.length" class="item-modifiers">
              <span *ngFor="let mod of item.modifiers" class="modifier-tag" [class.modifier-exclusion]="mod.optionName.startsWith('No ')">{{ mod.optionName }}</span>
            </div>
            <div *ngIf="item.bundleChoices?.length" class="item-bundle-choices">
              <div *ngFor="let choice of item.bundleChoices" class="bundle-choice-line">{{ choice.slotName }}: {{ choice.chosenItemName }}</div>
            </div>
            <div *ngIf="item.notes" class="item-notes">{{ item.notes }}</div>
            <div class="actions">
              <button mat-button color="primary" (click)="updateItemStatus(item, 'PREPARING')">
                <mat-icon>undo</mat-icon>
                Back to preparing
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .board {
        padding: var(--space-6);
      }
      .columns {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--space-4);
      }
      section {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }
      .card {
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-subtle);
        background-color: var(--bg-glass);
        backdrop-filter: blur(16px);
        padding: 1rem;
        transition: transform 150ms ease, box-shadow 200ms ease, border-color 200ms ease;
      }
      .card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--accent-border);
      }
      .card.sla-breach {
        animation: dc-pulse-glow 2s ease-in-out infinite;
      }
      .dc-title {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .dc-title mat-icon {
        font-size: 1.5rem;
        width: 1.5rem;
        height: 1.5rem;
      }
      .dc-heading {
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }
      .dc-heading mat-icon {
        font-size: 1.2rem;
        width: 1.2rem;
        height: 1.2rem;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-1);
      }
      .badge {
        background: var(--accent-primary);
        color: var(--text-inverse);
        border-radius: var(--radius-pill);
        min-width: 1.25rem;
        padding: 0 0.35rem;
        font-size: 0.75rem;
        text-align: center;
      }
      .meta {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin-bottom: var(--space-1);
      }
      .item-name {
        margin-bottom: var(--space-2);
        font-weight: 600;
        color: var(--text-primary);
      }
      .actions {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }
      button mat-icon {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
        margin-right: 0.35rem;
        vertical-align: middle;
      }
      .item-modifiers {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-bottom: var(--space-1);
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
        margin-bottom: var(--space-1);
      }
      .bundle-choice-line { margin: 0.15rem 0; }
      .item-notes {
        font-size: 0.85rem;
        font-style: italic;
        color: var(--text-secondary);
        padding: 0.35rem;
        background: var(--bg-elevated);
        border-radius: var(--radius-sm);
        margin-bottom: var(--space-1);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarBoardPage implements OnInit, OnDestroy {
  private readonly ws = inject(WebSocketService);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly subs = new Subscription();
  private activeCompanyId = '';

  private readonly itemsSubject = new BehaviorSubject<BarBoardItem[]>([]);
  private get items(): BarBoardItem[] {
    return this.itemsSubject.value;
  }

  get pending(): BarBoardItem[] {
    return this.items.filter((i) => i.status === 'PENDING');
  }

  get preparing(): BarBoardItem[] {
    return this.items.filter((i) => i.status === 'PREPARING');
  }

  get ready(): BarBoardItem[] {
    return this.items.filter((i) => i.status === 'READY');
  }

  ngOnInit(): void {
    const companyGuid = this.route.snapshot.paramMap.get('companyGuid') ?? '';
    this.ws.connect();
    this.ws.joinCompanyRooms(companyGuid, ['bar']);

    this.subs.add(this.companyContext.companyId$.subscribe((companyId) => {
      if (!companyId) return;
      this.activeCompanyId = companyId;
      // Re-join with resolved context id to avoid route/context mismatch.
      this.ws.joinCompanyRooms(companyId, ['bar']);
      this.loadOrders(companyId);
    }));
    if (companyGuid) {
      this.activeCompanyId = companyGuid;
      this.loadOrders(companyGuid);
    }

    const refreshFromSocket = () => {
      const id = this.activeCompanyId || companyGuid;
      if (id) this.loadOrders(id);
    };
    this.subs.add(this.ws.on<any>('new_order').subscribe(refreshFromSocket));
    this.subs.add(this.ws.on<any>('order_status_changed').subscribe(refreshFromSocket));
    this.subs.add(this.ws.on<any>('order_created_bar').subscribe(refreshFromSocket));
    this.subs.add(this.ws.on<any>('customer_order_created').subscribe(refreshFromSocket));
    this.subs.add(this.ws.on<any>('item_status_updated').subscribe(refreshFromSocket));

    // Fallback refresh loop: keeps board fresh if websocket delivery drops.
    this.subs.add(
      interval(5000).subscribe(() => {
        const id = this.activeCompanyId || companyGuid;
        if (id) this.loadOrders(id);
      }),
    );
  }

  private loadOrders(companyId: string): void {
    if (!companyId) return;
    this.api.get<any[]>('orders', { companyId }).subscribe({
      next: (orders) => {
        const now = Date.now();
        const mapped: BarBoardItem[] = [];
        const beverageCategories = [
          'beverage',
          'beverages',
          'drink',
          'drinks',
          'beer',
          'wine',
          'cocktail',
          'cocktails',
          'spirit',
          'spirits',
          'coffee',
          'tea',
          'juice',
          'soda',
          'mocktail',
          'bar',
        ];

        for (const order of orders ?? []) {
          const orderStatus = (order.status ?? '').toString().toUpperCase();
          const orderIsTerminal = ['SERVED', 'DELIVERED', 'COLLECTED', 'COMPLETED', 'CANCELLED'].includes(orderStatus);
          if (orderIsTerminal) {
            // If the whole order is completed/served/cancelled, do not show any of its items on the bar board
            continue;
          }

          const tableNumber = order.table?.number ?? '';
          for (const item of order.items ?? []) {
            const category = (item.menuItem?.category ?? '').toString().toLowerCase();
            const name = (item.menuItem?.name ?? '').toString().toLowerCase();
            const isBeverage =
              beverageCategories.some((b) => category.includes(b)) ||
              ['wine', 'beer', 'cocktail', 'coffee', 'tea', 'juice', 'soda'].some((k) => name.includes(k));
            if (!isBeverage) continue;

            const status = (item.status ?? order.status ?? '').toString().toUpperCase();
            // As soon as an item is SERVED or COLLECTED, it should disappear from the bar board
            const isTerminal = status === 'SERVED' || status === 'COLLECTED';
            if (isTerminal) continue;

            const created = item.createdAt ?? order.createdAt ?? new Date().toISOString();
            const createdAt = new Date(created);

            if (['PENDING', 'PREPARING', 'READY'].includes(status)) {
              mapped.push({
                orderId: order.id,
                tableNumber,
                itemId: item.id,
                name: item.menuItem?.name ?? 'Item',
                quantity: item.quantity,
                status,
                placedAt: createdAt,
                modifiers: item.modifiers ?? undefined,
                bundleChoices: item.bundleChoices ?? undefined,
                notes: item.specialInstructions ?? item.notes ?? undefined,
              });
            }
          }
        }

        this.itemsSubject.next(mapped);
        this.cdr.markForCheck();
      },
    });
  }

  updateItemStatus(item: BarBoardItem, status: string): void {
    this.api
      .put<any>(`orders/${item.orderId}/items/${item.itemId}/status`, { status })
      .subscribe(() => {
        this.itemsSubject.next(
          this.items.map((i) =>
            i.orderId === item.orderId && i.itemId === item.itemId ? { ...i, status } : i,
          ),
        );
        this.cdr.markForCheck();
      });
  }

  minutesSince(item: BarBoardItem): number {
    return Math.floor((Date.now() - item.placedAt.getTime()) / 60000);
  }

  isSlaBreached(item: BarBoardItem): boolean {
    const mins = this.minutesSince(item);
    return mins > 10 && item.status === 'PENDING';
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}


