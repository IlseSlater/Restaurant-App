import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { map, of, switchMap, timer } from 'rxjs';
import { CustomerEscalationService } from '../../../features/customer/services/customer-escalation.service';

@Component({
  selector: 'app-bottom-sheet-help',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div class="sheet">
      <h2>Call for help</h2>
      <p>Select who you’d like to speak to.</p>

      @if (pendingWaiterCall$ | async; as waiter) {
        <button type="button" class="status-row" (click)="cancelWaiter.emit(waiter.id)" aria-live="polite">
          <span class="status-label">{{ waiter.status === 'ACKNOWLEDGED' ? 'On the way' : 'Waiter requested' }}</span>
          <span class="status-time">{{ waiter.status === 'ACKNOWLEDGED' ? '' : (waiterTimeAgo$ | async) }}</span>
          <span class="status-hint">Tap to cancel</span>
        </button>
      } @else {
        <button type="button" (click)="requestWaiter.emit()">Request Waiter</button>
      }

      @if (pendingManagerCall$ | async; as manager) {
        <button type="button" class="status-row status-row-manager" (click)="cancelManager.emit(manager.id)" aria-live="polite">
          <span class="status-label">{{ manager.status === 'ACKNOWLEDGED' ? 'On the way' : 'Manager requested' }}</span>
          <span class="status-time">{{ manager.status === 'ACKNOWLEDGED' ? '' : (managerTimeAgo$ | async) }}</span>
          <span class="status-hint">Tap to cancel</span>
        </button>
      } @else {
        <button type="button" class="manager" (click)="speakToManager.emit()">Speak to Manager</button>
      }
    </div>
  `,
  styles: [
    `
      .sheet {
        padding: 1.25rem;
      }
      h2 {
        margin: 0 0 0.5rem;
      }
      p {
        margin: 0 0 1rem;
      }
      button {
        width: 100%;
        border-radius: 999px;
        padding: 0.75rem 1.25rem;
        border: none;
        background-color: var(--accent-primary);
        color: var(--text-inverse);
        font-size: 1rem;
        margin-bottom: 0.5rem;
        cursor: pointer;
        transition: background-color 200ms ease, color 200ms ease, box-shadow 200ms ease,
          transform 150ms ease;
        box-shadow: var(--shadow-sm);
      }
      button:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
      }
      button:active {
        transform: scale(0.98);
      }
      .manager {
        background-color: transparent;
        border: 1px solid var(--accent-secondary);
        color: var(--accent-secondary);
      }
      .status-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 0.25rem;
        width: 100%;
        padding: 0.75rem 1.25rem;
        margin-bottom: 0.5rem;
        border-radius: 999px;
        border: none;
        background-color: var(--status-warning-soft);
        color: var(--status-warning);
        font-size: 0.95rem;
        cursor: pointer;
        transition: background-color 200ms ease, transform 150ms ease;
      }
      .status-row:hover {
        transform: translateY(-1px);
      }
      .status-row-manager {
        background-color: var(--status-info-soft);
        color: var(--status-info);
      }
      .status-label {
        font-weight: 600;
      }
      .status-time {
        font-size: 0.85rem;
        opacity: 0.95;
      }
      .status-hint {
        width: 100%;
        font-size: 0.75rem;
        opacity: 0.8;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomSheetHelpComponent {
  private readonly escalation = inject(CustomerEscalationService);

  @Output() requestWaiter = new EventEmitter<void>();
  @Output() speakToManager = new EventEmitter<void>();
  @Output() cancelWaiter = new EventEmitter<string>();
  @Output() cancelManager = new EventEmitter<string>();

  readonly pendingWaiterCall$ = this.escalation.pendingWaiterCall$;
  readonly pendingManagerCall$ = this.escalation.pendingManagerCall$;

  /** Time-ago string for waiter request, updates every minute. */
  readonly waiterTimeAgo$: Observable<string> = this.pendingWaiterCall$.pipe(
    switchMap((call) =>
      call
        ? timer(0, 60000).pipe(
            map(() => CustomerEscalationService.timeAgo(call.createdAt)),
          )
        : of(''),
    ),
  );

  /** Time-ago string for manager request, updates every minute. */
  readonly managerTimeAgo$: Observable<string> = this.pendingManagerCall$.pipe(
    switchMap((call) =>
      call
        ? timer(0, 60000).pipe(
            map(() => CustomerEscalationService.timeAgo(call.createdAt)),
          )
        : of(''),
    ),
  );
}

