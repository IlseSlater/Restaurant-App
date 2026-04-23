import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, AuthUser } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiService } from '../../../../core/services/api.service';
import { take } from 'rxjs';

type LoginMode = 'pin' | 'email';

@Component({
  selector: 'app-staff-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="login-shell">
      <div class="login-frame">
        <section class="brand-panel">
          <div class="brand-top">
            <div class="brand-logo" aria-hidden="true">
              @if (company()?.logo) {
                <img [src]="company()?.logo!" [alt]="company()?.name ?? 'Company'" />
              } @else {
                <mat-icon>storefront</mat-icon>
              }
            </div>
            <div class="brand-name">
              <div class="company">{{ company()?.name ?? 'Restaurant Admin' }}</div>
              <div class="hint">Staff portal</div>
            </div>
          </div>

          <div class="brand-copy">
            <h2>Welcome back.</h2>
            <p>Sign in to manage orders, menu items, and your team—securely and fast.</p>
          </div>

          <div class="brand-illustration" aria-hidden="true">
            <div class="orb orb-a"></div>
            <div class="orb orb-b"></div>
            <div class="orb orb-c"></div>
            <div class="illus-card">
              <mat-icon>receipt_long</mat-icon>
              <span>Live orders</span>
            </div>
            <div class="illus-card illus-card-right">
              <mat-icon>inventory_2</mat-icon>
              <span>Menu updates</span>
            </div>
          </div>
        </section>

        <section class="form-panel">
          <div class="form-header">
            <div class="form-title">Sign in</div>
            <div class="form-subtitle">Choose a method to continue.</div>
          </div>

          <div>
            <mat-tab-group class="tabs" [(selectedIndex)]="selectedTabIndex" (selectedIndexChange)="onTabChange($event)">
              <mat-tab label="PIN">
                <form [formGroup]="pinForm" (ngSubmit)="loginWithPin()" class="form">
                  <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                    <mat-label>Staff name</mat-label>
                    <input matInput formControlName="staffCode" autocomplete="username" />
                    <mat-icon matPrefix>badge</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                    <mat-label>PIN</mat-label>
                    <input matInput type="password" inputmode="numeric" autocomplete="current-password" formControlName="pin" />
                    <mat-icon matPrefix>lock</mat-icon>
                    @if (pinForm.controls.pin.touched && pinForm.controls.pin.invalid) {
                      <mat-hint class="hint-error" align="start">Enter a valid PIN (min 4 digits).</mat-hint>
                    }
                  </mat-form-field>

                  <button mat-flat-button color="primary" type="submit" [disabled]="pinForm.invalid" class="submit-btn">
                    <mat-icon>login</mat-icon>
                    Continue
                  </button>

                  <button type="button" class="link-btn" (click)="forgotPin()">
                    Forgot PIN?
                  </button>
                </form>
              </mat-tab>

              <mat-tab label="Email">
                <form [formGroup]="emailForm" (ngSubmit)="loginWithEmail()" class="form">
                  <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                    <mat-label>Email</mat-label>
                    <input matInput type="email" formControlName="email" autocomplete="email" />
                    <mat-icon matPrefix>email</mat-icon>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                    <mat-label>Password</mat-label>
                    <input matInput type="password" formControlName="password" autocomplete="current-password" />
                    <mat-icon matPrefix>lock</mat-icon>
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" [disabled]="emailForm.invalid" class="submit-btn">
                    <mat-icon>login</mat-icon>
                    Continue
                  </button>
                </form>
              </mat-tab>
            </mat-tab-group>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .login-shell {
        min-height: calc(100vh - 4rem);
        padding: clamp(1rem, 2.6vw, 2.5rem);
        display: flex;
        align-items: center;
        justify-content: center;
        background:
          radial-gradient(1200px 600px at 12% 20%, color-mix(in srgb, var(--accent-primary) 22%, transparent), transparent 60%),
          radial-gradient(900px 520px at 88% 80%, color-mix(in srgb, #4f7cff 20%, transparent), transparent 62%),
          linear-gradient(135deg, #2b57ff 0%, #4c62ff 30%, #3a46ff 100%);
      }
      .login-frame {
        width: min(1240px, 100%);
        min-height: min(760px, calc(100vh - 6rem));
        border-radius: 26px;
        overflow: hidden;
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        box-shadow: 0 30px 90px rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.10);
        background: #0b1131;
      }
      @media (max-width: 900px) {
        .login-frame {
          grid-template-columns: 1fr;
          min-height: unset;
        }
      }

      .brand-panel {
        position: relative;
        padding: clamp(1.25rem, 2.8vw, 2.2rem);
        color: #eaf0ff;
        background:
          radial-gradient(900px 520px at 20% 40%, rgba(255, 255, 255, 0.06), transparent 65%),
          radial-gradient(700px 500px at 75% 20%, rgba(0, 0, 0, 0.25), transparent 60%),
          linear-gradient(135deg, rgba(5, 10, 40, 1) 0%, rgba(8, 14, 55, 1) 40%, rgba(6, 10, 35, 1) 100%);
      }
      .brand-panel::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: radial-gradient(800px 420px at 18% 10%, rgba(110, 205, 255, 0.10), transparent 65%);
      }
      .brand-top {
        display: flex;
        align-items: center;
        gap: 1.15rem;
        padding: 0.6rem 0.75rem;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.14);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
      }
      .brand-logo {
        width: clamp(74px, 9vw, 104px);
        height: clamp(74px, 9vw, 104px);
        border-radius: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.14);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
      }
      .brand-logo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 20px;
      }
      .brand-logo mat-icon {
        color: rgba(255, 255, 255, 0.92);
        font-size: 2rem;
        width: 2rem;
        height: 2rem;
      }
      .brand-name {
        min-width: 0;
      }
      .company {
        font-weight: 700;
        letter-spacing: -0.01em;
        font-size: clamp(1.35rem, 3vw, 2rem);
        line-height: 1.08;
        text-wrap: balance;
        text-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      }
      .hint {
        color: rgba(234, 240, 255, 0.72);
        font-size: clamp(0.95rem, 1.6vw, 1.08rem);
        margin-top: 0.25rem;
      }
      .brand-copy {
        margin-top: clamp(1.4rem, 2.8vw, 3.2rem);
        max-width: 30rem;
      }
      .brand-copy h2 {
        margin: 0;
        font-size: clamp(1.85rem, 3.2vw, 2.6rem);
        line-height: 1.12;
        letter-spacing: -0.02em;
      }
      .brand-copy p {
        margin: 0.65rem 0 0;
        color: rgba(234, 240, 255, 0.72);
        line-height: 1.45;
        max-width: 36ch;
      }
      .brand-illustration {
        position: absolute;
        left: 1.5rem;
        right: 1.5rem;
        bottom: 1.6rem;
        height: 220px;
        pointer-events: none;
      }
      @media (max-width: 900px) {
        .brand-illustration {
          position: relative;
          left: 0;
          right: 0;
          bottom: 0;
          margin-top: 1.25rem;
          height: 140px;
        }
      }
      .orb {
        position: absolute;
        border-radius: 999px;
        filter: blur(2px);
        opacity: 0.9;
      }
      .orb-a { width: 210px; height: 210px; left: -40px; bottom: -90px; background: rgba(61, 92, 255, 0.35); }
      .orb-b { width: 180px; height: 180px; left: 42%; bottom: -110px; background: rgba(255, 255, 255, 0.10); }
      .orb-c { width: 220px; height: 220px; right: -70px; bottom: -120px; background: rgba(0, 0, 0, 0.35); }
      .illus-card {
        position: absolute;
        left: 0;
        bottom: 0;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 0.8rem;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: rgba(234, 240, 255, 0.92);
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
      }
      .illus-card-right {
        left: auto;
        right: 0;
        bottom: 44px;
      }
      .illus-card mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .form-panel {
        padding: clamp(1.25rem, 2.8vw, 2.2rem);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%);
        color: #eaf0ff;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .form-header {
        margin-bottom: 1.25rem;
      }
      .form-title {
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      .form-subtitle {
        margin-top: 0.25rem;
        color: rgba(234, 240, 255, 0.72);
        font-size: 0.92rem;
      }

      .card {
        background: rgba(10, 16, 48, 0.55);
        border: 0;
        border-radius: 20px;
        backdrop-filter: blur(18px);
        box-shadow:
          0 18px 60px rgba(0, 0, 0, 0.35),
          inset 0 1px 0 rgba(255, 255, 255, 0.06);
        overflow: hidden;
      }
      .tabs { display: block; }
      .form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.6rem 1.6rem 1.75rem;
      }
      .full-width {
        width: 100%;
      }
      .hint-error {
        color: #ff7b7b;
      }
      .submit-btn {
        margin-top: 0.35rem;
        min-height: 48px;
      }
      .submit-btn mat-icon {
        margin-right: 0.5rem;
        vertical-align: middle;
      }
      .link-btn {
        margin-top: 0.35rem;
        align-self: flex-start;
        background: transparent;
        border: 0;
        padding: 0.25rem 0;
        color: rgba(234, 240, 255, 0.85);
        cursor: pointer;
        font: inherit;
        font-size: 0.9rem;
      }
      .link-btn:hover {
        text-decoration: underline;
      }

      /* Make Material inputs feel cleaner/less boxy */
      :host ::ng-deep .mat-mdc-form-field {
        --mdc-outlined-text-field-outline-color: rgba(255, 255, 255, 0.10);
        --mdc-outlined-text-field-hover-outline-color: rgba(255, 255, 255, 0.18);
        --mdc-outlined-text-field-focus-outline-color: rgba(134, 255, 210, 0.55);
        --mdc-outlined-text-field-label-text-color: rgba(234, 240, 255, 0.78);
        --mdc-outlined-text-field-input-text-color: rgba(234, 240, 255, 0.92);
        --mdc-outlined-text-field-supporting-text-color: rgba(234, 240, 255, 0.62);
      }
      :host ::ng-deep .mat-mdc-text-field-wrapper {
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.04);
      }
      :host ::ng-deep .mat-mdc-form-field-infix {
        padding-top: 0.9rem;
        padding-bottom: 0.9rem;
      }
      :host ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        margin-top: 0.25rem;
      }
      :host ::ng-deep .mat-mdc-form-field-icon-prefix {
        color: rgba(234, 240, 255, 0.72);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffLoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly api = inject(ApiService);

  selectedTabIndex = 0;

  readonly company = signal<null | { id: string; name: string; logo: string | null }>(null);

  pinForm = this.fb.group({
    staffCode: [''],
    pin: ['', [Validators.required, Validators.minLength(4)]],
  });

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  ngOnInit(): void {
    const companyGuid = this.route.snapshot.paramMap.get('companyGuid') ?? '';
    if (!companyGuid) return;
    this.api.get<{ id: string; name: string; logo: string | null }>(`companies/${companyGuid}`).pipe(take(1)).subscribe({
      next: (c) => this.company.set(c),
      error: () => {
        // Non-blocking: login can still proceed without branding
        this.company.set(null);
      },
    });
  }

  loginWithPin(): void {
    if (this.pinForm.invalid) {
      return;
    }
    const companyGuid = this.route.snapshot.paramMap.get('companyGuid') ?? '';
    const staffCode = this.pinForm.value.staffCode ?? '';
    const pin = this.pinForm.value.pin ?? '';
    this.auth.loginWithPin(companyGuid, staffCode, pin).subscribe({
      next: (res) => this.redirectByRole(res.user, companyGuid),
      error: () => this.notifications.error('Invalid PIN or company'),
    });
  }

  loginWithEmail(): void {
    if (this.emailForm.invalid) {
      return;
    }
    const email = this.emailForm.value.email ?? '';
    const password = this.emailForm.value.password ?? '';
    this.auth.login(email, password).subscribe({
      next: (res) => {
        const companyGuid = this.route.snapshot.paramMap.get('companyGuid') ?? res.user.companyId ?? '';
        this.redirectByRole(res.user, companyGuid);
      },
      error: () => this.notifications.error('Invalid email or password'),
    });
  }

  private redirectByRole(user: AuthUser, companyGuid: string): void {
    const role = (user.role ?? '').toUpperCase();
    const guid = companyGuid || (user.companyId ?? '');
    switch (role) {
      case 'WAITER':
        void this.router.navigate([`/waiter/${guid}`]);
        break;
      case 'KITCHEN_STAFF':
      case 'CHEF':
      case 'SOUS_CHEF':
        void this.router.navigate([`/kitchen/${guid}`]);
        break;
      case 'BAR_STAFF':
      case 'BARTENDER':
      case 'BARISTA':
        void this.router.navigate([`/bar/${guid}`]);
        break;
      case 'MANAGER':
      case 'ASSISTANT_MANAGER':
        void this.router.navigate([`/manager/${guid}`]);
        break;
      case 'ADMIN':
      case 'SYSTEM_ADMIN':
        void this.router.navigate([guid ? `/admin/${guid}` : '/admin']);
        break;
      default:
        void this.router.navigate([`/waiter/${guid}`]);
    }
  }

  forgotPin(): void {
    this.notifications.info('Contact your manager to reset your PIN.');
  }
}
