import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ThemeService } from '../../../../core/services/theme.service';
import { ApiService } from '../../../../core/services/api.service';
import { CompanyContextService } from '../../../../core/services/company-context.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-theme-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="theme-editor-panel" [class.open]="open">
      <div class="panel-header">
        <h3>Theme settings</h3>
        <button mat-icon-button type="button" (click)="close()" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="panel-body">
        <p class="hint">Changes apply instantly. Save to persist for this restaurant.</p>

        <div class="field">
          <label>Primary accent</label>
          <div class="color-row">
            <input type="color" [value]="primaryHex()" (input)="onPrimaryChange($any($event.target).value)" class="color-input" />
            <input matInput type="text" [ngModel]="primaryHex()" (ngModelChange)="onPrimaryChange($event)" class="color-text" />
          </div>
        </div>
        <div class="field">
          <label>Secondary accent</label>
          <div class="color-row">
            <input type="color" [value]="secondaryHex()" (input)="onSecondaryChange($any($event.target).value)" class="color-input" />
            <input matInput type="text" [ngModel]="secondaryHex()" (ngModelChange)="onSecondaryChange($event)" class="color-text" />
          </div>
        </div>
        <div class="field">
          <label>Tertiary accent</label>
          <div class="color-row">
            <input type="color" [value]="tertiaryHex()" (input)="onTertiaryChange($any($event.target).value)" class="color-input" />
            <input matInput type="text" [ngModel]="tertiaryHex()" (ngModelChange)="onTertiaryChange($event)" class="color-text" />
          </div>
        </div>

        <div class="actions">
          <button mat-stroked-button type="button" (click)="reset()">Reset to defaults</button>
          <button mat-flat-button color="primary" type="button" (click)="save()" [disabled]="saving()">
            {{ saving() ? 'Saving…' : 'Save theme' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .theme-editor-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 320px;
        max-width: 100%;
        height: 100%;
        background: var(--bg-elevated);
        border-left: 1px solid var(--border-subtle);
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        transition: transform 0.2s ease;
      }

      .theme-editor-panel.open {
        transform: translateX(0);
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--border-subtle);
      }

      .panel-header h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
      }

      .panel-body {
        padding: 1.25rem;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .hint {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--text-secondary);
      }

      .field label {
        display: block;
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 0.375rem;
      }

      .color-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .color-input {
        width: 48px;
        height: 40px;
        padding: 2px;
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        background: var(--bg-canvas);
        cursor: pointer;
      }

      .color-text {
        flex: 1;
        font-family: monospace;
        font-size: 0.875rem;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeEditorComponent {
  private readonly theme = inject(ThemeService);
  private readonly api = inject(ApiService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly notification = inject(NotificationService);

  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();

  readonly saving = signal(false);

  readonly company = toSignal(this.companyContext.currentCompany$, { initialValue: null });
  readonly primaryHex = signal(this.theme.accentPrimary());
  readonly secondaryHex = signal(this.theme.accentSecondary());
  readonly tertiaryHex = signal(this.theme.accentTertiary());

  constructor() {
    this.primaryHex.set(this.theme.accentPrimary());
    this.secondaryHex.set(this.theme.accentSecondary());
    this.tertiaryHex.set(this.theme.accentTertiary());
  }

  close(): void {
    this.openChange.emit(false);
  }

  onPrimaryChange(value: string): void {
    const hex = this.normalizeHex(value);
    if (hex) {
      this.primaryHex.set(hex);
      this.theme.applyCompanyTheme({ accentPrimary: hex });
    }
  }

  onSecondaryChange(value: string): void {
    const hex = this.normalizeHex(value);
    if (hex) {
      this.secondaryHex.set(hex);
      this.theme.applyCompanyTheme({ accentSecondary: hex });
    }
  }

  onTertiaryChange(value: string): void {
    const hex = this.normalizeHex(value);
    if (hex) {
      this.tertiaryHex.set(hex);
      this.theme.applyCompanyTheme({ accentTertiary: hex });
    }
  }

  reset(): void {
    this.theme.resetToDefaults();
    this.primaryHex.set(this.theme.accentPrimary());
    this.secondaryHex.set(this.theme.accentSecondary());
    this.tertiaryHex.set(this.theme.accentTertiary());
    this.notification.success('Theme reset to defaults');
  }

  save(): void {
    const id = this.company()?.id;
    if (!id) {
      this.notification.error('No company selected');
      return;
    }
    this.saving.set(true);
    this.api
      .patch<unknown>(`companies/${id}`, {
        primaryColor: this.primaryHex(),
        secondaryColor: this.secondaryHex(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notification.success('Theme saved');
        },
        error: () => {
          this.saving.set(false);
          this.notification.error('Failed to save theme');
        },
      });
  }

  private normalizeHex(value: string): string {
    const v = (value || '').trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v;
    if (/^[0-9A-Fa-f]{6}$/.test(v)) return '#' + v;
    return '';
  }
}
