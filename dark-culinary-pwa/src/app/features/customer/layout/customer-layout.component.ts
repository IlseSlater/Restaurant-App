import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { combineLatest, map } from 'rxjs';
import { CustomerCartService } from '../services/customer-cart.service';
import { CustomerSessionService } from '../services/customer-session.service';
import { CustomerHelpService } from '../services/customer-help.service';
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
        <nav class="bottom-nav" aria-label="Customer navigation">
          <a mat-button routerLink="/customer/menu" routerLinkActive="active" aria-label="Menu">
            <mat-icon>restaurant_menu</mat-icon>
            <span>Menu</span>
          </a>
          <a mat-button routerLink="/customer/orders" routerLinkActive="active" aria-label="Orders">
            <mat-icon>receipt_long</mat-icon>
            <span>Orders</span>
          </a>
          <a mat-button routerLink="/customer/bill" routerLinkActive="active" aria-label="Bill">
            <mat-icon>receipt</mat-icon>
            <span>Bill</span>
          </a>
          <button mat-button type="button" (click)="openHelp()" aria-label="Call for help">
            <mat-icon>support_agent</mat-icon>
            <span>Help</span>
          </button>
          <button mat-button type="button" (click)="leaveTable()" aria-label="Leave table">
            <mat-icon>exit_to_app</mat-icon>
            <span>Leave</span>
          </button>
        </nav>
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
        height: 100vh;
        min-height: 100vh;
        background-color: var(--bg-canvas);
        color: var(--text-primary);
        display: flex;
        flex-direction: column;
      }
      .content {
        flex: 1 1 0;
        min-height: 0;
        padding: var(--space-4);
        padding-bottom: 5rem;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      .bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 100;
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 0.5rem 0.75rem;
        background-color: var(--bg-nav);
        border-top: 1px solid var(--border-subtle);
        backdrop-filter: blur(18px);
        box-shadow: var(--shadow-md);
      }
      .bottom-nav a,
      .bottom-nav button {
        color: var(--text-secondary);
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        min-height: 44px;
        font-size: 0.75rem;
        transition: color 200ms ease;
      }
      .bottom-nav a.active,
      .bottom-nav a.router-link-active {
        color: var(--accent-primary);
      }
      .bottom-nav .mat-icon {
        font-size: 1.5rem;
        width: 1.5rem;
        height: 1.5rem;
      }
      .cart-chip-wrap {
        position: fixed;
        bottom: 4.5rem;
        left: 1rem;
        right: 1rem;
        display: flex;
        justify-content: center;
        pointer-events: none;
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
  private readonly helpService = inject(CustomerHelpService);
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

  openHelp(): void {
    const session = this.sessionService.currentSessionSnapshot;
    if (!session) return;
    this.helpService.openHelpSheet({
      tableId: session.tableId,
      customerSessionId: session.id,
    });
  }

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
          // Most common: stale local session after DB reset/reseed.
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
