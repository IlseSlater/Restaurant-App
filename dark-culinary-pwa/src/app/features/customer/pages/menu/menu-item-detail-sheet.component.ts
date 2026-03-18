import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem } from '../../../../core/models/menu.model';
import { CustomerCartService } from '../../services/customer-cart.service';
import { HapticService } from '../../../../core/services/haptic.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AppCurrencyPipe } from '../../../../core/pipes/app-currency.pipe';

@Component({
  selector: 'app-menu-item-detail-sheet',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    AppCurrencyPipe,
  ],
  template: `
    <div class="sheet">
      <div class="handle" aria-hidden="true"></div>
      @if (item(); as i) {
        <div class="header">
          @if (i.imageUrl) {
            <img [src]="i.imageUrl" [alt]="i.name" class="img" />
          }
          <h2>{{ i.name }}</h2>
          <p class="desc">{{ i.description }}</p>
          <div class="price">{{ i.price | appCurrency }}</div>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Special instructions</mat-label>
          <textarea matInput [(ngModel)]="notes" rows="2"></textarea>
        </mat-form-field>
        <div class="qty-row">
          <span>Quantity</span>
          <div class="stepper">
            <button mat-icon-button type="button" (click)="changeQty(-1)" [disabled]="quantity() <= 1">
              <mat-icon>remove</mat-icon>
            </button>
            <span class="num">{{ quantity() }}</span>
            <button mat-icon-button type="button" (click)="changeQty(1)">
              <mat-icon>add</mat-icon>
            </button>
          </div>
        </div>
        <button mat-flat-button color="primary" class="add-btn" (click)="addToCart()">
          Add {{ quantity() }} for
          {{
            (item()?.price ?? 0) * quantity() | appCurrency
          }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .sheet {
        padding: 1.25rem;
        max-width: 400px;
        background-color: var(--bg-sheet);
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        border-top: 1px solid var(--border-subtle);
        box-shadow: var(--shadow-lg);
        backdrop-filter: blur(18px);
      }
      .handle {
        width: 40px;
        height: 4px;
        background: var(--text-muted);
        border-radius: 2px;
        margin: 0 auto 1rem;
        opacity: 0.6;
      }
      .header { margin-bottom: 1rem; }
      .img { width: 100%; height: 180px; object-fit: cover; border-radius: var(--radius-md); }
      .header h2 { margin: 0.5rem 0 0.25rem; }
      .desc { margin: 0; color: var(--text-secondary); font-size: 0.9rem; }
      .price { font-size: 1.25rem; font-weight: 600; color: var(--accent-primary); margin-top: 0.5rem; }
      .full-width { width: 100%; }
      .qty-row { display: flex; align-items: center; justify-content: space-between; margin: 1rem 0; }
      .stepper {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.75rem;
        border-radius: var(--radius-pill);
        border: 1px solid var(--border-subtle);
        background-color: var(--bg-elevated);
      }
      .num { min-width: 2rem; text-align: center; }
      .add-btn { width: 100%; margin-top: 0.5rem; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItemDetailSheetComponent {
  readonly data = inject<{ item: MenuItem }>(MAT_BOTTOM_SHEET_DATA);
  private readonly ref = inject(MatBottomSheetRef<MenuItemDetailSheetComponent>);
  private readonly cart = inject(CustomerCartService);
  private readonly haptics = inject(HapticService);
  private readonly notifications = inject(NotificationService);

  item = signal<MenuItem | null>(this.data?.item ?? null);
  quantity = signal(1);
  notes = '';

  changeQty(delta: number): void {
    this.quantity.update((q) => Math.max(1, q + delta));
  }

  addToCart(): void {
    const i = this.item();
    if (!i) return;
    const qty = this.quantity();
    for (let k = 0; k < qty; k++) {
      this.cart.addItem(i, this.notes.trim() || undefined);
    }
    this.haptics.thumpShort();
    this.notifications.success('Added to cart');
    this.ref.dismiss();
  }
}
