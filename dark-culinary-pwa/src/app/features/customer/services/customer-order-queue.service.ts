import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { StorageService } from '../../../core/services/storage.service';
import { NotificationService } from '../../../core/services/notification.service';

interface QueuedOrderPayload {
  customerSessionId: string;
  tableId: string;
  serviceFeePercentage: number;
  items: Array<{
    menuItemId: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
  }>;
}

const QUEUE_KEY = 'dark_culinary_offline_orders';

@Injectable({
  providedIn: 'root',
})
export class CustomerOrderQueueService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly notifications = inject(NotificationService);

  private flushing = false;
  private onlineListenerAttached = false;

  constructor() {
    if (typeof window !== 'undefined' && !this.onlineListenerAttached) {
      window.addEventListener('online', () => this.tryFlush());
      this.onlineListenerAttached = true;
    }
    // Attempt an initial flush on startup in case there are pending orders.
    this.tryFlush();
  }

  queueOrder(payload: QueuedOrderPayload): void {
    const current = this.load();
    current.push(payload);
    this.save(current);
    this.tryFlush();
  }

  private tryFlush(): void {
    if (this.flushing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }
    const queue = this.load();
    if (!queue.length) return;

    this.flushing = true;
    const [next, ...rest] = queue;
    this.api.post('customer-orders', next).subscribe({
      next: () => {
        this.save(rest);
        this.flushing = false;
        this.notifications.success('Your pending order was sent once you were back online.');
        // Try to flush any remaining orders.
        if (rest.length) {
          this.tryFlush();
        }
      },
      error: () => {
        // Keep the order in the queue and stop flushing for now.
        this.flushing = false;
      },
    });
  }

  private load(): QueuedOrderPayload[] {
    return this.storage.get<QueuedOrderPayload[]>(QUEUE_KEY) ?? [];
  }

  private save(queue: QueuedOrderPayload[]): void {
    this.storage.set(QUEUE_KEY, queue);
  }
}

