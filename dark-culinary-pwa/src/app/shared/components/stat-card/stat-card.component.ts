import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="stat-card">
      <div class="icon-wrap" [style.background]="iconBgColor" [style.color]="iconColor">
        <mat-icon [fontIcon]="icon" />
      </div>
      <div class="content">
        <span class="value">{{ value }}</span>
        <span class="label">{{ label }}</span>
        @if (trend !== undefined && trend !== null) {
          <span class="trend" [class.trend-up]="trend > 0" [class.trend-down]="trend < 0">
            <mat-icon [fontIcon]="trend >= 0 ? 'trending_up' : 'trending_down'" />
            {{ trend >= 0 ? '+' : '' }}{{ trend }}%
          </span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .stat-card {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1.25rem;
        border-radius: 16px;
        background: var(--bg-glass);
        border: 1px solid var(--border-subtle);
        backdrop-filter: blur(16px);
      }

      .icon-wrap {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .icon-wrap mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;
      }

      .value {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.2;
      }

      .label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .trend {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
        margin-top: 0.25rem;
      }

      .trend mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .trend-up {
        color: var(--status-success);
      }

      .trend-down {
        color: var(--status-error);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  @Input() icon = 'analytics';
  @Input() iconColor = 'var(--accent-primary)';
  @Input() iconBgColor = 'var(--accent-primary-soft, rgba(136, 255, 182, 0.2))';
  @Input() label = '';
  @Input() value: string | number = '—';
  @Input() trend?: number;
}
