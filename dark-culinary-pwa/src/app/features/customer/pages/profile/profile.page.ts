import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { GlassCardComponent } from '../../../../shared/components/glass-card/glass-card.component';
import { CustomerProfileService } from '../../services/customer-profile.service';
import { CustomerSessionService } from '../../services/customer-session.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DIETARY_OPTIONS } from '../../constants/dietary-options';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    GlassCardComponent,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
  ],
  template: `
    <div class="profile-page">
      <header class="profile-header">
        <div class="avatar" aria-hidden="true">{{ avatarInitial() }}</div>
        <h1 class="dc-title">Your profile</h1>
        <p class="dc-body profile-sub">
          Saved on this device so we can greet you next time you scan in.
        </p>
      </header>

      <app-glass-card>
        <form class="profile-form" [formGroup]="form" (ngSubmit)="save()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-icon matPrefix>person</mat-icon>
            <mat-label>Your name</mat-label>
            <input matInput formControlName="customerName" autocomplete="name" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-icon matPrefix>phone_iphone</mat-icon>
            <mat-label>Phone (optional)</mat-label>
            <input matInput formControlName="phoneNumber" type="tel" autocomplete="tel" />
          </mat-form-field>

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

          <button
            mat-flat-button
            color="primary"
            type="submit"
            class="save-btn"
            [disabled]="form.invalid || saving()"
          >
            <mat-icon>save</mat-icon>
            Save profile
          </button>
        </form>
      </app-glass-card>
    </div>
  `,
  styles: [
    `
      .profile-page {
        max-width: 28rem;
        margin: 0 auto;
        padding-bottom: 1rem;
      }
      .profile-header {
        text-align: center;
        margin-bottom: 1.25rem;
      }
      .avatar {
        width: 4.5rem;
        height: 4.5rem;
        margin: 0 auto 0.85rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.65rem;
        font-weight: 700;
        color: #1a1a1a;
        background: linear-gradient(145deg, #fde047 0%, #f59e0b 100%);
        border: 3px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      }
      .profile-sub {
        margin: 0.35rem 0 0;
        color: var(--text-secondary);
      }
      .profile-form {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .full-width {
        width: 100%;
      }
      .dietary-section {
        margin: 0.25rem 0 0.5rem;
      }
      .section-label {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        color: var(--text-secondary);
      }
      .save-btn {
        margin-top: 0.5rem;
        width: 100%;
        justify-content: center;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(CustomerProfileService);
  private readonly sessionService = inject(CustomerSessionService);
  private readonly notifications = inject(NotificationService);

  readonly dietaryOptions = DIETARY_OPTIONS;
  readonly saving = signal(false);
  readonly avatarInitial = signal('?');

  form = this.fb.group({
    customerName: ['', Validators.required],
    phoneNumber: [''],
    dietaryPreferences: this.fb.nonNullable.control<string[]>([]),
    allergies: [''],
  });

  ngOnInit(): void {
    const resolved = this.profileService.resolveProfile(
      this.sessionService.currentSessionSnapshot,
    );
    if (resolved) {
      this.form.patchValue({
        customerName: resolved.customerName,
        phoneNumber: resolved.phoneNumber ?? '',
        dietaryPreferences: resolved.dietaryPreferences ?? [],
        allergies: resolved.allergies ?? '',
      });
      this.avatarInitial.set(resolved.customerName.charAt(0).toUpperCase());
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const profile = {
      customerName: this.form.value.customerName!.trim(),
      phoneNumber: this.form.value.phoneNumber?.trim() || undefined,
      dietaryPreferences: this.form.value.dietaryPreferences ?? [],
      allergies: this.form.value.allergies?.trim() || undefined,
      deviceId: this.profileService.getDeviceId(),
    };
    this.profileService.syncToActiveSession(profile).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.avatarInitial.set(profile.customerName.charAt(0).toUpperCase());
        this.notifications.success(
          result.synced ? 'Profile saved' : 'Profile saved on this device',
        );
      },
      error: (err) => {
        this.saving.set(false);
        this.avatarInitial.set(profile.customerName.charAt(0).toUpperCase());
        const message =
          err instanceof Error
            ? err.message
            : (err as { error?: { message?: string } })?.error?.message ??
              'Could not sync profile to the server';
        this.notifications.warn(message);
      },
    });
  }
}
