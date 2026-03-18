import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { CustomerMenuService } from '../../services/customer-menu.service';
import { CustomerCartService } from '../../services/customer-cart.service';
import { CustomerSessionService } from '../../services/customer-session.service';
import { CustomerHelpService } from '../../services/customer-help.service';
import { HapticService } from '../../../../core/services/haptic.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiService } from '../../../../core/services/api.service';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TopAppBarComponent } from '../../../../shared/components/top-app-bar/top-app-bar.component';
import { GlassCardComponent } from '../../../../shared/components/glass-card/glass-card.component';
import { MenuItem } from '../../../../core/models/menu.model';
import { MenuItemDetailSheetComponent } from './menu-item-detail-sheet.component';
import { ItemConfiguratorComponent } from '../../components/item-configurator/item-configurator.component';
import type { MenuItemConfiguration } from '../../../../core/models/modifier.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PressEffectDirective } from '../../../../shared/directives/press-effect.directive';
import { AppCurrencyPipe } from '../../../../core/pipes/app-currency.pipe';

@Component({
  selector: 'app-customer-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    SkeletonLoaderComponent,
    TopAppBarComponent,
    GlassCardComponent,
    PressEffectDirective,
    EmptyStateComponent,
    AppCurrencyPipe,
  ],
  template: `
    <div class="menu">
      <div class="menu-header">
        <app-top-app-bar
          [title]="appBarTitle()"
          [showBack]="true"
          [actions]="menuActions()"
          (back)="goBack()"
          (actionClick)="onActionClick($event)"
        />
        <div class="category-tabs">
          @for (cat of categories(); track cat) {
            <button
              mat-button
              [class.active]="selectedCategory() === cat"
              (click)="selectCategory(cat)"
            >
              {{ cat === 'ALL' ? 'All' : cat }}
            </button>
          }
        </div>
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <mat-label>Search dishes, ingredients, or tags</mat-label>
          <input matInput [value]="searchQuery()" (input)="onSearch($event)" />
        </mat-form-field>
      </div>
      <div class="menu-header-spacer" aria-hidden="true"></div>
      @if (loading()) {
        <div class="grid">
          @for (i of [1,2,3,4,5,6]; track i) {
            <app-skeleton-loader [height]="120" />
          }
        </div>
      } @else {
        @if (filteredMenu$ | async; as items) {
          @if (items.length === 0) {
            <app-empty-state
              icon="search_off"
              title="No dishes match your search"
              description="Try a different keyword or clear your filters."
            />
          } @else {
            <div class="grid">
              @for (item of items; track item.id) {
            <app-glass-card [class.unavailable]="!item.isAvailable">
              <div
                class="card"
                [class.card-unavailable]="!item.isAvailable"
                (click)="item.isAvailable && openDetail(item)"
                appPressEffect
              >
                @if (item.imageUrl) {
                  <img [src]="item.imageUrl" [alt]="item.name" class="thumb" />
                } @else {
                  <div class="thumb thumb-placeholder">
                    <mat-icon>restaurant</mat-icon>
                  </div>
                }
                <div class="card-body">
                  <h2>{{ item.name }}</h2>
                  <p class="desc">{{ item.description }}</p>
                  <div class="meta">
                    <span class="price">{{ item.price | appCurrency }}</span>
                    @if (!item.isAvailable) {
                      <span class="not-available-label">Not available</span>
                    }
                  </div>
                  @if (item.isAvailable) {
                    <button
                      mat-fab
                      color="primary"
                      class="add-fab"
                      (click)="addOne($event, item)"
                      aria-label="Add to cart"
                    >
                      <mat-icon>add</mat-icon>
                    </button>
                  }
                </div>
              </div>
            </app-glass-card>
              }
            </div>
          }
        }
      }
    </div>
  `,
  styles: [
    `
      .menu {
        padding: 0 0 0.75rem;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      .menu-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        padding-bottom: 0rem;
        margin: 0;
        padding-left: 1rem;
        padding-right: 1rem;
        background: var(--bg-canvas);
        border-bottom: 1px solid var(--border-subtle);
      }
      .menu-header-spacer {
        height: 13.5rem;
        flex-shrink: 0;
      }
      .category-tabs {
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem 0 0.75rem;
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
        scroll-snap-type: x proximity;
        scrollbar-width: none;
      }
      .category-tabs::-webkit-scrollbar {
        display: none;
      }
      .category-tabs button {
        flex-shrink: 0;
        scroll-snap-align: start;
        min-height: 44px;
        min-width: 44px;
        padding: 0 1rem;
        border-radius: var(--radius-pill);
        border: 1px solid var(--border-subtle);
        background: var(--bg-elevated);
        color: var(--text-secondary);
        font-size: 0.875rem;
        font-weight: 500;
        transition: color 200ms ease, border-color 200ms ease, background-color 200ms ease,
          box-shadow 200ms ease;
      }
      .category-tabs button:hover {
        color: var(--text-primary);
        border-color: var(--accent-border);
        background: var(--bg-glass);
      }
      .category-tabs button.active {
        color: var(--text-inverse);
        background: var(--accent-primary);
        border-color: var(--accent-primary);
      }
      .search-field { width: 100%; padding: 0; margin-top: 0.25rem; }
      .grid {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        padding: 0 0.5rem;
      }
      @media (min-width: 600px) {
        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (min-width: 1024px) {
        .grid {
          grid-template-columns: repeat(3, 1fr);
          max-width: 1200px;
          margin: 0 auto;
        }
      }
      .card {
        display: flex;
        gap: 1rem;
        text-align: left;
        cursor: pointer;
        padding: 0.25rem 0;
      }
      .card.card-unavailable {
        cursor: default;
        opacity: 0.7;
      }
      .card.card-unavailable .card-body h2,
      .card.card-unavailable .card-body .desc,
      .card.card-unavailable .card-body .price {
        color: var(--text-muted);
      }
      .thumb {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 12px;
      }
      .thumb-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
  background-color: var(--border-subtle);
  border: 1px solid var(--border-subtle);
}
      .thumb-placeholder mat-icon {
        color: var(--accent-secondary);
      }
      .card-body {
        flex: 1;
        position: relative;
        padding-bottom: 0.5rem;
      }
      .card-body h2 { margin: 0 0 0.25rem; font-size: 1.1rem; }
      .desc {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-secondary);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.5rem;
      }
      .price { font-weight: 600; color: var(--accent-primary); }
      .not-available-label {
        font-size: 0.85rem;
        color: var(--text-muted);
        font-weight: 500;
      }
      .add-fab {
        position: absolute;
        bottom: 0;
        right: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage {
  private readonly router = inject(Router);
  private readonly menuService = inject(CustomerMenuService);
  private readonly cartService = inject(CustomerCartService);
  private readonly sessionService = inject(CustomerSessionService);
  private readonly helpService = inject(CustomerHelpService);
  private readonly haptics = inject(HapticService);
  private readonly notifications = inject(NotificationService);
  private readonly api = inject(ApiService);
  private readonly bottomSheet = inject(MatBottomSheet);

  readonly loading = signal(true);
  readonly appBarTitle = signal('Menu');
  readonly selectedCategory = signal('ALL');
  readonly searchQuery = signal('');
  readonly categories = signal<string[]>(['ALL']);
  readonly filteredMenu$ = this.menuService.filteredMenu$;

  menuActions = computed(() => {
    const count = this.cartItemCount();
    return [
      { icon: 'support_agent', id: 'help' },
      { icon: 'shopping_cart', id: 'cart', badge: count > 0 ? count : undefined },
    ];
  });

  private cartItemCount = signal(0);

  constructor() {
    this.menuService.menu$.subscribe((items) => {
      this.loading.set(false);
      if (items?.length) {
        this.categories.set(this.menuService.getCategories(items));
      }
    });
    this.cartService.items$.subscribe((items) => {
      this.cartItemCount.set(items.reduce((s, i) => s + i.quantity, 0));
    });
    this.sessionService.currentSession$.subscribe((session) => {
      if (session?.companyId) {
        this.api.get<{ name?: string }>(`companies/${session.companyId}`).subscribe({
          next: (c) => this.appBarTitle.set(c?.name ?? 'Menu'),
        });
      }
    });
  }

  goBack(): void {
    void this.router.navigate(['/customer/welcome']);
  }

  onActionClick(action: { id?: string }): void {
    if (action.id === 'help') {
      const session = this.sessionService.currentSessionSnapshot;
      if (session) {
        this.helpService.openHelpSheet({
          tableId: session.tableId,
          customerSessionId: session.id,
        });
      }
    } else if (action.id === 'cart') {
      void this.router.navigate(['/customer/cart']);
    }
  }

  selectCategory(cat: string): void {
    this.selectedCategory.set(cat);
    this.menuService.setCategory(cat);
  }

  onSearch(e: Event): void {
    const q = (e.target as HTMLInputElement)?.value ?? '';
    this.searchQuery.set(q);
    this.menuService.setSearchQuery(q);
  }

  openDetail(item: MenuItem): void {
    if (!item.isAvailable) return;
    this.api.getMenuItemConfiguration(item.id).subscribe({
      next: (config: MenuItemConfiguration) => {
        const hasConfig = (config.modifierGroups?.length ?? 0) > 0 || (config.bundleSlots?.length ?? 0) > 0;
        if (hasConfig) {
          this.bottomSheet.open(ItemConfiguratorComponent, {
            data: { item, configuration: config },
            panelClass: 'dc-item-detail-sheet',
          });
        } else {
          this.bottomSheet.open(MenuItemDetailSheetComponent, {
            data: { item },
            panelClass: 'dc-item-detail-sheet',
          });
        }
      },
      error: () => {
        this.bottomSheet.open(MenuItemDetailSheetComponent, {
          data: { item },
          panelClass: 'dc-item-detail-sheet',
        });
      },
    });
  }

  addOne(event: Event, item: MenuItem): void {
    event.stopPropagation();
    if (!item.isAvailable) return;
    this.api.getMenuItemConfiguration(item.id).subscribe({
      next: (config: MenuItemConfiguration) => {
        const hasConfig = (config.modifierGroups?.length ?? 0) > 0 || (config.bundleSlots?.length ?? 0) > 0;
        if (hasConfig) {
          this.bottomSheet.open(ItemConfiguratorComponent, {
            data: { item, configuration: config },
            panelClass: 'dc-item-detail-sheet',
          });
        } else {
          this.cartService.addItem(item);
          this.haptics.thumpShort();
          this.notifications.success('Added to cart');
        }
      },
      error: () => {
        this.cartService.addItem(item);
        this.haptics.thumpShort();
        this.notifications.success('Added to cart');
      },
    });
  }
}
