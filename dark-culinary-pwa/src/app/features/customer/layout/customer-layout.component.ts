import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { combineLatest, map } from 'rxjs';
import { CustomerCartService } from '../services/customer-cart.service';
import { CustomerSessionService } from '../services/customer-session.service';
import { CustomerEscalationService } from '../services/customer-escalation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FloatingCartChipComponent } from '../../../shared/components/floating-cart-chip/floating-cart-chip.component';
import { SocialActivityFeedComponent } from '../components/social-activity-feed/social-activity-feed.component';
import { CartWatcherService } from '../services/cart-watcher.service';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    AsyncPipe,
    FloatingCartChipComponent,
    SocialActivityFeedComponent,
  ],
  template: `
    <main class="customer-shell">
      <app-social-activity-feed />
      <section class="content">
        <router-outlet />
      </section>

      @if (showBottomNav$ | async) {
        <div class="bottom-nav-dock">
          <nav class="bottom-nav glass-nav" aria-label="Customer navigation">
            <a
              mat-button
              class="nav-item"
              routerLink="/customer/menu"
              routerLinkActive="active"
              aria-label="Menu"
            >
              <mat-icon>restaurant_menu</mat-icon>
              <span>Menu</span>
            </a>
            <a
              mat-button
              class="nav-item"
              routerLink="/customer/orders"
              routerLinkActive="active"
              aria-label="Orders"
            >
              <mat-icon>receipt_long</mat-icon>
              <span>Orders</span>
            </a>

            <span class="nav-fab-slot" aria-hidden="true"></span>

            <a
              mat-button
              class="nav-item"
              routerLink="/customer/bill"
              routerLinkActive="active"
              aria-label="Bill"
            >
              <mat-icon>receipt</mat-icon>
              <span>Bill</span>
            </a>
            <button
              mat-button
              type="button"
              class="nav-item"
              (click)="leaveTable()"
              aria-label="Leave table"
            >
              <mat-icon>exit_to_app</mat-icon>
              <span>Leave</span>
            </button>
          </nav>

          <a
            class="nav-fab"
            routerLink="/customer/menu"
            routerLinkActive="fab-active"
            aria-label="Open menu"
          >
            <mat-icon>restaurant_menu</mat-icon>
          </a>
        </div>
      }

      @if (cartSummary$ | async; as summary) {
        <div class="cart-chip-wrap">
          <app-floating-cart-chip
            [itemCount]="summary.count"
            [total]="summary.total"
            (click)="goToCart()"
          />
        </div>
      }
    </main>
  `,
  styles: [
    `
      .customer-shell {
        height: 100dvh;
        min-height: 100dvh;
        color: var(--text-primary);
        display: flex;
        flex-direction: column;
      }
      .content {
        flex: 1 1 0;
        min-height: 0;
        padding: var(--space-4);
        padding-bottom: calc(var(--nav-dock-height) + var(--nav-fab-size) * 0.5 + 1.5rem);
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      .bottom-nav-dock {
        position: fixed;
        bottom: max(0.75rem, env(safe-area-inset-bottom));
        left: 1rem;
        right: 1rem;
        z-index: 100;
        height: var(--nav-dock-height);
        pointer-events: none;
      }
      .bottom-nav {
        position: absolute;
        inset: 0;
        display: grid;
        grid-template-columns: 1fr 1fr 3.5rem 1fr 1fr;
        align-items: center;
        padding: 0 0.35rem;
        pointer-events: auto;
      }
      .nav-fab-slot {
        width: var(--nav-fab-size);
        justify-self: center;
      }
      .nav-item {
        color: var(--text-secondary);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.15rem;
        min-height: 44px;
        min-width: 0;
        padding: 0.25rem 0.15rem;
        font-size: 0.65rem;
        line-height: 1.1;
        transition: color 200ms ease;
      }
      .nav-item span {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .nav-item.active,
      .nav-item.router-link-active {
        color: var(--text-primary);
      }
      .nav-item .mat-icon {
        font-size: 1.35rem;
        width: 1.35rem;
        height: 1.35rem;
      }
      .nav-fab {
        position: absolute;
        left: 50%;
        top: 0;
        transform: translate(-50%, -35%);
        width: var(--nav-fab-size);
        height: var(--nav-fab-size);
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 50%;
        background: var(--btn-primary);
        color: var(--btn-label-color);
        text-decoration: none;
        box-shadow: 0 0 24px rgba(99, 91, 255, 0.35), var(--shadow-md);
        pointer-events: auto;
        z-index: 2;
        transition: transform 200ms ease, box-shadow 200ms ease;
      }
      .nav-fab:hover {
        transform: translate(-50%, -38%) scale(1.04);
        background: var(--btn-primary-hover);
        box-shadow: 0 0 28px rgba(99, 91, 255, 0.45), var(--shadow-lg);
      }
      .nav-fab:active {
        transform: translate(-50%, -33%) scale(0.96);
      }
      .nav-fab .mat-icon {
        font-size: 1.5rem;
        width: 1.5rem;
        height: 1.5rem;
      }
      .nav-fab.fab-active {
        box-shadow: 0 0 28px rgba(99, 91, 255, 0.45), 0 0 0 3px rgba(255, 255, 255, 0.15);
      }
      .cart-chip-wrap {
        position: fixed;
        bottom: calc(var(--nav-dock-height) + var(--nav-fab-size) * 0.35 + 1rem);
        left: 1rem;
        right: 1rem;
        display: flex;
        justify-content: center;
        pointer-events: none;
        z-index: 99;
      }
      .cart-chip-wrap app-floating-cart-chip {
        pointer-events: auto;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerLayoutComponent {
  private readonly router = inject(Router);

  constructor() {
    inject(CartWatcherService);
  }
  private readonly sessionService = inject(CustomerSessionService);
  private readonly cartService = inject(CustomerCartService);
  /** Injected so escalation service is created when customer is in app and can receive ack events */
  private readonly _escalation = inject(CustomerEscalationService);
  private readonly notifications = inject(NotificationService);

  showBottomNav$ = this.sessionService.currentSession$.pipe(
    map((session) => !!session),
  );

  cartSummary$ = combineLatest([
    this.cartService.items$,
    this.cartService.subtotal$,
  ]).pipe(
    map(([items, total]) =>
      items.length > 0 ? { count: items.length, total } : null,
    ),
  );

  goToCart(): void {
    void this.router.navigate(['/customer/cart']);
  }

  leaveTable(): void {
    const session = this.sessionService.currentSessionSnapshot;
    if (!session?.id) return;

    this.sessionService.checkCanLeave(session).subscribe({
      next: (result) => {
        if (result.allowed) {
          this.sessionService.clearLocalSession(session.id);
          void this.router.navigate(['/customer/scan-table'], { queryParams: { mode: 'scan' } });
        } else {
          const goToBill = window.confirm(
            'You still have an outstanding bill. Press OK to pay now, or Cancel to leave and scan a new table.',
          );
          if (goToBill) {
            void this.router.navigate(['/customer/bill']);
            return;
          }
          this.sessionService.clearLocalSession(session.id);
          void this.router.navigate(['/customer/scan-table'], { queryParams: { mode: 'scan' } });
        }
      },
      error: (err: unknown) => {
        const status = err instanceof HttpErrorResponse ? err.status : undefined;
        if (status === 404) {
          this.sessionService.clearLocalSession(session.id);
          this.notifications.warn('Your session has expired. Please scan the table QR again.');
          void this.router.navigate(['/customer/welcome']);
          return;
        }
        this.notifications.error('Could not check bill status. Try again.');
      },
    });
  }
}
