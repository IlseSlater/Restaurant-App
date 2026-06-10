import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaInstallBannerComponent } from './shared/components/pwa-install-banner/pwa-install-banner.component';
import { PwaUpdateBannerComponent } from './shared/components/pwa-update-banner/pwa-update-banner.component';
import { PwaUpdateService } from './core/services/pwa-update.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PwaInstallBannerComponent, PwaUpdateBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  /** Eagerly start listening for service-worker updates in production builds. */
  private readonly _pwaUpdates = inject(PwaUpdateService);
}
