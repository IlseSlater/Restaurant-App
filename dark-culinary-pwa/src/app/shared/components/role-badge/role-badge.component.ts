import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-role-badge',
  standalone: true,
  template: ` <span class="badge" [ngClass]="role.toLowerCase()">{{ role }}</span> `,
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
      .waiter {
        background-color: var(--status-info-soft);
        color: var(--status-info);
      }
      .chef,
      .kitchen {
        background-color: var(--status-warning-soft);
        color: var(--status-warning);
      }
      .bar {
        background-color: var(--status-success-soft);
        color: var(--status-success);
      }
      .admin,
      .manager {
        background-color: var(--accent-primary-soft);
        color: var(--accent-primary);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleBadgeComponent {
  @Input() role = '';
}

