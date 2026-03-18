import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

const STORAGE_KEY = 'dark_culinary_pending_order';

/** Holds at most one order when placed offline; syncs when back online to prevent duplicate submissions. */
@Injectable({
  providedIn: 'root',
})
export class PendingOrderService {
  private readonly api = inject(ApiService);
  private readonly syncDoneSubject = new Subject<void>();
  /** Emits after a pending order was successfully sent (e.g. orders page can refresh). */
  readonly syncDone$ = this.syncDoneSubject.asObservable();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.trySync());
    }
  }

  isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine === true;
  }

  getPendingOrder(): Record<string, unknown> | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return parsed && typeof parsed['customerSessionId'] === 'string' && Array.isArray(parsed['items'])
        ? parsed
        : null;
    } catch {
      return null;
    }
  }

  hasPendingOrder(): boolean {
    return this.getPendingOrder() !== null;
  }

  setPendingOrder(payload: Record<string, unknown>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save pending order', e);
    }
  }

  clearPendingOrder(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  trySync(): void {
    if (!this.isOnline()) return;
    const pending = this.getPendingOrder();
    if (!pending) return;

    this.api.post<unknown>('customer-orders', pending).subscribe({
      next: () => {
        this.clearPendingOrder();
        this.syncDoneSubject.next();
      },
      error: (err) => {
        if (err?.status >= 400 && err?.status < 500) {
          this.clearPendingOrder();
        }
      },
    });
  }
}
