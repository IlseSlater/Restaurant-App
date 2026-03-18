import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: ` <span class="badge" [ngClass]="status.toLowerCase()">{{ status }}</span> `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.15rem 0.5rem;
        border-radius: var(--radius-pill);
        font-size: 0.75rem;
        font-weight: 500;
      }
      .available {
        background-color: var(--status-success-soft);
        color: var(--status-success);
      }
      .occupied {
        background-color: var(--status-warning-soft);
        color: var(--status-warning);
      }
      .cleaning {
        background-color: var(--status-info-soft);
        color: var(--status-info);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  @Input() status = '';
}

