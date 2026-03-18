import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AppCurrencyPipe } from '../../../core/pipes/app-currency.pipe';

@Component({
  selector: 'app-floating-cart-chip',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, AppCurrencyPipe],
  template: `
    @if (itemCount > 0) {
      <button
        class="chip"
        type="button"
        (click)="click.emit()"
        [attr.aria-label]="itemCount + ' items in cart, ' + (total | appCurrency)"
      >
        <mat-icon>shopping_cart</mat-icon>
        <span class="label">{{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }}</span>
        <span class="total">{{ total | appCurrency }}</span>
        <mat-icon class="chevron">chevron_right</mat-icon>
      </button>
    }
  `,
  styles: [
    `
      .chip {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1rem;
        border-radius: 999px;
        border: 1px solid var(--border-subtle);
        background-color: var(--bg-glass);
        backdrop-filter: blur(16px);
        color: var(--text-primary);
        font-size: 0.95rem;
        box-shadow: var(--shadow-md);
        cursor: pointer;
        animation: dc-fade-in-up 180ms ease-out;
      }
      .chip:hover {
        background-color: var(--bg-elevated);
      }
      .label {
        flex: 1;
        text-align: left;
      }
      .total {
        font-weight: 600;
        color: var(--accent-primary);
      }
      .chevron {
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingCartChipComponent {
  @Input() itemCount = 0;
  @Input() total = 0;

  @Output() click = new EventEmitter<void>();
}
