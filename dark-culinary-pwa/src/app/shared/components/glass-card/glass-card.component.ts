import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-glass-card',
  standalone: true,
  template: `<div class="glass-card" [class.clickable]="clickable"><ng-content /></div>`,
  styles: [
    `
      .glass-card {
        background-color: var(--bg-glass);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-subtle);
        backdrop-filter: blur(16px);
        padding: 1rem;
        box-shadow: var(--shadow-sm);
        transition: transform 150ms ease, box-shadow 200ms ease, border-color 200ms ease,
          background-color 200ms ease;
      }

      .glass-card.clickable {
        cursor: pointer;
      }

      .glass-card.clickable:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--accent-border);
      }

      .glass-card.clickable:active {
        transform: scale(0.98);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlassCardComponent {
  @Input() clickable = false;
}

