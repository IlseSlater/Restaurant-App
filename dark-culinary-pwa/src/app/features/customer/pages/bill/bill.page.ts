import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { CustomerSessionService, SessionWithBill } from '../../services/customer-session.service';
import { CustomerHelpService } from '../../services/customer-help.service';
import { ApiService } from '../../../../core/services/api.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AppCurrencyPipe } from '../../../../core/pipes/app-currency.pipe';
import { take, Subscription, EMPTY } from 'rxjs';

const SERVICE_FEE_OPTIONS = [0, 10, 15, 18, 20];

type BillScope = 'mine' | 'table';

interface BillRow {
  kind: 'header' | 'item';
  orderId: string;
  createdAt?: string | Date;
  name?: string;
  quantity?: number;
  total?: number;
  cancelled?: boolean;
}

@Component({
  selector: 'app-customer-bill',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTabsModule,
    AppCurrencyPipe,
  ],
  template: `
    @if (paymentSuccess()) {
      <div class="celebration">
        <mat-icon class="celeb-icon">celebration</mat-icon>
        <h2>Payment received. Thank you!</h2>
        <button mat-flat-button color="primary" (click)="backToWelcome()">
          Back to welcome
        </button>
      </div>
    } @else {
      <div class="bill">
        <h1 class="dc-title">Your bill</h1>
        <p class="subtitle" *ngIf="session()">
          Table {{ sessionWithBill()?.table?.number ?? '' }} · {{ session()?.customerName }}
        </p>

        @if (sessionWithBill(); as swb) {
          <div class="scope-tabs">
            <button
              type="button"
              class="scope-tab"
              [class.selected]="billScope() === 'table'"
              (click)="setScope('table')"
            >
              <mat-icon>group</mat-icon>
              Table order
              <span class="scope-amount">({{ tableSubtotal() | appCurrency }})</span>
            </button>
            <button
              type="button"
              class="scope-tab"
              [class.selected]="billScope() === 'mine'"
              (click)="setScope('mine')"
            >
              <mat-icon>person</mat-icon>
              Mine
              <span class="scope-amount">({{ mySubtotal() | appCurrency }})</span>
            </button>
          </div>

          <div class="lines">
            @for (row of billRows(); track row.orderId + (row.kind === 'item' ? row.name : '') + (row.kind === 'item' ? row.quantity : '')) {
              @if (row.kind === 'header') {
                <div class="order-header">
                  <span>{{ row.name || 'Order' }} #{{ row.orderId | slice: -8 }}</span>
                  <small *ngIf="row.createdAt">{{ row.createdAt | date: 'shortTime' }}</small>
                </div>
              } @else {
                <div class="line" [class.cancelled]="row.cancelled">
                  <span>{{ row.name }} × {{ row.quantity }}</span>
                  <span>{{ row.total | appCurrency }}</span>
                </div>
              }
            }
          </div>

          <div class="summary">
            <div class="service-fee">
              <span class="label">Service / Tip</span>
              <div class="chips">
                @for (pct of serviceFeeOptions; track pct) {
                  <button
                    type="button"
                    class="chip"
                    [class.selected]="!isCustomTip() && tipPercent() === pct"
                    (click)="setTipPercent(pct)"
                  >
                    {{ pct }}%
                  </button>
                }
                <button
                  type="button"
                  class="chip chip-custom"
                  [class.selected]="isCustomTip()"
                  (click)="setCustomTip()"
                >
                  <mat-icon>edit</mat-icon>
                  
                </button>
              </div>
              @if (isCustomTip()) {
                <div class="custom-tip-input">
                  <mat-form-field appearance="outline" subscriptSizing="dynamic">
                    <mat-label>Tip amount</mat-label>
                    <input
                      matInput
                      type="number"
                      min="0"
                      step="0.01"
                      [ngModel]="customTipAmount()"
                      (ngModelChange)="setCustomTipAmount($event)"
                      placeholder="0.00"
                    />
                  </mat-form-field>
                </div>
              }
            </div>
            <div class="row"><span>Subtotal</span><span>{{ subtotal() | appCurrency }}</span></div>
            <div class="row"><span>Service fee / tip</span><span>{{ serviceFee() | appCurrency }}</span></div>
            <div class="row total"><span>Total</span><span>{{ total() | appCurrency }}</span></div>
          </div>
          <div class="actions">
            <button mat-flat-button color="primary" (click)="pay()" [disabled]="paying() || subtotal() <= 0">
              <mat-icon>credit_card</mat-icon>
              Pay {{ total() | appCurrency }}
            </button>
            <button mat-button (click)="openHelp()">
              <mat-icon>support_agent</mat-icon>
              Call for help
            </button>
          </div>
        } @else {
          <p class="loading-msg">Loading bill…</p>
        }
      </div>
    }
  `,
  styles: [
    `
      .celebration {
        min-height: 60vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        padding: 2rem;
      }
      .celeb-icon {
        font-size: 5rem;
        width: 5rem;
        height: 5rem;
        color: var(--accent-primary);
        animation: dc-celebrate 420ms ease-out, dc-pulse-glow-success 2.4s 420ms infinite;
      }
      .bill { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; max-width: 100%; }
      @media (min-width: 600px) {
        .bill { max-width: 560px; margin: 0 auto; width: 100%; }
        .summary { max-width: 560px; }
      }
      .subtitle { margin: 0; color: var(--text-secondary); font-size: 0.9rem; }
      .scope-tabs {
        display: flex;
        gap: 0.5rem;
        margin: 0.75rem 0;
      }
      .scope-tab {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        min-height: 44px;
        padding: 0.6rem 0.75rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-subtle);
        background: var(--bg-glass);
        color: var(--text-secondary);
        font-size: 0.9rem;
        cursor: pointer;
      }
      .scope-tab.selected {
        background: var(--accent-primary);
        color: var(--text-inverse);
        border-color: var(--accent-primary);
      }
      .scope-tab mat-icon { font-size: 1.2rem; width: 1.2rem; height: 1.2rem; }
      .scope-amount { font-size: 0.85rem; opacity: 0.9; }
      .lines { margin: 1rem 0; }
      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 0.9rem;
        font-weight: 600;
        margin-top: 0.5rem;
      }
      .order-header small {
        font-weight: 400;
        color: var(--text-muted);
      }
      .line {
        display: flex;
        justify-content: space-between;
        padding: 0.35rem 0;
      }
      .line.cancelled {
        text-decoration: line-through;
        opacity: 0.7;
      }
      .summary {
        margin-top: 1rem;
        padding: 1rem;
        background-color: var(--bg-glass);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-subtle);
        backdrop-filter: blur(16px);
      }
      .service-fee { margin-bottom: 0.75rem; }
      .service-fee .label { display: block; font-size: 0.9rem; font-weight: 500; margin-bottom: 0.5rem; color: var(--text-secondary); }
      .chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }
      .chips .chip {
        min-height: 44px;
        min-width: 44px;
        padding: 0.35rem 0.75rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-subtle);
        background: var(--bg-glass);
        color: var(--text-primary);
        font-size: 0.9rem;
        cursor: pointer;
      }
      .chips .chip.selected {
        background: var(--accent-primary);
        color: var(--text-inverse);
        border-color: var(--accent-primary);
      }
      .chips .chip-custom { display: inline-flex; align-items: center; gap: 0.35rem; }
      .chips .chip-custom mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
      .custom-tip-input { margin-top: 0.5rem; max-width: 10rem; }
      .custom-tip-input .mat-mdc-form-field { width: 100%; }
      .row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
      .row.total { font-size: 1.25rem; font-weight: 600; margin-top: 0.5rem; }
      .actions { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1.5rem; }
      .actions button { width: 100%; }
      .loading-msg { color: var(--text-muted); padding: 1rem; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillPage implements OnInit, OnDestroy {
  private readonly sessionService = inject(CustomerSessionService);
  private readonly helpService = inject(CustomerHelpService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly ws = inject(WebSocketService);
  private readonly notifications = inject(NotificationService);
  private sub?: Subscription;

  readonly session = signal(this.sessionService.currentSessionSnapshot);
  readonly sessionWithBill = signal<SessionWithBill | null>(null);
  readonly billScope = signal<BillScope>('table');
  readonly paymentSuccess = signal(false);
  readonly paying = signal(false);
  readonly serviceFeeOptions = SERVICE_FEE_OPTIONS;
  readonly tipPercent = signal(0);
  readonly useCustomTip = signal(false);
  readonly customTipAmount = signal(0);

  readonly myParticipantId = computed(() => {
    const s = this.session();
    if (s?.participantId) return s.participantId;
    const swb = this.sessionWithBill();
    const creator = swb?.participants?.find((p) => p.isCreator);
    return creator?.id ?? swb?.participants?.[0]?.id ?? null;
  });

  /** Effective order status: CANCELLED when all items are cancelled. */
  private getEffectiveOrderStatus(o: { status?: string; items?: { status?: string }[] }): string {
    const status = (o?.status ?? '').toUpperCase();
    const items = o?.items ?? [];
    if (items.length === 0) return status || 'PENDING';
    const allCancelled = items.every((it) => (it.status ?? '').toUpperCase() === 'CANCELLED');
    return allCancelled ? 'CANCELLED' : status || 'PENDING';
  }

  /** Items that count toward the bill (excludes cancelled). */
  private getBillableItems(o: { items?: Array<{ quantity: number; price: number; status?: string; menuItem?: { name: string } }> }): Array<{ quantity: number; price: number; menuItem?: { name: string } }> {
    const items = o?.items ?? [];
    return items.filter((it) => (it.status ?? '').toUpperCase() !== 'CANCELLED');
  }

  private getOrderBillableSubtotal(o: { items?: Array<{ quantity: number; price: number; status?: string }> }): number {
    return this.getBillableItems(o).reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
      0,
    );
  }

  readonly tableSubtotal = computed(() => {
    const swb = this.sessionWithBill();
    if (!swb?.orders?.length) return 0;
    return swb.orders.reduce((sum, o) => {
      if (this.getEffectiveOrderStatus(o) === 'CANCELLED') return sum;
      return sum + this.getOrderBillableSubtotal(o);
    }, 0);
  });

  readonly mySubtotal = computed(() => {
    const pid = this.myParticipantId();
    const swb = this.sessionWithBill();
    if (!pid || !swb?.orders?.length) return 0;
    return swb.orders.reduce((sum, o) => {
      if (o.participantId !== pid) return sum;
      if (this.getEffectiveOrderStatus(o) === 'CANCELLED') return sum;
      return sum + this.getOrderBillableSubtotal(o);
    }, 0);
  });

  readonly subtotal = computed(() => {
    const scope = this.billScope();
    if (scope === 'mine') return this.mySubtotal();
    return this.tableSubtotal();
  });

  readonly serviceFee = computed(() =>
    this.useCustomTip()
      ? this.customTipAmount()
      : (this.subtotal() * this.tipPercent()) / 100,
  );

  readonly total = computed(() => this.subtotal() + this.serviceFee());

  readonly isCustomTip = this.useCustomTip;

  readonly billRows = computed((): BillRow[] => {
    const swb = this.sessionWithBill();
    const scope = this.billScope();
    const myId = this.myParticipantId();
    if (!swb?.orders?.length) return [];

    const scopedOrders =
      scope === 'mine' && myId
        ? swb.orders.filter((o) => o.participantId === myId)
        : swb.orders;

    // Group per participant, aggregate items across their orders
    const groups = new Map<
      string,
      { label: string; createdAt?: string | Date; items: Map<string, { qty: number; total: number }> }
    >();

    for (const o of scopedOrders) {
      if (this.getEffectiveOrderStatus(o) === 'CANCELLED') continue;

      const key = o.participantId ?? 'TABLE';
      const participant = swb.participants?.find((p) => p.id === o.participantId);
      const label =
        participant?.displayName ??
        (o.participantId ? 'Guest' : 'Table');

      if (!groups.has(key)) {
        groups.set(key, {
          label,
          createdAt: (o as { createdAt?: string | Date })?.createdAt,
          items: new Map(),
        });
      }
      const group = groups.get(key)!;

      for (const it of this.getBillableItems(o)) {
        const name = it.menuItem?.name ?? 'Item';
        const lineTotal = it.quantity * (Number(it.price) || 0);
        const existing = group.items.get(name) ?? { qty: 0, total: 0 };
        existing.qty += it.quantity;
        existing.total += lineTotal;
        group.items.set(name, existing);
      }
    }

    const rows: BillRow[] = [];
    // Keep insertion order from Map (roughly order of first appearance)
    for (const [key, group] of groups.entries()) {
      rows.push({
        kind: 'header',
        orderId: key,
        createdAt: group.createdAt,
        name: group.label,
      });
      for (const [name, agg] of group.items.entries()) {
        rows.push({
          kind: 'item',
          orderId: key,
          name,
          quantity: agg.qty,
          total: agg.total,
          cancelled: false,
        });
      }
    }
    return rows;
  });

  ngOnInit(): void {
    this.sessionService.currentSession$.subscribe((s) => this.session.set(s));

    const session = this.sessionService.currentSessionSnapshot;
    if (session?.id) {
      this.sessionService.getSessionWithBill(session.id).subscribe({
        next: (swb) => {
          this.sessionWithBill.set(swb);
          const myId = this.myParticipantId();
          if (!session.participantId && swb.participants?.length) {
            const creator = swb.participants.find((p) => p.isCreator);
            const pid = creator?.id ?? swb.participants[0]?.id;
            if (pid) {
              this.sessionService.mergeSessionParticipant(session.id, pid, swb.participants);
            }
          }
        },
        error: () => this.notifications.error('Could not load bill'),
      });
    }

    this.sub = this.ws.on<{ sessionId?: string }>('session_ended').subscribe((payload) => {
      this.sessionService.clearLocalSession(payload?.sessionId);
      this.paymentSuccess.set(true);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  setScope(scope: BillScope): void {
    this.billScope.set(scope);
  }

  setTipPercent(pct: number): void {
    this.useCustomTip.set(false);
    this.tipPercent.set(pct);
  }

  setCustomTip(): void {
    this.useCustomTip.set(true);
  }

  setCustomTipAmount(value: number | string): void {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    this.customTipAmount.set(Number.isFinite(n) && n >= 0 ? n : 0);
  }

  openHelp(): void {
    const session = this.sessionService.currentSessionSnapshot;
    if (session) {
      this.helpService.openHelpSheet({
        tableId: session.tableId,
        customerSessionId: session.id,
      });
    }
  }

  pay(): void {
    const session = this.sessionService.currentSessionSnapshot;
    const swb = this.sessionWithBill();
    if (!session?.id || !swb) {
      this.notifications.error('No active session.');
      return;
    }

    const payerId = this.myParticipantId();
    const scope = this.billScope();
    const amount = Math.round((this.total()) * 100) / 100;
    if (amount <= 0) {
      this.notifications.error('Nothing to pay.');
      return;
    }

    const participantIds = swb.participants?.map((p) => p.id) ?? [];
    if (participantIds.length === 0) {
      this.notifications.error('Cannot determine participants.');
      return;
    }

    const payForIds = scope === 'mine' && payerId ? [payerId] : participantIds;
    if (!payerId) {
      this.notifications.error('Cannot determine your seat. Please refresh and try again.');
      return;
    }

    this.paying.set(true);
    this.api
      .post<{ payment: { id: string }; providerData?: { formHtml?: string } }>('payments/checkout', {
        payerParticipantId: payerId,
        payForParticipantIds: payForIds,
        amount,
        isFullTable: scope === 'table',
      })
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.paying.set(false);
          const formHtml = res?.providerData?.formHtml;
          if (scope === 'table') {
            this.api
              .post(`customer-sessions/${session.id}/end-with-payment`, {
                paidBy: session.customerName || 'Customer',
              })
              .pipe(take(1))
              .subscribe({
                next: () => {
                  this.sessionService.clearLocalSession(session.id);
                  if (!formHtml) this.paymentSuccess.set(true);
                },
                error: () => {
                  this.sessionService.clearLocalSession(session.id);
                  if (!formHtml) this.paymentSuccess.set(true);
                },
              });
          } else if (!formHtml) {
            this.paymentSuccess.set(true);
          }
          if (typeof formHtml === 'string') {
            document.body.insertAdjacentHTML('beforeend', formHtml);
            (document.querySelector('form[action*="payfast"]') as HTMLFormElement)?.submit();
          }
        },
        error: (err) => {
          this.paying.set(false);
          this.notifications.error(
            err?.error?.message ?? 'Payment failed. Please try again.',
          );
        },
      });
  }

  backToWelcome(): void {
    void this.router.navigate(['/customer/welcome']);
  }
}
