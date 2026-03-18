import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HapticService {
  private get navigatorVibrate(): ((pattern: number | number[]) => boolean) | null {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      return (navigator as Navigator & { vibrate: (pattern: number | number[]) => boolean }).vibrate.bind(navigator);
    }
    return null;
  }

  thumpShort(): void {
    this.vibrate(15);
  }

  doublePulse(): void {
    this.vibrate([20, 60, 20]);
  }

  longPulse(): void {
    this.vibrate(80);
  }

  private vibrate(pattern: number | number[]): void {
    const vibrateFn = this.navigatorVibrate;
    if (!vibrateFn) {
      return;
    }
    try {
      vibrateFn(pattern);
    } catch {
      // ignore
    }
  }
}

