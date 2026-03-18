import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Minimal type for the install prompt event (not in TS lib). */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private readonly platformId = inject(PLATFORM_ID);

  /** True when the browser has fired beforeinstallprompt (install is available). */
  readonly canInstall = signal(false);

  /** True when the user dismissed the install banner (session). */
  readonly dismissed = signal(false);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupListeners();
    }
  }

  private setupListeners(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
      this.dismissed.set(false);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.dismissed.set(true);
    });
  }

  /** Whether the app is already running as an installed PWA. */
  get isStandalone(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const nav = window.navigator as Navigator & { standalone?: boolean };
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (nav.standalone === true) ||
      (document.referrer?.startsWith('android-app://') ?? false)
    );
  }

  /** Show the native install prompt. Call when user taps "Install". */
  async prompt(): Promise<boolean> {
    if (!this.deferredPrompt) return false;
    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.canInstall.set(false);
      this.deferredPrompt = null;
      return true;
    }
    return false;
  }

  dismiss(): void {
    this.dismissed.set(true);
  }

  /** Whether to show the install banner: can install, not standalone, not dismissed. */
  get shouldShowBanner(): boolean {
    return this.canInstall() && !this.isStandalone && !this.dismissed();
  }
}
