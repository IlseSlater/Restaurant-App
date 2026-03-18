import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { Subscription } from 'rxjs';

export interface TableActivityPayload {
  type: 'item_added';
  participantName: string;
  items: Array<{ itemName: string; quantity: number; modifiers?: string[] }>;
  orderId?: string;
  timestamp: string;
}

export interface FeedEntry {
  id: string;
  message: string;
  participantName: string;
  timestamp: string;
  expiresAt: number;
}

const AUTO_DISMISS_MS = 3000;

@Component({
  selector: 'app-social-activity-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="feed-container" aria-live="polite" aria-label="Table activity feed">
      @for (entry of entries(); track entry.id) {
        <button
          type="button"
          class="feed-item"
          (click)="dismiss(entry.id)"
          [attr.aria-label]="'Dismiss: ' + entry.message"
        >
          <span class="icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </span>
          <span class="message">{{ entry.message }}</span>
        </button>
      }
    </div>
  `,
  styles: [
    `
      .feed-container {
        position: fixed;
        top: var(--space-6);
        right: var(--space-4);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        max-width: min(320px, calc(100vw - 2rem));
        pointer-events: none;
      }
      .feed-container:has(.feed-item) {
        pointer-events: auto;
      }
      .feed-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        background: var(--bg-sheet);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        cursor: pointer;
        text-align: left;
        color: var(--text-primary);
        font-size: 0.9rem;
        animation: slideIn 0.3s ease-out;
        min-height: 44px;
      }
      .feed-item:hover {
        background: var(--bg-glass);
        border-color: var(--accent-border);
      }
      .feed-item .icon {
        flex-shrink: 0;
        color: var(--accent-primary);
      }
      .feed-item .message {
        flex: 1;
      }
      @media (max-width: 599px) {
        .feed-container {
          top: auto;
          bottom: calc(60px + var(--space-4));
          right: var(--space-4);
          left: var(--space-4);
          max-width: none;
        }
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(1rem);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialActivityFeedComponent implements OnInit, OnDestroy {
  private readonly ws = inject(WebSocketService);
  private sub: Subscription | null = null;
  private dismissTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  readonly entries = signal<FeedEntry[]>([]);

  ngOnInit(): void {
    this.sub = this.ws.on<TableActivityPayload>('table-activity').subscribe((payload) => {
      if (payload?.type !== 'item_added' || !payload.participantName) return;
      const items = payload.items ?? [];
      items.forEach((item) => {
        const qty = item.quantity > 1 ? `${item.quantity}x ` : '';
        const mods = (item.modifiers?.length ? ` (${item.modifiers.join(', ')})` : '');
        const message = `${payload.participantName} added ${qty}${item.itemName}${mods}`;
        this.addEntry(message, payload.participantName, payload.timestamp);
      });
      if (items.length === 0) {
        this.addEntry(`${payload.participantName} placed an order`, payload.participantName, payload.timestamp);
      }
    });
  }

  private addEntry(message: string, participantName: string, timestamp: string): void {
    const id = `feed-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const expiresAt = Date.now() + AUTO_DISMISS_MS;
    this.entries.update((list) => [...list, { id, message, participantName, timestamp, expiresAt }]);
    const t = setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
    this.dismissTimeouts.set(id, t);
  }

  dismiss(id: string): void {
    const t = this.dismissTimeouts.get(id);
    if (t) {
      clearTimeout(t);
      this.dismissTimeouts.delete(id);
    }
    this.entries.update((list) => list.filter((e) => e.id !== id));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.dismissTimeouts.forEach((t) => clearTimeout(t));
    this.dismissTimeouts.clear();
  }
}
