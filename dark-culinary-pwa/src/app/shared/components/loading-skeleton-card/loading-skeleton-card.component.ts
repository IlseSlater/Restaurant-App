import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-loading-skeleton-card',
  standalone: true,
  imports: [SkeletonLoaderComponent],
  template: `
    <div class="loading-card">
      <app-skeleton-loader [height]="height"></app-skeleton-loader>
    </div>
  `,
  styles: [
    `
      .loading-card {
        border-radius: var(--radius-lg);
        background-color: var(--bg-glass);
        border: 1px solid var(--border-subtle);
        padding: var(--space-3);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSkeletonCardComponent {
  @Input() height = 80;
}

