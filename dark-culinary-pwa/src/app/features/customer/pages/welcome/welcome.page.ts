import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatBottomSheet, MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../../core/services/api.service';
import { CustomerSessionService } from '../../services/customer-session.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { StorageService } from '../../../../core/services/storage.service';
import { JoinTableSheetComponent } from '../../components/join-table-sheet/join-table-sheet.component';
import { GlassCardComponent } from '../../../../shared/components/glass-card/glass-card.component';
import { TopAppBarComponent } from '../../../../shared/components/top-app-bar/top-app-bar.component';
import { PressEffectDirective } from '../../../../shared/directives/press-effect.directive';
import { Subscription } from 'rxjs';
import { take } from 'rxjs';

const SESSION_KEY = 'dark_culinary_customer_session';

@Component({
  selector: 'app-about-sheet',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="about-sheet">
      <h2>About</h2>
      <p>Order from your table. No queues. No pressure. Scan the QR code at your table or enter your table number to get started.</p>
      <button mat-flat-button (click)="close()">Close</button>
    </div>
  `,
  styles: [
    `
      .about-sheet { padding: 1.25rem; }
      h2 { margin: 0 0 0.5rem; }
      p { margin: 0 0 1rem; color: var(--text-secondary); }
    `,
  ],
})
export class AboutSheetComponent {
  private readonly ref = inject(MatBottomSheetRef<AboutSheetComponent>);
  close(): void {
    this.ref.dismiss();
  }
}

export interface ContinueTableSheetData {
  companyName: string;
  tableNumber: string;
  companyGuid: string;
}

@Component({
  selector: 'app-continue-table-sheet',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="sheet">
      <p>We detected Table {{ data.tableNumber }} at {{ data.companyName }}.</p>
      <button mat-flat-button color="primary" (click)="confirm()">Confirm table</button>
      <button mat-button (click)="change()">Change table</button>
    </div>
  `,
  styles: [
    `
      .sheet { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
      p { margin: 0; color: var(--text-primary); }
    `,
  ],
})
export class ContinueTableSheetComponent {
  readonly data = inject<ContinueTableSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly ref = inject(MatBottomSheetRef<ContinueTableSheetComponent>);

  confirm(): void {
    this.ref.dismiss(true);
  }
  change(): void {
    this.ref.dismiss(false);
  }
}

