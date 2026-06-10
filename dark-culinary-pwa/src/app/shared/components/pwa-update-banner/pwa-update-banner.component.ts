import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PwaUpdateService } from '../../../core/services/pwa-update.service';

@Component({
  selector: 'app-pwa-update-banner',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (updates.updateAvailable()) {
      <div class="banner" role="region" aria-label="App update available">
        <mat-icon class="icon" aria-hidden="true">system_update</mat-icon>
        <span class="text">A new version of Dark Culinary is available.</span>
        <div class="actions">
          <button mat-flat-button color="primary" type="button" (click)="refresh()">
            Update now
          </button>
          <button mat-button type="button" (click)="dismiss()">Later</button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        padding-top: max(0.75rem, env(safe-area-inset-top));
        background: var(--bg-glass, rgba(22, 24, 32, 0.97));
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
      }

      .icon {
        flex-shrink: 0;
        color: var(--accent-primary, #c9a227);
      }

      .text {
        font-size: 0.875rem;
        color: var(--text-primary, #f4f5f7);
        flex: 1;
        min-width: 0;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        flex-shrink: 0;
      }

      @media (max-width: 480px) {
        .banner {
          flex-wrap: wrap;
        }

        .actions {
          width: 100%;
          justify-content: flex-end;
        }
      }
    `,
  ],
})
export class PwaUpdateBannerComponent {
  readonly updates = inject(PwaUpdateService);

  refresh(): void {
    void this.updates.applyUpdate();
  }

  dismiss(): void {
    this.updates.dismiss();
  }
}
