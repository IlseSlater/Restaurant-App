import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerCartService } from '../../services/customer-cart.service';
import { CustomerSessionService } from '../../services/customer-session.service';
import { PendingOrderService } from '../../services/pending-order.service';
import { CartWatcherService } from '../../services/cart-watcher.service';
import type { ActiveSpecial } from '../../../../core/services/api.service';
import { ApiService } from '../../../../core/services/api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TopAppBarComponent } from '../../../../shared/components/top-app-bar/top-app-bar.component';
import { AppCurrencyPipe } from '../../../../core/pipes/app-currency.pipe';
import type { CartItem } from '../../services/customer-cart.service';

const SERVICE_FEE_OPTIONS = [0, 10, 15, 18, 20];

@Component({
  selector: 'app-customer-cart',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TopAppBarComponent,
    AppCurrencyPipe,
  ],
  template: `
    <div class="cart">
      <header class="cart-header">
        <app-top-app-bar
          title="Your order"
          [showBack]="true"
          [glass]="true"
          (back)="goBack()"
        />
      </header>
      <div class="cart-header-spacer" aria-hidden="true"></div>
      @if ((activeSpecials$ | async)?.length; as count) {
        <div class="specials-banner">
          <span class="specials-label">Specials available</span>
          @for (s of (activeSpecials$ | async); track s.id) {
            <div class="special-card">
              <span class="special-name">{{ s.name }}</span>
              @if (s.message) {
                <span class="special-msg">{{ s.message }}</span>
              }
              <span class="special-price">
                @if (s.bundlePrice != null) {
                  {{ s.bundlePrice | appCurrency }}
                } @else if (s.fixedPrice != null) {
                  {{ s.fixedPrice | appCurrency }}
                } @else if (s.totalCharge != null) {
                  {{ s.totalCharge | appCurrency }}
                } @else if (s.discountPercent != null) {
                  {{ s.discountPercent }}% off
                }
              </span>
              <button mat-stroked-button type="button" (click)="applySpecial(s)" class="apply-btn">
                Apply
              </button>
            </div>
          }
        </div>
      }
      <div class="list">
        @for (item of (items$ | async); track $index) {
          <div class="line" [class.special-line]="item.isSpecial">
            <div class="info">
              @if (item.isSpecial) {
                <span class="special-badge">Special</span>
              }
              <div class="name">{{ item.name }}</div>
              @if (item.selectedModifiers?.length) {
                <small class="modifiers">{{ getModifiersSummary(item) }}</small>
              }
              @if (item.bundleChoices?.length) {
                <small class="bundle-choices">
                  @for (bc of item.bundleChoices; track bc.bundleSlotId) {
                    <span>{{ bc.chosenItemName }}</span>
                  }
                </small>
              }
              @if (item.notes) {
                <small class="notes">{{ item.notes }}</small>
              }
              <span class="cat">{{ item.category ?? '' }}</span>
            </div>
            <div class="qty">
              @if (!item.isSpecial) {
                <button mat-icon-button type="button" (click)="changeQtyAt($index, item.quantity - 1)" aria-label="Decrease quantity">
                  <mat-icon>remove_circle_outline</mat-icon>
                </button>
              }
              <span>{{ item.quantity }}</span>
              @if (!item.isSpecial) {
                <button mat-icon-button type="button" (click)="changeQtyAt($index, item.quantity + 1)" aria-label="Increase quantity">
                  <mat-icon>add_circle_outline</mat-icon>
                </button>
              }
            </div>
            <div class="price">{{ getLineTotal(item) | appCurrency }}</div>
            <button mat-icon-button type="button" (click)="removeAt($index)" aria-label="Remove">
              <mat-icon>delete_outline</mat-icon>
            </button>
          </div>
        }
      </div>
      <div class="summary sticky">
        <div class="row"><span>Subtotal</span><span>{{ subtotal$ | async | appCurrency }}</span></div>
        <div class="row total"><span>Total</span><span>{{ total$ | async | appCurrency }}</span></div>
        <button
          mat-flat-button
          color="primary"
          class="place-btn"
          [disabled]="(items$ | async)?.length === 0 || placing()"
          (click)="placeOrder()"
        >
          @if (placing()) {
            <span class="place-btn-content">
              <mat-spinner diameter="20"></mat-spinner>
              <span>Placing…</span>
            </span>
          } @else {
            <span class="place-btn-content">
              <mat-icon>send</mat-icon>
              <span>Place order</span>
            </span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .cart { padding: 0 0 1.5rem; display: flex; flex-direction: column; gap: 1rem; max-width: 100%; }
      .cart-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        background: var(--bg-canvas);
      }
      .cart-header-spacer { height: 4rem; flex-shrink: 0; }
      .list { padding: 0 1rem; }
      @media (min-width: 600px) {
        .cart { max-width: 560px; margin: 0 auto; width: 100%; }
        .summary { max-width: 560px; margin-left: auto; margin-right: auto; }
      }
      .line {
        display: grid;
        grid-template-columns: 1fr auto auto auto;
        gap: 0.5rem;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--border-subtle);
      }
      .info { min-width: 0; }
      .name { font-weight: 500; }
      .modifiers { font-size: 0.8rem; color: var(--text-secondary); display: block; }
      .bundle-choices { font-size: 0.8rem; color: var(--text-secondary); display: block; }
      .notes { font-size: 0.8rem; color: var(--text-muted); display: block; }
      .cat { font-size: 0.75rem; color: var(--text-muted); }
      .qty { display: inline-flex; align-items: center; gap: 0.25rem; }
      .price { font-weight: 600; }
      .summary {
        padding: 1rem;
        background-color: var(--bg-glass);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-subtle);
        backdrop-filter: blur(16px);
        margin: 0 1rem;
      }
      .summary.sticky { margin-top: auto; }
      .row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
      .row.total { font-size: 1.25rem; font-weight: 600; margin-top: 0.5rem; }
      .place-btn { width: 100%; margin-top: 1rem; }
      .place-btn-content {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      .specials-banner {
        margin: 0 1rem 0.5rem;
        padding: 0.75rem;
        background: var(--status-info-soft);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
      }
      .specials-label { font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 0.5rem; }
      .special-card {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0;
        border-top: 1px solid var(--border-subtle);
      }
      .special-card:first-of-type { border-top: none; }
      .special-name { font-weight: 600; }
      .special-msg { font-size: 0.85rem; color: var(--text-secondary); }
      .special-price { font-weight: 600; color: var(--accent-primary); margin-left: auto; }
      .apply-btn { flex-shrink: 0; }
      .special-badge {
        font-size: 0.7rem;
        padding: 0.15rem 0.4rem;
        background: var(--accent-primary-soft);
        color: var(--accent-primary);
        border-radius: var(--radius-sm);
        margin-right: 0.5rem;
      }
      .line.special-line {
        animation: dc-cart-merge 0.35s ease-out;
      }
      .line.special-line .name { font-weight: 600; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage implements OnInit {
  private readonly cart = inject(CustomerCartService);
  private readonly sessionService = inject(CustomerSessionService);
  private readonly pendingOrder = inject(PendingOrderService);
  private readonly cartWatcher = inject(CartWatcherService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly serviceFeeOptions = SERVICE_FEE_OPTIONS;
  readonly items$ = this.cart.items$;
  readonly subtotal$ = this.cart.subtotal$;
  readonly serviceFee$ = this.cart.serviceFee$;
  readonly serviceFeePercent$ = this.cart.serviceFeePercent$;
  readonly total$ = this.cart.total$;
  readonly activeSpecials$ = this.cartWatcher.activeSpecials$;
  readonly placing = signal(false);

  applySpecial(special: ActiveSpecial): void {
    this.cartWatcher.applySpecial(special);
  }

  ngOnInit(): void {
    this.pendingOrder.trySync();
  }

  goBack(): void {
    void this.router.navigate(['/customer/menu']);
  }

  changeQtyAt(index: number, qty: number): void {
    this.cart.updateQuantityAt(index, qty);
  }

  removeAt(index: number): void {
    this.cart.removeAt(index);
  }

  getModifiersSummary(item: CartItem): string {
    return (item.selectedModifiers ?? []).map((m) => m.optionName).join(', ');
  }

  getLineTotal(item: CartItem): number {
    return (item.configuredPrice ?? item.price) * item.quantity;
  }

  setServiceFee(pct: number): void {
    this.cart.setServiceFeePercent(pct);
  }

  placeOrder(): void {
    if (this.placing()) return;
    const session = this.sessionService.currentSessionSnapshot;
    if (!session) return;

    this.items$.pipe(take(1)).subscribe((items) => {
      if (!items.length) return;
      this.serviceFeePercent$.pipe(take(1)).subscribe((serviceFeePercentage) => {
        const payload: Record<string, unknown> = {
          customerSessionId: session.id,
          tableId: session.tableId,
          ...(session.participantId != null && { participantId: session.participantId }),
          serviceFeePercentage: serviceFeePercentage ?? 0,
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            price: i.configuredPrice ?? i.price,
            specialInstructions: i.notes ?? undefined,
            ...(i.isSpecial && i.specialId && i.specialName
              ? { isSpecial: true, specialId: i.specialId, specialName: i.specialName }
              : {}),
            selectedModifiers: i.selectedModifiers ?? undefined,
            bundleChoices: i.bundleChoices?.map((bc) => ({
              bundleSlotId: bc.bundleSlotId,
              chosenMenuItemId: bc.chosenMenuItemId,
              chosenItemName: bc.chosenItemName,
              modifiers: bc.modifiers,
            })) ?? undefined,
          })),
        };
        if (!this.pendingOrder.isOnline()) {
          this.pendingOrder.setPendingOrder(payload);
          this.cart.clear();
          this.placing.set(false);
          this.notifications.info("Order saved. We'll send it when you're back online.");
          void this.router.navigate(['/customer/orders'], { queryParams: { pending: '1' } });
          return;
        }
        this.placing.set(true);
        this.api.post('customer-orders', payload).subscribe({
          next: () => {
            this.cart.clear();
            this.notifications.success("Order placed! We'll notify you when it's ready.");
            void this.router.navigate(['/customer/orders']);
            this.placing.set(false);
          },
          error: (err) => {
            this.placing.set(false);
            const isOffline =
              (typeof navigator !== 'undefined' && !navigator.onLine) || err?.status === 0;
            if (isOffline) {
              this.pendingOrder.setPendingOrder(payload);
              this.cart.clear();
              this.notifications.info(
                "Order saved. We'll send it when you're back online.",
              );
              void this.router.navigate(['/customer/orders'], { queryParams: { pending: '1' } });
            } else {
              this.notifications.error(
                err?.error?.message ?? 'Failed to place order.',
              );
            }
          },
        });
      });
    });
  }
}