@Component({
  selector: 'app-customer-welcome',
  standalone: true,
  imports: [
    GlassCardComponent,
    TopAppBarComponent,
    MatButtonModule,
    MatIconModule,
    PressEffectDirective,
  ],
  template: `
    <div class="welcome">
      <header class="welcome-header">
        <app-top-app-bar
          [title]="appBarTitle()"
          [brandName]="companyName()"
          [brandLogo]="companyLogo()"
          [showBack]="false"
          [glass]="true"
          [actions]="[{ icon: 'info', id: 'about' }]"
          (actionClick)="openAbout($event)"
        />
      </header>
      <div class="welcome-header-spacer" aria-hidden="true"></div>
      <div class="hero">
        <p class="hero-headline dc-title">Order from your table. No queues. No pressure.</p>
      </div>
      @if (activeSession()) {
        <app-glass-card class="active-session-card">
          <div class="active-session">
            <mat-icon>table_restaurant</mat-icon>
            <div class="active-session-text">
              @if (activeSessionTableLabel(); as label) {
                <strong>You're at {{ label }}</strong>
              } @else {
                <strong>You have an active session</strong>
              }
              <span>Continue to your table or leave.</span>
            </div>
            <div class="active-session-actions">
              <button appPressEffect mat-flat-button color="primary" (click)="continueToMenu()">
                Continue to menu
              </button>
              <button appPressEffect mat-button (click)="leaveTableFromWelcome()">
                Leave table
              </button>
            </div>
          </div>
        </app-glass-card>
      }
      <div class="feature-cards">
        <app-glass-card>
          <div class="feature">
            <mat-icon>restaurant_menu</mat-icon>
            <div>
              <strong>Menu</strong>
              <span>Browse and order from our full menu.</span>
            </div>
          </div>
        </app-glass-card>
        <app-glass-card>
          <div class="feature">
            <mat-icon>bolt</mat-icon>
            <div>
              <strong>Speed</strong>
              <span>Your order goes straight to the kitchen.</span>
            </div>
          </div>
        </app-glass-card>
        <app-glass-card>
          <div class="feature">
            <mat-icon>credit_card</mat-icon>
            <div>
              <strong>Payment</strong>
              <span>Pay your bill from your phone.</span>
            </div>
          </div>
        </app-glass-card>
        <app-glass-card>
          <div class="feature">
            <mat-icon>support_agent</mat-icon>
            <div>
              <strong>Service</strong>
              <span>Call for help anytime.</span>
            </div>
          </div>
        </app-glass-card>
      </div>
      <div class="actions-sticky">
        <button appPressEffect mat-flat-button color="primary" class="primary-btn" (click)="goToScan('scan')">
          <mat-icon>qr_code_scanner</mat-icon>
          Scan QR Code
        </button>
        <button appPressEffect mat-button class="ghost-btn" (click)="goToScan('manual')">
          <mat-icon>dialpad</mat-icon>
          Enter Table Number
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .welcome {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: linear-gradient(180deg, var(--bg-canvas) 0%, var(--bg-elevated) 100%);
      }
      .welcome-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        background: var(--bg-canvas);
      }
      .welcome-header-spacer { height: 4rem; flex-shrink: 0; }
      .hero {
        padding: 2rem 1.5rem;
        text-align: center;
      }
      .hero-headline {
        margin: 0;
        color: var(--text-primary);
        animation: dc-fade-in-up 260ms ease-out;
      }
      .feature-cards {
        flex: 1;
        padding: 0 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .feature {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
      }
      .feature mat-icon {
        color: var(--accent-primary);
        font-size: 1.5rem;
        width: 1.5rem;
        height: 1.5rem;
      }
      .feature div {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .feature strong { font-size: 0.95rem; }
      .feature span { font-size: 0.85rem; color: var(--text-secondary); }
      .actions-sticky {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: auto;
      }
      .active-session-card { margin: 0 1.5rem 1rem; }
      .active-session {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .active-session mat-icon {
        color: var(--accent-primary);
        font-size: 2rem;
        width: 2rem;
        height: 2rem;
      }
      .active-session-text {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .active-session-text strong { font-size: 1rem; }
      .active-session-text span { font-size: 0.875rem; color: var(--text-secondary); }
      .active-session-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .active-session-actions button { flex: 1; min-width: 120px; }
      .primary-btn, .ghost-btn {
        width: 100%;
        justify-content: center;
      }
      .ghost-btn {
        border: 1px solid var(--accent-secondary);
        color: var(--accent-secondary);
        transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
      }
      .ghost-btn:hover {
        background-color: var(--accent-primary-soft);
        border-color: var(--accent-secondary);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomePage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly sessionService = inject(CustomerSessionService);
  private readonly notifications = inject(NotificationService);
  private readonly storage = inject(StorageService);
  private sessionSub?: Subscription;

  companyName = signal<string>('');
  companyLogo = signal<string | null>(null);
  appBarTitle = signal<string>('Welcome');
  /** Current session in storage (so we show "previous session" card when they land on welcome). */
  readonly activeSession = signal(this.sessionService.currentSessionSnapshot);
  /** Table label for active session (e.g. "Table 5") from session-with-bill. */
  readonly activeSessionTableLabel = signal<string | null>(null);

  ngOnInit(): void {
    this.sessionSub = this.sessionService.currentSession$.subscribe((s) => {
      this.activeSession.set(s);
      if (s?.id) {
        this.sessionService.getSessionWithBill(s.id).subscribe({
          next: (swb) => {
            const num = swb?.table?.number;
            this.activeSessionTableLabel.set(num != null ? `Table ${num}` : null);
          },
          error: () => this.activeSessionTableLabel.set(null),
        });
      } else {
        this.activeSessionTableLabel.set(null);
      }
    });

    const c = this.route.snapshot.queryParamMap.get('c');
    const t = this.route.snapshot.queryParamMap.get('t');
    if (c && t) {
      this.api.get<{ name?: string; logo?: string | null }>(`companies/${c}`).subscribe({
        next: (company) => {
          this.companyName.set(company?.name ?? 'the restaurant');
          this.companyLogo.set(company?.logo ?? null);
          this.appBarTitle.set(`Welcome to ${company?.name ?? 'the restaurant'}`);
          this.openContinueTableSheet(company?.name ?? 'the restaurant', t);
        },
        error: () => {
          this.openContinueTableSheet('the restaurant', t);
        },
      });
    } else if (c) {
      this.api.get<{ name?: string; logo?: string | null }>(`companies/${c}`).subscribe({
        next: (company) => {
          this.companyName.set(company?.name ?? '');
          this.companyLogo.set(company?.logo ?? null);
          this.appBarTitle.set(company?.name ? `Welcome to ${company.name}` : 'Welcome');
        },
      });
    }
  }

  private proceedToScanStatus(tableId: string, companyGuid: string, tableNumber: string): void {
    const current =
      this.sessionService.currentSessionSnapshot ??
      this.storage.get<{ id?: string; tableId?: string }>(SESSION_KEY);
    if (current?.id && current.tableId && current.tableId !== tableId) {
      void this.router.navigate(['/customer/scan-table'], {
        queryParams: {
          c: companyGuid,
          mode: 'manual',
          moveTableId: tableId,
          moveTableNumber: String(tableNumber),
        },
        queryParamsHandling: '',
      });
      return;
    }

    this.sessionService.getScanStatus(tableId, companyGuid).subscribe({
      next: (status) => {
        if (status.hasActiveSession && status.sessionId) {
          const joinRef = this.bottomSheet.open(JoinTableSheetComponent, {
            data: {
              tableNumber: status.tableNumber ?? tableNumber,
              sessionId: status.sessionId,
              participants: status.participants ?? [],
            },
            panelClass: 'dc-join-table-sheet',
          });
          joinRef.afterDismissed().subscribe((join) => {
            if (join === true) {
              void this.router.navigate(['/customer/register'], {
                queryParams: { c: companyGuid, t: tableNumber, tableId, sid: status.sessionId },
                queryParamsHandling: '',
              });
            } else {
              void this.router.navigate(['/customer/scan-table']);
            }
          });
        } else {
          const current =
            this.sessionService.currentSessionSnapshot ??
            this.storage.get<{ id?: string; tableId?: string }>(SESSION_KEY);
          const parsedTableNumber = Number(status.tableNumber ?? tableNumber);
          const targetTableLabel = Number.isFinite(parsedTableNumber) ? parsedTableNumber : tableNumber;
          if (current?.id) {
            void this.router.navigate(['/customer/scan-table'], {
              queryParams: {
                c: companyGuid,
                mode: 'manual',
                moveTableId: tableId,
                moveTableNumber: String(targetTableLabel),
              },
              queryParamsHandling: '',
            });
            return;
          }
          void this.router.navigate(['/customer/register'], {
            queryParams: { c: companyGuid, t: tableNumber, tableId },
            queryParamsHandling: '',
          });
        }
      },
      error: () => {
        void this.router.navigate(['/customer/register'], {
          queryParams: { c: companyGuid, t: tableNumber, tableId },
          queryParamsHandling: '',
        });
      },
    });
  }

  private openContinueTableSheet(companyName: string, tableNumber: string): void {
    const companyGuid = this.route.snapshot.queryParamMap.get('c');
    const tableIdFromQuery = this.route.snapshot.queryParamMap.get('tableId');
    const ref = this.bottomSheet.open(ContinueTableSheetComponent, {
      data: { companyName, tableNumber, companyGuid: companyGuid ?? '' },
      panelClass: 'dc-continue-table-sheet',
    });
    ref.afterDismissed().subscribe((result) => {
      if (result === true && companyGuid) {
        if (tableIdFromQuery) {
          const session = this.sessionService.currentSessionSnapshot;
          if (session?.tableId === tableIdFromQuery) {
            this.sessionService.checkCanLeave(session).pipe(take(1)).subscribe({
              next: (leaveResult) => {
                if (!leaveResult.allowed) {
                  this.notifications.warn(
                    'You already have an active session at this table. Please pay your bill first.',
                  );
                  void this.router.navigate(['/customer/bill']);
                  return;
                }
                this.proceedToScanStatus(tableIdFromQuery, companyGuid, tableNumber);
              },
              error: () => this.proceedToScanStatus(tableIdFromQuery, companyGuid, tableNumber),
            });
            return;
          }
          this.proceedToScanStatus(tableIdFromQuery, companyGuid, tableNumber);
          return;
        }

        this.api.get<{ id: string; number: number }[]>(`tables`, { companyId: companyGuid }).subscribe({
          next: (tables) => {
            const list = Array.isArray(tables) ? tables : [];
            const table = list.find(
              (tb) => String(tb.number) === tableNumber || tb.id === tableNumber
            );
            const tableId = table?.id;
            if (!tableId) {
              void this.router.navigate(['/customer/register'], {
                queryParams: { c: companyGuid, t: tableNumber },
                queryParamsHandling: '',
              });
              return;
            }
            const session = this.sessionService.currentSessionSnapshot;
            if (session?.tableId === tableId) {
              this.sessionService.checkCanLeave(session).pipe(take(1)).subscribe({
                next: (result) => {
                  if (!result.allowed) {
                    this.notifications.warn(
                      'You already have an active session at this table. Please pay your bill first.',
                    );
                    void this.router.navigate(['/customer/bill']);
                    return;
                  }
                  this.proceedToScanStatus(tableId, companyGuid, tableNumber);
                },
                error: () => this.proceedToScanStatus(tableId, companyGuid, tableNumber),
              });
              return;
            }
            this.proceedToScanStatus(tableId, companyGuid, tableNumber);
          },
          error: () => {
            void this.router.navigate(['/customer/register'], {
              queryParams: { c: companyGuid, t: tableNumber },
              queryParamsHandling: '',
            });
          },
        });
      } else if (result === false) {
        void this.router.navigate(['/customer/scan-table']);
      }
    });
  }

  openAbout(action: { icon: string; id?: string }): void {
    if (action.id === 'about') {
      this.bottomSheet.open(AboutSheetComponent, { panelClass: 'dc-about-sheet' });
    }
  }

  goToScan(mode: 'scan' | 'manual'): void {
    void this.router.navigate(['/customer/scan-table'], {
      queryParams: { mode },
    });
  }

  continueToMenu(): void {
    void this.router.navigate(['/customer/menu']);
  }

  leaveTableFromWelcome(): void {
    const session = this.sessionService.currentSessionSnapshot;
    if (!session?.id) return;
    this.sessionService.checkCanLeave(session).subscribe({
      next: (result) => {
        if (result.allowed) {
          this.sessionService.clearLocalSession(session.id);
          this.activeSession.set(null);
          this.activeSessionTableLabel.set(null);
        } else {
          const goToBill = window.confirm(
            'You still have an outstanding bill. Press OK to pay now, or Cancel to leave and scan a new table.',
          );
          if (goToBill) {
            void this.router.navigate(['/customer/bill']);
            return;
          }
          this.sessionService.clearLocalSession(session.id);
          this.activeSession.set(null);
          this.activeSessionTableLabel.set(null);
          void this.router.navigate(['/customer/scan-table'], { queryParams: { mode: 'scan' } });
        }
      },
      error: (err: unknown) => {
        const status = err instanceof HttpErrorResponse ? err.status : undefined;
        if (status === 404) {
          this.sessionService.clearLocalSession(session.id);
          this.activeSession.set(null);
          this.activeSessionTableLabel.set(null);
          this.notifications.warn('Your session has expired. Please scan the table QR again.');
          return;
        }
        this.notifications.error('Could not check bill status. Try again.');
      },
    });
  }

  ngOnDestroy(): void {
    this.sessionSub?.unsubscribe();
  }
}
