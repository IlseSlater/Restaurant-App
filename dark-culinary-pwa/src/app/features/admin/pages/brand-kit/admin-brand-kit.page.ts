import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CompanyContextService } from '../../../../core/services/company-context.service';
import { ApiService } from '../../../../core/services/api.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-admin-brand-kit-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="brand-kit">
      <h2>Brand Kit</h2>
      <p class="hint">Update logo and brand colors used across your apps.</p>

      <mat-form-field appearance="outline" class="full">
        <mat-label>Company name</mat-label>
        <input matInput [ngModel]="companyName()" (ngModelChange)="companyName.set($event)" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full">
        <mat-label>Logo URL</mat-label>
        <input matInput [ngModel]="logo()" (ngModelChange)="logo.set($event)" />
      </mat-form-field>

      <div class="color-row">
        <label>Primary color</label>
        <input type="color" [value]="primaryColor()" (input)="onPrimaryColorChange($any($event.target).value)" />
        <mat-form-field appearance="outline" class="full">
          <mat-label>Primary hex</mat-label>
          <input matInput [ngModel]="primaryColor()" (ngModelChange)="onPrimaryColorChange($event)" />
        </mat-form-field>
      </div>

      <div class="color-row">
        <label>Secondary color</label>
        <input type="color" [value]="secondaryColor()" (input)="onSecondaryColorChange($any($event.target).value)" />
        <mat-form-field appearance="outline" class="full">
          <mat-label>Secondary hex</mat-label>
          <input matInput [ngModel]="secondaryColor()" (ngModelChange)="onSecondaryColorChange($event)" />
        </mat-form-field>
      </div>

      <div class="actions">
        <button mat-stroked-button type="button" (click)="reset()">Reset</button>
        <button mat-flat-button color="primary" type="button" [disabled]="saving()" (click)="save()">
          {{ saving() ? 'Saving...' : 'Save Brand Kit' }}
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      .brand-kit { max-width: 680px; display: flex; flex-direction: column; gap: 0.75rem; }
      .hint { margin: 0; color: var(--text-secondary); }
      .full { width: 100%; }
      .color-row {
        display: grid;
        grid-template-columns: 140px 48px 1fr;
        align-items: center;
        gap: 0.75rem;
      }
      .color-row label {
        font-size: 0.9rem;
        color: var(--text-secondary);
      }
      .color-row input[type='color'] {
        width: 44px;
        height: 44px;
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        background: transparent;
        cursor: pointer;
      }
      .actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBrandKitPage {
  private readonly api = inject(ApiService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly notifications = inject(NotificationService);

  readonly company = toSignal(this.companyContext.currentCompany$, { initialValue: null });
  readonly saving = signal(false);
  readonly companyName = signal('');
  readonly logo = signal('');
  readonly primaryColor = signal('#88ffb6');
  readonly secondaryColor = signal('#ffb86c');

  constructor() {
    this.reset();
  }

  reset(): void {
    const c = this.company();
    this.companyName.set(c?.name ?? '');
    this.logo.set(c?.logo ?? '');
    this.primaryColor.set(c?.primaryColor ?? '#88ffb6');
    this.secondaryColor.set(c?.secondaryColor ?? '#ffb86c');
  }

  onPrimaryColorChange(value: string): void {
    const hex = this.normalizeHex(value);
    if (hex) this.primaryColor.set(hex);
  }

  onSecondaryColorChange(value: string): void {
    const hex = this.normalizeHex(value);
    if (hex) this.secondaryColor.set(hex);
  }

  save(): void {
    const companyId = this.company()?.id;
    if (!companyId) {
      this.notifications.error('No company selected');
      return;
    }

    this.saving.set(true);
    this.api.patch(`companies/${companyId}`, {
      name: this.companyName().trim(),
      logo: this.logo().trim() || null,
      primaryColor: this.primaryColor().trim(),
      secondaryColor: this.secondaryColor().trim(),
    }).subscribe({
      next: () => {
        this.notifications.success('Brand kit saved');
        this.saving.set(false);
      },
      error: () => {
        this.notifications.error('Failed to save brand kit');
        this.saving.set(false);
      },
    });
  }

  private normalizeHex(value: string): string {
    const v = (value ?? '').trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v;
    if (/^[0-9A-Fa-f]{6}$/.test(v)) return `#${v}`;
    return '';
  }
}

