import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  template: `<div class="skeleton" [style.height.px]="height"></div>`,
  styles: [
    `
      .skeleton {
        border-radius: var(--radius-lg);
        background: linear-gradient(
          90deg,
          var(--border-subtle) 0%,
          var(--accent-border) 50%,
          var(--border-subtle) 100%
        );
        background-size: 200% 100%;
        animation: shimmer 1.2s infinite;
      }

      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonLoaderComponent {
  @Input() height = 80;
}

