import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { GlassCardComponent } from '../../../../shared/components/glass-card/glass-card.component';
import { CustomerSessionService } from '../../services/customer-session.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiService } from '../../../../core/services/api.service';

const DIETARY_OPTIONS = [
  { id: 'VEGAN', label: 'Vegan', icon: 'eco' },
  { id: 'VEGETARIAN', label: 'Vegetarian', icon: 'spa' },
  { id: 'GLUTEN_FREE', label: 'Gluten-free', icon: 'no_food' },
  { id: 'DAIRY_FREE', label: 'Dairy-free', icon: 'no_food' },
  { id: 'NUT_FREE', label: 'Nut-free', icon: 'warning_amber' },
];

@Component({
  selector: 'app-customer-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    GlassCardComponent,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatChipsModule,
  ],
  template: `
    <div class="register">
      <app-glass-card>
        <div class="card-inner" [class.loading]="loading()">
          @if (loading()) {
            <div class="loading-overlay">
              <span class="spinner"></span>
            </div>
          }
          <h1 class="dc-title">{{ isJoinMode() ? 'Join this table' : "Tell us who's ordering" }}</h1>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-icon matPrefix>person</mat-icon>
              <mat-label>Your name</mat-label>
              <input matInput formControlName="customerName" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-icon matPrefix>phone_iphone</mat-icon>
              <mat-label>Phone (optional)</mat-label>
              <input matInput formControlName="phoneNumber" type="tel" />
            </mat-form-field>
            @if (!isJoinMode()) {
              <div class="dietary-section">
                <label class="section-label">
                  <mat-icon>spa</mat-icon>
                  Dietary preferences
                </label>
                <mat-chip-listbox formControlName="dietaryPreferences" [multiple]="true">
                  @for (opt of dietaryOptions; track opt.id) {
                    <mat-chip-option [value]="opt.id">{{ opt.label }}</mat-chip-option>
                  }
                </mat-chip-listbox>
              </div>
              <mat-form-field appearance="outline" class="full-width">
                <mat-icon matPrefix>warning_amber</mat-icon>
                <mat-label>Allergies (optional)</mat-label>
                <textarea matInput formControlName="allergies" rows="2"></textarea>
              </mat-form-field>
              <div class="terms">
                <mat-checkbox formControlName="agree">
                  <mat-icon class="inline-icon">gavel</mat-icon>
                  I agree to the terms and privacy policy.
                </mat-checkbox>
              </div>
            }
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="(isJoinMode() ? !form.get('customerName')?.value?.trim() : form.invalid) || loading()"
            >
              <mat-icon>{{ isJoinMode() ? 'group_add' : 'restaurant' }}</mat-icon>
              {{ isJoinMode() ? 'Join table' : 'Start ordering' }}
            </button>
          </form>
          <a mat-button routerLink="/customer/scan-table" class="back-link">
            Back to table selection
          </a>
        </div>
      </app-glass-card>
    </div>
  `,
  styles: [
    `
      .register {
        padding: 1.5rem;
      }
      .card-inner {
        position: relative;
      }
      .card-inner.loading {
        pointer-events: none;
        opacity: 0.85;
      }
      .loading-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--overlay-bg);
        border-radius: 16px;
      }
      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-subtle);
        border-top-color: var(--accent-primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .full-width { width: 100%; }
      .dietary-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .section-label {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
      .section-label mat-icon {
        font-size: 1.1rem;
        width: 1.1rem;
        height: 1.1rem;
      }
      .terms {
        margin: 0.25rem 0;
      }
      .inline-icon {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
        vertical-align: middle;
        margin-right: 0.25rem;
      }
      .back-link {
        display: block;
        margin-top: 1rem;
        text-align: center;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly sessionService = inject(CustomerSessionService);
  private readonly notifications = inject(NotificationService);
  private readonly api = inject(ApiService);

  readonly dietaryOptions = DIETARY_OPTIONS;
  readonly loading = signal(false);
  readonly isJoinMode = computed(() => !!this.route.snapshot.queryParamMap.get('sid'));

  form = this.fb.group({
    customerName: ['', Validators.required],
    phoneNumber: [''],
    dietaryPreferences: this.fb.nonNullable.control<string[]>([]),
    allergies: [''],
    agree: [false, Validators.requiredTrue],
  });

  submit(): void {
    const sid = this.route.snapshot.queryParamMap.get('sid');
    if (sid) {
      const name = this.form.value.customerName?.trim();
      if (!name) {
        this.notifications.error('Please enter your name.');
        return;
      }
      this.loading.set(true);
      this.sessionService
        .joinSession(sid, {
          displayName: name,
          phoneNumber: this.form.value.phoneNumber?.trim() || undefined,
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
    let tableId = this.route.snapshot.queryParamMap.get('tableId') ?? '';
    const tableNumberParam = this.route.snapshot.queryParamMap.get('t') ?? '';

    if (!companyGuid) {
      void this.router.navigate(['/customer/scan-table']);
      return;
    }

    const doStartSession = (resolvedTableId: string) => {
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
            this.notifications.error(err?.error?.message ?? 'Could not start session. Please try again.');
          },
        });
    };

    if (tableId) {
      doStartSession(tableId);
      return;
    }

    if (!tableNumberParam) {
      void this.router.navigate(['/customer/scan-table']);
      return;
    }

    this.api.get<{ id: string; number: number }[]>('tables', { companyId: companyGuid }).subscribe({
      next: (tables) => {
        const list = Array.isArray(tables) ? tables : [];
        const tableNum = Number(tableNumberParam);
        const table = list.find(
          (tb) =>
            String(tb.number) === tableNumberParam ||
            tb.number === tableNum ||
            tb.id === tableNumberParam
        );
        if (table?.id) {
          doStartSession(table.id);
        } else {
          this.notifications.error("We couldn't find that table. Please go back and scan again.");
          void this.router.navigate(['/customer/scan-table']);
        }
      },
      error: () => {
        this.notifications.error("Couldn't load table. Please go back and try again.");
        void this.router.navigate(['/customer/scan-table']);
      },
    });
  }
}
