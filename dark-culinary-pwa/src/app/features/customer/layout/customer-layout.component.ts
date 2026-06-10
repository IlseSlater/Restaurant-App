import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { combineLatest, map } from 'rxjs';
import { CustomerCartService } from '../services/customer-cart.service';
import { CustomerSessionService } from '../services/customer-session.service';
import { CustomerProfileService } from '../services/customer-profile.service';
import { CustomerEscalationService } from '../services/customer-escalation.service';
import { FloatingCartChipComponent } from '../../../shared/components/floating-cart-chip/floating-cart-chip.component';
import { SocialActivityFeedComponent } from '../components/social-activity-feed/social-activity-feed.component';
import { CartWatcherService } from '../services/cart-watcher.service';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
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
        <div class="aura-dock-wrap">
          <div class="aura-dock">
            <div class="aura-dock__glass" aria-hidden="true">
              <div class="aura-dock__bar"></div>
              <div class="aura-dock__cradle"></div>
            </div>

            <nav class="aura-dock__nav" aria-label="Customer navigation">
              <a
                class="aura-dock__item"
                routerLink="/customer/profile"
                routerLinkActive="is-active"
                aria-label="Profile"
              >
                <span class="aura-dock__icon-wrap">
                  @if (profileInitial$ | async; as initial) {
                    <span class="aura-dock__avatar">{{ initial }}</span>
                  } @else {
                    <mat-icon class="aura-dock__icon aura-dock__icon--outlined" fontSet="material-icons-outlined">person</mat-icon>
                  }
                </span>
                <span class="aura-dock__label">Profile</span>
              </a>

              <a
                class="aura-dock__item"
                routerLink="/customer/orders"
                routerLinkActive="is-active"
                aria-label="Orders"
              >
                <span class="aura-dock__icon-wrap">
                  <mat-icon class="aura-dock__icon aura-dock__icon--filled">receipt_long</mat-icon>
                  <mat-icon class="aura-dock__icon aura-dock__icon--outlined" fontSet="material-icons-outlined">receipt_long</mat-icon>
                </span>
                <span class="aura-dock__label">Orders</span>
              </a>

              <span class="aura-dock__fab-slot" aria-hidden="true"></span>

              <a
                class="aura-dock__item"
                routerLink="/customer/bill"
                routerLinkActive="is-active"
                aria-label="Bill"
              >
                <span class="aura-dock__icon-wrap">
                  <mat-icon class="aura-dock__icon aura-dock__icon--filled">payments</mat-icon>
                  <mat-icon class="aura-dock__icon aura-dock__icon--outlined" fontSet="material-icons-outlined">payments</mat-icon>
                </span>
                <span class="aura-dock__label">Bill</span>
              </a>

              <button
                type="button"
                class="aura-dock__item aura-dock__item--leave"
                (click)="leaveTable()"
                aria-label="Leave table"
              >
                <span class="aura-dock__icon-wrap">
                  <mat-icon class="aura-dock__icon aura-dock__icon--outlined" fontSet="material-icons-outlined">exit_to_app</mat-icon>
                </span>
                <span class="aura-dock__label">Leave</span>
              </button>
            </nav>

            <a
              class="aura-dock__fab"
              routerLink="/customer/menu"
              routerLinkActive="fab-active"
              aria-label="Quick menu"
            >
              <mat-icon>restaurant_menu</mat-icon>
            </a>
          </div>
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
        padding-bottom: calc(6rem + env(safe-area-inset-bottom, 0px));
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      .aura-dock-wrap {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 100;
        padding: 0 1rem max(0.65rem, env(safe-area-inset-bottom));
        pointer-events: none;
      }
      .aura-dock {
        position: relative;
        max-width: 26rem;
        margin: 0 auto;
        height: 4.25rem;
        padding-top: 1.35rem;
        pointer-events: auto;
      }
      .aura-dock__glass {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .aura-dock__bar {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 4.5rem;
        border-radius: 2rem;
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.2) 0%,
          rgba(255, 255, 255, 0.1) 100%
        );
        border: 1px solid rgba(255, 255, 255, 0.32);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.28),
          0 10px 36px rgba(0, 0, 0, 0.42);
        backdrop-filter: blur(32px) saturate(1.5);
        -webkit-backdrop-filter: blur(32px) saturate(1.5);
      }
      .aura-dock__cradle {
        position: absolute;
        left: 50%;
        bottom: 2.35rem;
        transform: translateX(-50%);
        width: 5.75rem;
        height: 2.9rem;
        border-radius: 5.75rem 5.75rem 0 0;
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.22) 0%,
          rgba(255, 255, 255, 0.12) 100%
        );
        border: 1px solid rgba(255, 255, 255, 0.34);
        border-bottom: none;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(32px) saturate(1.5);
        -webkit-backdrop-filter: blur(32px) saturate(1.5);
      }
      .aura-dock__nav {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 4.5rem;
        display: grid;
        grid-template-columns: 1fr 1fr 5.75rem 1fr 1fr;
        align-items: end;
        padding: 0 0.65rem 0.35rem;
        z-index: 4;
      }
      .aura-dock__fab-slot {
        width: 5.75rem;
        justify-self: center;
        pointer-events: none;
      }
      .aura-dock__item {
        position: relative;
        z-index: 4;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        gap: 0.2rem;
        min-width: 0;
        margin: 0 auto;
        padding: 0;
        color: rgba(255, 255, 255, 0.72);
        text-decoration: none;
        border: none;
        background: transparent;
        cursor: pointer;
        transition: transform 120ms ease;
      }
      .aura-dock__item:active {
        transform: scale(0.94);
      }
      .aura-dock__icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 14px;
        transition: background-color 180ms ease, box-shadow 180ms ease;
      }
      .aura-dock__label {
        font-size: 0.62rem;
        font-weight: 500;
        line-height: 1;
        letter-spacing: 0.02em;
        color: rgba(255, 255, 255, 0.62);
        white-space: nowrap;
      }
      .aura-dock__item.is-active .aura-dock__label,
      .aura-dock__item.router-link-active .aura-dock__label {
        color: rgba(255, 255, 255, 0.92);
      }
      .aura-dock__item--leave .aura-dock__icon--outlined {
        display: block;
        color: rgba(255, 255, 255, 0.78);
      }
      .aura-dock__item.is-active .aura-dock__icon-wrap,
      .aura-dock__item.router-link-active .aura-dock__icon-wrap {
        background: rgba(99, 91, 255, 0.55);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.22),
          0 4px 16px rgba(99, 91, 255, 0.35);
      }
      .aura-dock__icon {
        font-size: 1.5rem !important;
        width: 1.5rem !important;
        height: 1.5rem !important;
      }
      .aura-dock__icon--filled {
        display: none;
        color: #fff;
      }
      .aura-dock__icon--outlined {
        display: block;
      }
      .aura-dock__item.is-active .aura-dock__icon--filled,
      .aura-dock__item.router-link-active .aura-dock__icon--filled {
        display: block;
      }
      .aura-dock__item.is-active .aura-dock__icon--outlined,
      .aura-dock__item.router-link-active .aura-dock__icon--outlined {
        display: none;
      }
      .aura-dock__item.is-active .aura-dock__avatar,
      .aura-dock__item.router-link-active .aura-dock__avatar {
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35);
      }
      .aura-dock__avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.88rem;
        font-weight: 700;
        color: #1a1a1a;
        background: linear-gradient(145deg, #fde047 0%, #f59e0b 100%);
      }
      .aura-dock__fab {
        position: absolute;
        left: 50%;
        top: 0;
        transform: translate(-50%, 0);
        z-index: 10;
        width: 4.25rem;
        height: 4.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 2.5px solid rgba(255, 255, 255, 0.28);
        background: var(--gradient-fab);
        color: #fff;
        text-decoration: none;
        cursor: pointer;
        pointer-events: auto;
        box-shadow:
          0 0 32px rgba(168, 85, 247, 0.55),
          0 10px 28px rgba(0, 0, 0, 0.45);
        transition: transform 180ms ease, box-shadow 180ms ease;
      }
      .aura-dock__fab:hover {
        transform: translate(-50%, -2%) scale(1.04);
      }
      .aura-dock__fab:active {
        transform: translate(-50%, 2%) scale(0.96);
      }
      .aura-dock__fab .mat-icon {
        font-size: 1.7rem;
        width: 1.7rem;
        height: 1.7rem;
      }
      .cart-chip-wrap {
        position: fixed;
        bottom: calc(5.75rem + env(safe-area-inset-bottom, 0px));
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
  private readonly profileService = inject(CustomerProfileService);
  private readonly cartService = inject(CustomerCartService);
  private readonly _escalation = inject(CustomerEscalationService);
  private readonly bottomSheet = inject(MatBottomSheet);

  showBottomNav$ = this.sessionService.currentSession$.pipe(
    map((session) => !!session),
  );

  profileInitial$ = combineLatest([
    this.profileService.profile$,
    this.sessionService.currentSession$,
  ]).pipe(
    map(([profile, session]) => {
      const name =
        profile?.customerName?.trim() ||
        session?.customerName?.trim() ||
        '';
      return name ? name.charAt(0).toUpperCase() : null;
    }),
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
    this.clearUiBlockers();

    const session = this.sessionService.currentSessionSnapshot;
    const companyId = session?.companyId;

    this.sessionService.markIntentionalLeave();
    if (session?.id) {
      this.sessionService.clearLocalSession(session.id);
    }
    this.cartService.clear();

    void this.router.navigate(['/customer/welcome'], {
      queryParams: {
        c: companyId ?? null,
        t: null,
        tableId: null,
        sid: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private clearUiBlockers(): void {
    this.bottomSheet.dismiss();
    document.querySelectorAll('.cdk-overlay-backdrop').forEach((el) => el.remove());
  }
}
