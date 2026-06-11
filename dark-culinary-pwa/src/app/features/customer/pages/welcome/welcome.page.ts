import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../../core/services/api.service';
import { CustomerSessionService } from '../../services/customer-session.service';
import { CustomerTableArrivalService } from '../../services/customer-table-arrival.service';
import { PressEffectDirective } from '../../../../shared/directives/press-effect.directive';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-customer-welcome',
  standalone: true,
  host: {
    class: 'welcome-host',
  },
  imports: [
    MatButtonModule,
    MatIconModule,
    PressEffectDirective,
  ],
  template: `
    <div class="welcome" [class.welcome--session]="activeSession()" [class.welcome--arriving]="arriving()">
      @if (arriving()) {
        <div class="welcome-loading" aria-live="polite" aria-busy="true">
          <span class="spinner"></span>
          <p>Setting up your table…</p>
        </div>
      }

      <div class="welcome-main">
        <section class="welcome-hero" aria-label="Welcome">
          <div class="welcome-icon-wrap">
            @if (activeSession() && companyLogo()) {
              <img
                [src]="companyLogo()"
                [alt]="companyName() || 'Restaurant logo'"
                class="welcome-icon-img"
              />
            } @else {
              <mat-icon class="welcome-icon" aria-hidden="true">restaurant</mat-icon>
            }
          </div>
          <h1 class="welcome-title">
            @if (activeSession() && companyName()) {
              Welcome to {{ companyName() }}
            } @else {
              Welcome
            }
          </h1>
          <p class="welcome-subtitle">
            @if (activeSession()) {
              Browse the menu, order from your table, and pay when you're ready.
            } @else {
              <span class="subtitle-line">To get started.</span>
              <span class="subtitle-line">Scan the QR code at your table.</span>
            }
          </p>
        </section>
      </div>

      @if (activeSession()) {
        <div class="session-view">
          <div class="session-content">
            <div class="table-badge">
              <mat-icon>table_restaurant</mat-icon>
              @if (activeSessionTableLabel(); as label) {
                <span>You're at <strong>{{ label }}</strong></span>
              } @else {
                <span>You have an active session</span>
              }
            </div>

            <button
              appPressEffect
              mat-flat-button
              color="primary"
              class="continue-btn"
              (click)="continueToMenu()"
            >
              Continue to menu
            </button>
          </div>

          <div class="session-footer">
            <button appPressEffect mat-button class="ghost-btn" (click)="goToScan()">
              <mat-icon>qr_code_scanner</mat-icon>
              Scan a different table
            </button>
          </div>
        </div>
      } @else {
        <div class="guest-view">
          <div class="actions-sticky">
            <button appPressEffect mat-flat-button color="primary" class="primary-btn" (click)="goToScan()">
              <mat-icon>qr_code_scanner</mat-icon>
              Scan QR Code
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host.welcome-host {
        display: block;
        margin: calc(-1 * var(--space-4));
        margin-bottom: -5rem;
        min-height: calc(100% + var(--space-4) + 5rem);
      }
      .welcome {
        --welcome-bottom-nav: 0px;
        position: relative;
        min-height: 100dvh;
        height: 100dvh;
        max-height: 100dvh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: transparent;
      }
      .welcome.welcome--session {
        --welcome-bottom-nav: 4.5rem;
        min-height: calc(100dvh - var(--welcome-bottom-nav));
        height: calc(100dvh - var(--welcome-bottom-nav));
        max-height: calc(100dvh - var(--welcome-bottom-nav));
      }
      .welcome--arriving {
        pointer-events: none;
      }
      .welcome-loading {
        position: fixed;
        inset: 0;
        z-index: var(--z-overlay, 1000);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        background: var(--overlay-bg, rgba(0, 0, 0, 0.55));
        backdrop-filter: blur(8px);
        color: var(--text-primary);
        font-size: 0.95rem;
      }
      .spinner {
        width: 2.5rem;
        height: 2.5rem;
        border: 3px solid var(--border-subtle);
        border-top-color: var(--accent-primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .welcome-main {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem 1.5rem;
      }
      .guest-view,
      .session-view {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
      }
      .session-view {
        padding: 0 1rem 0.75rem;
        padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
      }
      .session-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1rem;
        padding: 0 0 0.5rem;
      }
      .session-footer {
        flex-shrink: 0;
        padding-top: 0.25rem;
      }
      .welcome-hero {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        animation: dc-fade-in-up 280ms ease-out;
      }
      .welcome-icon-wrap {
        width: 88px;
        height: 88px;
        border-radius: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.25rem;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(20px) saturate(1.2);
        -webkit-backdrop-filter: blur(20px) saturate(1.2);
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
      }
      .welcome-icon-img {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        object-fit: cover;
      }
      .welcome-icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
        color: #ec4899;
      }
      .welcome-title {
        margin: 0 0 0.75rem;
        max-width: 20rem;
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 1.25;
        color: var(--text-primary);
      }
      .welcome-subtitle {
        margin: 0;
        max-width: 18rem;
        font-size: 0.95rem;
        font-weight: 400;
        line-height: 1.55;
        color: var(--text-secondary);
      }
      .subtitle-line {
        display: block;
      }
      .table-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 1rem;
        border-radius: 999px;
        background: var(--accent-primary-soft);
        color: var(--text-primary);
        font-size: 0.95rem;
      }
      .table-badge mat-icon {
        color: var(--accent-primary);
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
      }
      .table-badge strong {
        font-weight: 600;
      }
      .guest-view {
        padding: 0 1rem max(0.75rem, env(safe-area-inset-bottom));
      }
      .actions-sticky {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      @media (max-height: 740px), (max-width: 480px) {
        .welcome-main {
          padding: 0.75rem 1rem;
        }
        .welcome-icon-wrap {
          width: 76px;
          height: 76px;
          border-radius: 20px;
          margin-bottom: 1rem;
        }
        .welcome-icon-img {
          width: 44px;
          height: 44px;
        }
        .welcome-icon {
          font-size: 2rem;
          width: 2rem;
          height: 2rem;
        }
        .welcome-title {
          font-size: 1.3rem;
        }
        .welcome-subtitle {
          font-size: 0.875rem;
        }
        .session-content {
          gap: 0.75rem;
        }
      }
      .continue-btn {
        width: auto;
        min-width: 11rem;
        max-width: 14rem;
        align-self: center;
        justify-content: center;
      }
      .guest-view .primary-btn,
      .ghost-btn {
        width: 100%;
        justify-content: center;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomePage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly sessionService = inject(CustomerSessionService);
  private readonly tableArrival = inject(CustomerTableArrivalService);
  private sessionSub?: Subscription;
  private tableArrivalSub?: Subscription;

  companyName = signal<string>('');
  companyLogo = signal<string | null>(null);
  readonly activeSession = signal(this.sessionService.currentSessionSnapshot);
  readonly activeSessionTableLabel = signal<string | null>(null);
  readonly arriving = signal(false);

  ngOnInit(): void {
    this.sessionSub = this.sessionService.currentSession$.subscribe((s) => {
      this.activeSession.set(s);
      if (s?.id) {
        if (s.companyId) {
          this.loadCompanyBranding(s.companyId);
        }
        this.sessionService.getSessionWithBill(s.id).subscribe({
          next: (swb) => {
            const num = swb?.table?.number;
            this.activeSessionTableLabel.set(num != null ? `Table ${num}` : null);
          },
          error: () => this.activeSessionTableLabel.set(null),
        });
      } else {
        this.activeSessionTableLabel.set(null);
        const companyFromUrl = this.route.snapshot.queryParamMap.get('c');
        if (companyFromUrl) {
          this.loadCompanyBranding(companyFromUrl);
        } else {
          this.companyName.set('');
          this.companyLogo.set(null);
        }
      }
    });

    this.tableArrivalSub = this.route.queryParamMap.subscribe((params) => {
      const c = params.get('c');
      const t = params.get('t');

      if (c && t) {
        if (this.sessionService.consumeSkipTableArrival()) {
          this.stripTableQueryParams();
          return;
        }
        this.runTableArrival(c, t, params.get('tableId'));
      } else if (c) {
        this.loadCompanyBranding(c);
      }
    });
  }

  private runTableArrival(companyGuid: string, tableNumber: string, tableId: string | null): void {
    this.arriving.set(true);
    this.stripTableQueryParams();

    this.tableArrival
      .handleTableQrArrival({ companyGuid, tableNumber, tableId })
      .subscribe({
        complete: () => this.arriving.set(false),
        error: () => this.arriving.set(false),
      });
  }

  private loadCompanyBranding(companyId: string): void {
    this.api.get<{ name?: string; logo?: string | null }>(`companies/${companyId}`).subscribe({
      next: (company) => {
        this.companyName.set(company?.name ?? '');
        this.companyLogo.set(company?.logo ?? null);
      },
      error: () => {
        this.companyName.set('');
        this.companyLogo.set(null);
      },
    });
  }

  private stripTableQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { t: null, tableId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  goToScan(): void {
    const companyId =
      this.route.snapshot.queryParamMap.get('c') ??
      this.sessionService.currentSessionSnapshot?.companyId ??
      null;
    void this.router.navigate(['/customer/scan-table'], {
      queryParams: companyId ? { c: companyId } : {},
    });
  }

  continueToMenu(): void {
    void this.router.navigate(['/customer/menu']);
  }

  ngOnDestroy(): void {
    this.sessionSub?.unsubscribe();
    this.tableArrivalSub?.unsubscribe();
  }
}
