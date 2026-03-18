import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
    <div class="login">
      <h1 class="dc-title">Staff Login</h1>

      <mat-tab-group [(selectedIndex)]="selectedTabIndex" (selectedIndexChange)="onTabChange($event)">
        <mat-tab label="PIN">
          <form [formGroup]="pinForm" (ngSubmit)="loginWithPin()" class="form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Name</mat-label>
              <input matInput formControlName="staffCode" placeholder="Your name (optional if only one staff)" />
              <mat-icon matPrefix>badge</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>PIN</mat-label>
              <input matInput type="password" formControlName="pin" placeholder="4–6 digits" />
              <mat-icon matPrefix>lock</mat-icon>
            </mat-form-field>
            <a class="forgot-link" (click)="forgotPin()">Forgot PIN?</a>
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="pinForm.invalid"
              class="submit-btn"
            >
              <mat-icon>login</mat-icon>
              Sign in with PIN
            </button>
          </form>
        </mat-tab>
        <mat-tab label="Email">
          <form [formGroup]="emailForm" (ngSubmit)="loginWithEmail()" class="form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
              <mat-icon matPrefix>email</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" />
              <mat-icon matPrefix>lock</mat-icon>
            </mat-form-field>
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="emailForm.invalid"
              class="submit-btn"
            >
              <mat-icon>login</mat-icon>
              Sign in with Email
            </button>
          </form>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .login {
        padding: 1.5rem;
        max-width: 400px;
        margin: 0 auto;
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding-top: 1rem;
      }
      .full-width {
        width: 100%;
      }
      .forgot-link {
        font-size: 0.875rem;
        color: var(--accent-primary);
        cursor: pointer;
        margin-bottom: 0.5rem;
      }
      .submit-btn {
        margin-top: 0.5rem;
      }
      .submit-btn mat-icon {
        margin-right: 0.5rem;
        vertical-align: middle;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffLoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  selectedTabIndex = 0;

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
