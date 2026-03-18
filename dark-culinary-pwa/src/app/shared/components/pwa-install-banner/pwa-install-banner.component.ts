import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PwaInstallService } from '../../../core/services/pwa-install.service';

@Component({
  selector: 'app-pwa-install-banner',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (pwa.canInstall() && !pwa.isStandalone && !pwa.dismissed()) {
      <div class="banner" role="region" aria-label="Install app">
        <span class="text">Install Dark Culinary for a better experience</span>
        <div class="actions">
          <button mat-flat-button color="primary" (click)="install()">
            Install
          </button>
          <button mat-icon-button type="button" (click)="dismiss()" aria-label="Dismiss">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
        background: var(--bg-glass, rgba(22, 24, 32, 0.95));
        backdrop-filter: blur(12px);
        border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
        box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.3);
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
    `,
  ],
})
export class PwaInstallBannerComponent {
  readonly pwa = inject(PwaInstallService);

  async install(): Promise<void> {
    await this.pwa.prompt();
  }

  dismiss(): void {
    this.pwa.dismiss();
  }
}
