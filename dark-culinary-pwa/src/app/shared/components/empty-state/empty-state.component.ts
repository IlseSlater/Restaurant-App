import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="empty">
      @if (icon) {
        <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      }
      @if (title) {
        <h3 class="empty-title">{{ title }}</h3>
      }
      @if (description) {
        <p class="empty-description">
          {{ description }}
        </p>
      }
      <ng-content />
    </div>
  `,
  styles: [
    `
      .empty {
        text-align: center;
        padding: var(--space-5);
        border-radius: var(--radius-lg);
        border: 1px dashed var(--border-subtle);
        background-color: var(--bg-elevated);
      }
      .empty-icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
        color: var(--accent-primary);
        margin-bottom: var(--space-2);
      }
      .empty-title {
        margin: 0 0 var(--space-1);
        font-size: 1.1rem;
        font-weight: 600;
      }
      .empty-description {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-secondary);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  @Input() icon?: string;
  @Input() title?: string;
  @Input() description?: string;
}

