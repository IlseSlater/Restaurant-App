import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="chip" [ngClass]="status.toLowerCase()">
      <ng-content></ng-content>
    </span>
  `,
  styles: [
    `
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.15rem 0.5rem;
        border-radius: var(--radius-pill);
        font-size: 0.75rem;
        font-weight: 500;
      }
      .pending {
        background-color: var(--accent-secondary);
        color: var(--text-inverse);
      }
      .preparing {
        background-color: var(--status-warning);
        color: var(--text-inverse);
      }
      .ready {
        background-color: var(--status-success);
        color: var(--text-inverse);
      }
      .served,
      .delivered {
        background-color: var(--status-success);
        color: var(--text-inverse);
      }
      .confirmed {
        background-color: var(--status-info-soft);
        color: var(--status-info);
      }
      .cancelled {
        background-color: transparent;
        border: 1px solid var(--status-error);
        color: var(--status-error);
      }
      .collected {
        background-color: var(--status-success-soft);
        color: var(--status-success);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusChipComponent {
  @Input() status = '';
}

