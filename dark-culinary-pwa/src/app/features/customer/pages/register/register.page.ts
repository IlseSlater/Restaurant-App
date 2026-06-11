import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { Subscription } from 'rxjs';
import { GlassCardComponent } from '../../../../shared/components/glass-card/glass-card.component';
import { PressEffectDirective } from '../../../../shared/directives/press-effect.directive';
import { ApiService } from '../../../../core/services/api.service';
import { CustomerSessionService } from '../../services/customer-session.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CustomerProfileService } from '../../services/customer-profile.service';
import { CustomerTableResolveService } from '../../services/customer-table-resolve.service';
import { DIETARY_OPTIONS } from '../../constants/dietary-options';

@Component({
  selector: 'app-customer-register',
  standalone: true,
  host: {
    class: 'register-host',
  },
  imports: [
    ReactiveFormsModule,
    RouterLink,
    GlassCardComponent,
    PressEffectDirective,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatChipsModule,
  ],
  template: `
    <div class="register" [class.register--loading]="loading()">
      @if (loading()) {
        <div class="register-loading" aria-live="polite" aria-busy="true">
          <span class="spinner"></span>
          <p>{{ isJoinMode() ? 'Joining your table…' : 'Setting up your visit…' }}</p>
        </div>
      }

      <header class="register-hero" aria-label="Guest registration">
        <a
          class="back-btn"
          routerLink="/customer/scan-table"
          [queryParams]="backQueryParams()"
          aria-label="Back to scan table QR code"
        >
          <mat-icon>arrow_back</mat-icon>
        </a>

        <div class="hero-icon-wrap" [class.hero-icon-wrap--named]="avatarInitial() !== '?'">
          @if (companyLogo()) {
            <img [src]="companyLogo()" [alt]="companyName() || 'Restaurant'" class="hero-logo" />
          } @else if (isJoinMode()) {
            <mat-icon class="hero-icon" aria-hidden="true">group_add</mat-icon>
          } @else {
            <span class="hero-initial" aria-hidden="true">{{ avatarInitial() }}</span>
          }
        </div>

        @if (companyName()) {
          <p class="hero-venue">{{ companyName() }}</p>
        }

        <h1 class="hero-title">
          {{ isJoinMode() ? 'Join this table' : "Tell us who's ordering" }}
        </h1>

        <p class="hero-subtitle">
          @if (isJoinMode()) {
            Choose a name so everyone at the table knows who you are.
          } @else {
            A quick intro before you browse the menu and order from your table.
          }
        </p>

        @if (tableLabel()) {
          <div class="table-pill">
            <mat-icon aria-hidden="true">table_restaurant</mat-icon>
            <span>{{ tableLabel() }}</span>
          </div>
        }
      </header>

      <form
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="register-main"
        id="register-form"
      >
        <app-glass-card>
          <section class="form-section" aria-labelledby="about-you-heading">
            <div class="section-head">
              <mat-icon aria-hidden="true">person_outline</mat-icon>
              <div>
                <h2 id="about-you-heading" class="section-title">About you</h2>
                <p class="section-hint">We'll remember this on your device next time.</p>
              </div>
            </div>

            <div class="register-fields">
              <mat-form-field appearance="outline" class="aura-field full-width">
                <mat-label>Your name</mat-label>
                <mat-icon matPrefix>badge</mat-icon>
                <input matInput formControlName="customerName" autocomplete="name" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="aura-field full-width">
                <mat-label>Phone (optional)</mat-label>
                <mat-icon matPrefix>phone_iphone</mat-icon>
                <input matInput formControlName="phoneNumber" type="tel" autocomplete="tel" />
              </mat-form-field>
            </div>
          </section>
        </app-glass-card>

        @if (!isJoinMode()) {
          <app-glass-card>
            <section class="form-section" aria-labelledby="dietary-heading">
              <div class="section-head">
                <mat-icon aria-hidden="true">spa</mat-icon>
                <div>
                  <h2 id="dietary-heading" class="section-title">Dietary &amp; safety</h2>
                  <p class="section-hint">Optional — helps the kitchen take care of you.</p>
                </div>
              </div>

              <div class="dietary-section">
                <p class="chip-label">Preferences</p>
                <mat-chip-listbox
                  formControlName="dietaryPreferences"
                  class="aura-chip-list"
                  [multiple]="true"
                >
                  @for (opt of dietaryOptions; track opt.id) {
                    <mat-chip-option [value]="opt.id" class="aura-chip">
                      <mat-icon aria-hidden="true">{{ opt.icon }}</mat-icon>
                      {{ opt.label }}
                    </mat-chip-option>
                  }
                </mat-chip-listbox>

                <mat-form-field appearance="outline" class="aura-field full-width">
                  <mat-label>Allergies (optional)</mat-label>
                  <mat-icon matPrefix>warning_amber</mat-icon>
                  <textarea
                    matInput
                    formControlName="allergies"
                    rows="2"
                    placeholder="e.g. peanuts, shellfish"
                  ></textarea>
                </mat-form-field>
              </div>

              <label class="terms-row">
                <mat-checkbox formControlName="agree" color="primary" />
                <span>
                  I agree to the
                  <span class="terms-link">terms</span>
                  and
                  <span class="terms-link">privacy policy</span>.
                </span>
              </label>
            </section>
          </app-glass-card>
        }
      </form>

      <footer class="register-footer">
        <button
          appPressEffect
          mat-flat-button
          color="primary"
          type="submit"
          form="register-form"
          class="submit-btn"
          [disabled]="(isJoinMode() ? !form.get('customerName')?.value?.trim() : form.invalid) || loading()"
        >
          <mat-icon>{{ isJoinMode() ? 'group_add' : 'restaurant_menu' }}</mat-icon>
          {{ isJoinMode() ? 'Join table' : 'Start ordering' }}
        </button>

      </footer>
    </div>
  `,
  styles: [
    `
      :host.register-host {
        display: block;
        margin: calc(-1 * var(--space-4));
        margin-bottom: -5rem;
        min-height: calc(100% + var(--space-4) + 5rem);
      }

      .register {
        position: relative;
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        padding: 0 1rem max(1rem, env(safe-area-inset-bottom));
        animation: dc-fade-in-up 300ms ease-out;
      }

      .register--loading {
        pointer-events: none;
      }

      .register-loading {
        position: fixed;
        inset: 0;
        z-index: var(--z-overlay);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        background: var(--overlay-bg);
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

      .register-hero {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 0.5rem 0 1.25rem;
      }

      .back-btn {
        position: absolute;
        top: 0;
        left: 0;
        width: 2.75rem;
        height: 2.75rem;
        border: 1px solid var(--border-subtle);
        border-radius: 50%;
        background: var(--bg-glass);
        backdrop-filter: blur(16px);
        color: var(--text-primary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        cursor: pointer;
        transition: border-color 180ms ease, background-color 180ms ease;
      }

      .back-btn:hover {
        border-color: var(--border-glow);
        background: var(--bg-glass-elevated);
      }

      .hero-icon-wrap {
        width: 5.5rem;
        height: 5.5rem;
        border-radius: 1.375rem;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0.25rem 0 0.85rem;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(20px) saturate(1.2);
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
        overflow: hidden;
        transition: box-shadow 280ms ease, border-color 280ms ease;
      }

      .hero-icon-wrap--named {
        border-color: rgba(236, 72, 153, 0.35);
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35), 0 0 24px rgba(168, 85, 247, 0.2);
      }

      .hero-logo {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .hero-icon {
        font-size: 2.25rem;
        width: 2.25rem;
        height: 2.25rem;
        color: #ec4899;
      }

      .hero-initial {
        font-size: 2rem;
        font-weight: 700;
        line-height: 1;
        background: var(--gradient-fab);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      .hero-venue {
        margin: 0 0 0.35rem;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--accent-primary);
      }

      .hero-title {
        margin: 0 0 0.5rem;
        max-width: 18rem;
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 1.2;
        color: var(--text-primary);
      }

      .hero-subtitle {
        margin: 0;
        max-width: 20rem;
        font-size: 0.92rem;
        line-height: 1.55;
        color: var(--text-secondary);
      }

      .table-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        margin-top: 0.85rem;
        padding: 0.45rem 0.9rem;
        border-radius: var(--radius-pill);
        background: var(--accent-primary-soft);
        color: var(--text-primary);
        font-size: 0.875rem;
        font-weight: 500;
      }

      .table-pill mat-icon {
        font-size: 1.1rem;
        width: 1.1rem;
        height: 1.1rem;
        color: var(--accent-primary);
      }

      .register-main {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        max-width: 28rem;
        width: 100%;
        margin: 0 auto;
        padding-bottom: 0.5rem;
      }

      .form-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .section-head {
        display: flex;
        align-items: flex-start;
        gap: 0.65rem;
      }

      .section-head > mat-icon {
        flex-shrink: 0;
        margin-top: 0.1rem;
        font-size: 1.35rem;
        width: 1.35rem;
        height: 1.35rem;
        color: var(--accent-tertiary);
      }

      .section-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .section-hint {
        margin: 0.15rem 0 0;
        font-size: 0.8rem;
        color: var(--text-muted);
      }

      .register-fields {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }

      .full-width {
        width: 100%;
      }

      .chip-label {
        margin: 0 0 0.45rem;
        font-size: 0.8rem;
        color: var(--text-secondary);
      }

      .dietary-section {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }

      .terms-row {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        margin-top: 0.15rem;
        font-size: 0.85rem;
        line-height: 1.45;
        color: var(--text-secondary);
        cursor: pointer;
      }

      .terms-link {
        color: var(--accent-primary);
        text-decoration: underline;
        text-underline-offset: 2px;
      }

      .register-footer {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
        max-width: 28rem;
        width: 100%;
        margin: 0.75rem auto 0;
        padding-top: 0.25rem;
      }

      .submit-btn {
        width: 100%;
        min-height: var(--btn-min-height);
        border-radius: var(--btn-radius) !important;
        font-weight: 600;
        letter-spacing: 0.01em;
        justify-content: center;
        box-shadow: 0 8px 24px rgba(99, 91, 255, 0.35);
      }

      .footer-link {
        color: var(--text-muted) !important;
        font-size: 0.85rem;
      }

      :host ::ng-deep .aura-field .mat-mdc-text-field-wrapper {
        background: rgba(255, 255, 255, 0.04);
        border-radius: var(--radius-md);
      }

      :host ::ng-deep .aura-chip-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }

      :host ::ng-deep .aura-chip.mat-mdc-chip-option {
        height: auto;
        min-height: 2.25rem;
        padding: 0.35rem 0.75rem;
        border-radius: var(--radius-pill);
        border: 1px solid var(--border-subtle);
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-secondary);
        font-size: 0.8rem;
      }

      :host ::ng-deep .aura-chip.mat-mdc-chip-option mat-icon {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
        margin-right: 0.25rem;
      }

      :host ::ng-deep .aura-chip.mat-mdc-chip-selected {
        border-color: rgba(99, 91, 255, 0.55);
        background: rgba(99, 91, 255, 0.22);
        color: var(--text-primary);
      }

      @media (max-height: 740px), (max-width: 480px) {
        .hero-icon-wrap {
          width: 4.75rem;
          height: 4.75rem;
          border-radius: 1.125rem;
        }

        .hero-title {
          font-size: 1.3rem;
        }

        .hero-subtitle {
          font-size: 0.875rem;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly sessionService = inject(CustomerSessionService);
  private readonly profileService = inject(CustomerProfileService);
  private readonly notifications = inject(NotificationService);
  private readonly tableResolve = inject(CustomerTableResolveService);
  private formSub?: Subscription;

  readonly dietaryOptions = DIETARY_OPTIONS;
  readonly loading = signal(false);
  readonly avatarInitial = signal('?');
  readonly companyName = signal('');
  readonly companyLogo = signal<string | null>(null);
  readonly tableLabel = signal<string | null>(null);
  readonly isJoinMode = computed(() => !!this.route.snapshot.queryParamMap.get('sid'));

  form = this.fb.group({
    customerName: ['', Validators.required],
    phoneNumber: [''],
    dietaryPreferences: this.fb.nonNullable.control<string[]>([]),
    allergies: [''],
    agree: [false, Validators.requiredTrue],
  });

  backQueryParams(): Record<string, string> {
    const c = this.route.snapshot.queryParamMap.get('c');
    return c ? { c } : {};
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const companyGuid = params.get('c');
    const tableNumber = params.get('t');

    if (tableNumber) {
      this.tableLabel.set(`Table ${tableNumber}`);
    }

    if (companyGuid) {
      this.api.get<{ name?: string; logo?: string | null }>(`companies/${companyGuid}`).subscribe({
        next: (company) => {
          this.companyName.set(company?.name?.trim() ?? '');
          this.companyLogo.set(company?.logo ?? null);
        },
        error: () => {
          this.companyName.set('');
          this.companyLogo.set(null);
        },
      });
    }

    const saved = this.profileService.resolveProfile(this.sessionService.currentSessionSnapshot);
    if (saved) {
      this.form.patchValue({
        customerName: saved.customerName,
        phoneNumber: saved.phoneNumber ?? '',
        dietaryPreferences: saved.dietaryPreferences ?? [],
        allergies: saved.allergies ?? '',
      });
      this.updateAvatarInitial(saved.customerName);
      if (this.isJoinMode()) {
        this.form.patchValue({ agree: true });
      }
    }

    this.formSub = this.form.get('customerName')?.valueChanges.subscribe((name) => {
      this.updateAvatarInitial(name ?? '');
    });
  }

  ngOnDestroy(): void {
    this.formSub?.unsubscribe();
  }

  private updateAvatarInitial(name: string): void {
    const trimmed = name.trim();
    this.avatarInitial.set(trimmed ? trimmed.charAt(0).toUpperCase() : '?');
  }

  private persistProfileFromForm(): void {
    const name = this.form.value.customerName?.trim();
    if (!name) return;
    this.profileService.saveProfile({
      customerName: name,
      phoneNumber: this.form.value.phoneNumber?.trim() || undefined,
      dietaryPreferences: this.form.value.dietaryPreferences ?? [],
      allergies: this.form.value.allergies?.trim() || undefined,
      deviceId: this.profileService.getDeviceId(),
    });
  }

  submit(): void {
    const sid = this.route.snapshot.queryParamMap.get('sid');
    if (sid) {
      const name = this.form.value.customerName?.trim();
      if (!name) {
        this.notifications.error('Please enter your name.');
        return;
      }
      this.loading.set(true);
      this.persistProfileFromForm();
      this.sessionService
        .joinSession(sid, {
          displayName: name,
          phoneNumber: this.form.value.phoneNumber?.trim() || undefined,
          deviceId: this.profileService.getDeviceId(),
        })
        .subscribe({
          next: () => {
            this.loading.set(false);
            void this.router.navigate(['/customer/menu']);
          },
          error: (err) => {
            this.loading.set(false);
            this.notifications.error(err?.error?.message ?? 'Could not join table. Please try again.');
          },
        });
      return;
    }

    if (this.form.invalid) return;

    const companyGuid = this.route.snapshot.queryParamMap.get('c') ?? '';
    const tableIdParam = this.route.snapshot.queryParamMap.get('tableId') ?? '';
    const tableNumberParam = this.route.snapshot.queryParamMap.get('t') ?? '';

    if (!companyGuid) {
      void this.router.navigate(['/customer/scan-table']);
      return;
    }

    const doStartSession = (resolvedTableId: string) => {
      this.persistProfileFromForm();
      this.loading.set(true);
      this.sessionService
        .startSession(companyGuid, resolvedTableId, {
          customerName: this.form.value.customerName ?? '',
          phoneNumber: this.form.value.phoneNumber ?? undefined,
          dietaryPreferences: this.form.value.dietaryPreferences?.length
            ? this.form.value.dietaryPreferences
            : undefined,
          allergies: this.form.value.allergies?.trim() || undefined,
        })
        .subscribe({
          next: () => {
            this.loading.set(false);
            void this.router.navigate(['/customer/menu']);
          },
          error: (err) => {
            this.loading.set(false);
            const message = err?.error?.message as string | undefined;
            if (err?.status === 409) {
              this.sessionService.getScanStatus(resolvedTableId, companyGuid).subscribe({
                next: (status) => {
                  if (status.hasActiveSession && status.sessionId) {
                    this.notifications.info('Someone already started this table. Join their session.');
                    void this.router.navigate(['/customer/register'], {
                      queryParams: {
                        c: companyGuid,
                        t: tableNumberParam || status.tableNumber,
                        tableId: resolvedTableId,
                        sid: status.sessionId,
                      },
                      queryParamsHandling: '',
                    });
                    return;
                  }
                  this.notifications.error(message ?? 'Could not start session. Please try again.');
                },
                error: () => {
                  this.notifications.error(message ?? 'Could not start session. Please try again.');
                },
              });
              return;
            }
            this.notifications.error(message ?? 'Could not start session. Please try again.');
          },
        });
    };

    if (!tableIdParam && !tableNumberParam) {
      void this.router.navigate(['/customer/scan-table']);
      return;
    }

    this.tableResolve
      .resolve(companyGuid, { tableId: tableIdParam, tableNumber: tableNumberParam })
      .subscribe({
        next: (table) => {
          if (table?.id) {
            doStartSession(table.id);
            return;
          }
          this.notifications.error("We couldn't find that table. Please scan the QR code at your table again.");
          void this.router.navigate(['/customer/scan-table']);
        },
        error: () => {
          this.notifications.error("Couldn't load table. Please go back and try again.");
          void this.router.navigate(['/customer/scan-table']);
        },
      });
  }
}
