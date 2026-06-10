import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const READY_POLL_MS = 5_000;
const READY_TIMEOUT_MS = 120_000;

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly swUpdate = inject(SwUpdate);

  readonly updateAvailable = signal(false);
  readonly checking = signal(false);

  private listening = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupWhenReady();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          void this.checkForUpdate();
        }
      });
    }
  }

  async checkForUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled || this.checking()) return;
    this.checking.set(true);
    try {
      await this.swUpdate.checkForUpdate();
    } catch {
      // Ignore network or SW registration errors.
    } finally {
      this.checking.set(false);
    }
  }

  async applyUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) return;
    await this.swUpdate.activateUpdate();
    document.location.reload();
  }

  dismiss(): void {
    this.updateAvailable.set(false);
  }

  private setupWhenReady(): void {
    const attach = (): boolean => {
      if (!this.swUpdate.isEnabled) return false;
      if (!this.listening) {
        this.listening = true;
        this.listen();
        void this.checkForUpdate();
        setInterval(() => void this.checkForUpdate(), CHECK_INTERVAL_MS);
      }
      return true;
    };

    if (attach()) return;

    const started = Date.now();
    const readyPoll = setInterval(() => {
      if (attach() || Date.now() - started > READY_TIMEOUT_MS) {
        clearInterval(readyPoll);
      }
    }, READY_POLL_MS);
  }

  private listen(): void {
    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => this.updateAvailable.set(true));

    this.swUpdate.unrecoverable.subscribe(() => {
      document.location.reload();
    });
  }
}
