import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MenuItem } from '../../../../core/models/menu.model';
import type {
  MenuItemConfiguration,
  MenuItemModifierGroup,
  ModifierOption,
  BundleSlot,
  SelectedModifier,
  BundleChoice,
} from '../../../../core/models/modifier.model';
import { CustomerCartService } from '../../services/customer-cart.service';
import { HapticService } from '../../../../core/services/haptic.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { AppCurrencyPipe } from '../../../../core/pipes/app-currency.pipe';

export interface ItemConfiguratorData {
  item: MenuItem;
  configuration: MenuItemConfiguration;
}

@Component({
  selector: 'app-item-configurator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    AppCurrencyPipe,
  ],
  template: `
    <div class="sheet configurator">
      <div class="handle" aria-hidden="true"></div>
      @if (item(); as i) {
        <div class="header">
          <h2>{{ i.name }}</h2>
          <div class="base-price">{{ i.price | appCurrency }} base</div>
        </div>

        @for (group of modifierGroups(); track group.id) {
          <section class="modifier-section">
            <h3 class="group-label">
              {{ group.name }}
              @if (isGroupRequired(group)) {
                <span class="required-badge">Required</span>
              }
            </h3>
            @if (group.selectionType === 'SINGLE' && isSliderGroup(group)) {
              <div class="doneness-slider-wrap">
                @if (item()?.imageUrl; as img) {
                  <div class="slider-visual" [attr.data-doneness]="getSelectedDonenessKey(group)">
                    <img [src]="img" [alt]="item()?.name ?? ''" class="slider-img" />
                    <div class="slider-overlay"></div>
                  </div>
                }
                <div class="slider-segments" role="group" [attr.aria-label]="group.name">
                  @for (opt of group.options; track opt.id) {
                  <button
                    type="button"
                    class="segment"
                    [class.selected]="isOptionSelected(group.id, opt.id)"
                    [class.sold-out]="!opt.isAvailable"
                    [disabled]="!opt.isAvailable"
                    (click)="selectSingleOptionWithHaptic(group, opt)"
                    [attr.aria-label]="opt.name + (opt.isAvailable ? '' : ' (Sold out)')"
                    [attr.aria-pressed]="isOptionSelected(group.id, opt.id)"
                  >
                    {{ opt.name }}
                    @if (!opt.isAvailable) {
                      <span class="sold-out-label">Sold out</span>
                    }
                  </button>
                  }
                </div>
                @if (getSelectedOptionForGroup(group); as opt) {
                  @if (opt.priceAdjustment !== 0) {
                    <span class="slider-price">{{ opt.priceAdjustment > 0 ? '+' : '' }}{{ opt.priceAdjustment | appCurrency }}</span>
                  }
                }
              </div>
            } @else if (group.selectionType === 'SINGLE') {
              <div class="option-tiles single">
                @for (opt of group.options; track opt.id) {
                  <button
                    type="button"
                    class="tile tile-single"
                    [class.selected]="isOptionSelected(group.id, opt.id)"
                    [class.recommended]="opt.isDefault"
                    [class.sold-out]="!opt.isAvailable"
                    [disabled]="!opt.isAvailable"
                    (click)="selectSingleOption(group, opt)"
                  >
                    @if (opt.isDefault) {
                      <span class="recommended-badge">Recommended</span>
                    }
                    @if (!opt.isAvailable) {
                      <span class="sold-out-badge">Sold out</span>
                    }
                    <span class="opt-name">{{ opt.name }}</span>
                    @if (opt.priceAdjustment !== 0) {
                      <span class="opt-price">{{ opt.priceAdjustment > 0 ? '+' : '' }}{{ opt.priceAdjustment | appCurrency }}</span>
                    }
                  </button>
                }
              </div>
            } @else {
              <p class="pick-hint">Pick {{ minForGroup(group) }}{{ maxForGroup(group) ? '–' + maxForGroup(group) : '' }} of {{ group.options.length }}</p>
              <div class="option-tiles multi">
                @for (opt of group.options; track opt.id) {
                  <button
                    type="button"
                    class="tile tile-multi"
                    [class.selected]="isOptionSelected(group.id, opt.id)"
                    [class.recommended]="opt.isDefault"
                    [class.sold-out]="!opt.isAvailable"
                    [disabled]="(!canSelectMore(group) && !isOptionSelected(group.id, opt.id)) || !opt.isAvailable"
                    (click)="toggleMultiOption(group, opt)"
                  >
                    @if (opt.isDefault) {
                      <span class="recommended-badge">Recommended</span>
                    }
                    @if (!opt.isAvailable) {
                      <span class="sold-out-badge">Sold out</span>
                    }
                    <span class="opt-name">{{ opt.name }}</span>
                    @if (opt.priceAdjustment !== 0) {
                      <span class="opt-price">{{ opt.priceAdjustment > 0 ? '+' : '' }}{{ opt.priceAdjustment | appCurrency }}</span>
                    }
                  </button>
                }
              </div>
            }
          </section>
        }

        @if (bundleSlots().length > 0) {
          <section class="bundle-section">
            <h3 class="section-heading">Your choices</h3>
            @for (slot of bundleSlots(); track slot.id; let step = $index) {
              <div class="bundle-step">
                <span class="step-label">Step {{ step + 1 }}: {{ slot.name }}</span>
                <div class="bundle-tiles">
                  @for (m of slot.allowedItems; track m.id) {
                    <button
                      type="button"
                      class="tile"
                      [class.selected]="getBundleChoice(slot.id)?.chosenMenuItemId === m.id"
                      (click)="selectBundleChoice(slot, m.id, m.name)"
                    >
                      {{ m.name }}
                    </button>
                  }
                </div>
              </div>
            }
          </section>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Special instructions</mat-label>
          <textarea matInput [(ngModel)]="notes" rows="2"></textarea>
        </mat-form-field>

        <div class="qty-row">
          <span>Quantity</span>
          <div class="stepper">
            <button mat-icon-button type="button" (click)="changeQty(-1)" [disabled]="quantity() <= 1" aria-label="Decrease quantity">
              <mat-icon>remove</mat-icon>
            </button>
            <span class="num">{{ quantity() }}</span>
            <button mat-icon-button type="button" (click)="changeQty(1)" aria-label="Increase quantity">
              <mat-icon>add</mat-icon>
            </button>
          </div>
        </div>

        <div class="footer">
          <div class="price-summary">
            <span class="label">Total</span>
            <span class="amount">{{ totalPrice() | appCurrency }}</span>
          </div>
          <button
            mat-flat-button
            color="primary"
            class="add-btn"
            [disabled]="!canAdd()"
            (click)="addToCart()"
          >
            Add to table
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .sheet.configurator {
        padding: 1.25rem;
        max-width: 400px;
        margin: 0 auto;
        background: var(--bg-glass);
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        border-top: 1px solid var(--border-subtle);
        box-shadow: var(--shadow-lg);
        backdrop-filter: blur(18px);
        max-height: 85vh;
        overflow-y: auto;
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
      .header h2 { margin: 0 0 0.25rem; font-size: 1.25rem; }
      .base-price { font-size: 0.9rem; color: var(--text-secondary); }
      .modifier-section { margin-bottom: 1.25rem; }
      .group-label {
        font-size: 0.95rem;
        font-weight: 600;
        margin: 0 0 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .required-badge {
        font-size: 0.7rem;
        padding: 0.15rem 0.4rem;
        background: var(--status-warning-soft);
        color: var(--status-warning);
        border-radius: var(--radius-sm);
      }
      .pick-hint { font-size: 0.85rem; color: var(--text-muted); margin: 0 0 0.5rem; }
      .option-tiles {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .option-tiles.single .tile { min-width: 100px; }
      .tile {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 0.5rem 0.75rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-subtle);
        background: var(--bg-elevated);
        color: var(--text-primary);
        font-size: 0.9rem;
        cursor: pointer;
        transition: border-color 0.2s, background 0.2s;
      }
      .tile:hover:not(:disabled) {
        border-color: var(--accent-border);
        background: var(--bg-glass);
      }
      .tile.selected {
        border-color: var(--accent-primary);
        background: var(--accent-primary-soft);
        color: var(--accent-primary);
        transition: border-color 0.25s ease, background 0.25s ease, transform 0.2s ease;
      }
      .tile.tile-single,
      .tile.tile-multi {
        transition: border-color 0.25s ease, background 0.25s ease, transform 0.2s ease;
      }
      .tile:active:not(:disabled) {
        transform: scale(0.98);
      }
      .tile.recommended { position: relative; }
      .recommended-badge {
        position: absolute;
        top: 0.2rem;
        right: 0.35rem;
        font-size: 0.6rem;
        padding: 0.1rem 0.3rem;
        background: var(--accent-secondary);
        color: var(--text-inverse);
        border-radius: var(--radius-sm);
        font-weight: 600;
      }
      .tile:disabled { opacity: 0.6; cursor: not-allowed; }
      .opt-name { font-weight: 500; }
      .opt-price { font-size: 0.8rem; margin-top: 0.15rem; }
      .doneness-slider-wrap { margin-bottom: 0.5rem; }
      .slider-visual {
        position: relative;
        border-radius: var(--radius-md);
        overflow: hidden;
        aspect-ratio: 16/10;
        margin-bottom: 0.75rem;
        background: var(--bg-elevated);
      }
      .slider-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .slider-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        transition: background 0.3s ease;
      }
      .slider-visual[data-doneness="rare"] .slider-overlay {
        background: linear-gradient(180deg, transparent 30%, rgba(139, 0, 0, 0.25) 70%);
      }
      .slider-visual[data-doneness="medium-rare"] .slider-overlay {
        background: linear-gradient(180deg, transparent 25%, rgba(180, 50, 50, 0.2) 75%);
      }
      .slider-visual[data-doneness="medium"] .slider-overlay {
        background: linear-gradient(180deg, transparent 20%, rgba(120, 60, 60, 0.15) 80%);
      }
      .slider-visual[data-doneness="medium-well"] .slider-overlay,
      .slider-visual[data-doneness="well-done"] .slider-overlay {
        background: linear-gradient(180deg, transparent 10%, rgba(60, 40, 40, 0.1) 90%);
      }
      .slider-segments {
        display: flex;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-subtle);
        overflow: hidden;
        background: var(--bg-elevated);
      }
      .segment {
        flex: 1;
        padding: 0.5rem 0.35rem;
        border: none;
        border-right: 1px solid var(--border-subtle);
        background: transparent;
        color: var(--text-secondary);
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
        min-height: 44px;
      }
      .segment:last-child { border-right: none; }
      .segment:hover:not(:disabled) { background: var(--bg-glass); color: var(--text-primary); }
      .segment.selected {
        background: var(--accent-primary-soft);
        color: var(--accent-primary);
      }
      .segment:disabled { opacity: 0.5; cursor: not-allowed; }
      .segment.sold-out .sold-out-label {
        font-size: 0.65rem;
        display: block;
        color: var(--text-muted);
        margin-top: 0.1rem;
      }
      .sold-out-badge {
        font-size: 0.6rem;
        padding: 0.1rem 0.3rem;
        background: var(--status-error-soft);
        color: var(--status-error);
        border-radius: var(--radius-sm);
        margin-right: 0.25rem;
      }
      .tile.sold-out { opacity: 0.85; }
      .slider-price { font-size: 0.9rem; color: var(--accent-primary); margin-top: 0.25rem; display: block; }
      .bundle-section { margin-bottom: 1rem; }
      .section-heading { font-size: 0.95rem; margin: 0 0 0.5rem; font-weight: 600; }
      .bundle-step { margin-bottom: 0.75rem; }
      .step-label { font-size: 0.85rem; color: var(--text-secondary); display: block; margin-bottom: 0.35rem; }
      .bundle-tiles { display: flex; flex-wrap: wrap; gap: 0.35rem; }
      .full-width { width: 100%; }
      .qty-row { display: flex; align-items: center; justify-content: space-between; margin: 1rem 0; }
      .stepper {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.75rem;
        border-radius: var(--radius-pill);
        border: 1px solid var(--border-subtle);
        background: var(--bg-elevated);
      }
      .num { min-width: 2rem; text-align: center; }
      .footer { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle); }
      .price-summary { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
      .price-summary .label { font-weight: 600; }
      .price-summary .amount { font-size: 1.25rem; font-weight: 600; color: var(--accent-primary); }
      .add-btn { width: 100%; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemConfiguratorComponent implements OnInit, OnDestroy {
  private readonly data = inject<ItemConfiguratorData>(MAT_BOTTOM_SHEET_DATA);
  private readonly ref = inject(MatBottomSheetRef<ItemConfiguratorComponent>);
  private readonly cart = inject(CustomerCartService);
  private readonly haptics = inject(HapticService);
  private readonly notifications = inject(NotificationService);
  private readonly ws = inject(WebSocketService);
  private availabilitySub: Subscription | null = null;

  readonly item = signal<MenuItem | null>(this.data?.item ?? null);
  readonly configuration = signal<MenuItemConfiguration | null>(this.data?.configuration ?? null);
  readonly modifierGroups = computed(() => {
    const config = this.configuration();
    return (config?.modifierGroups ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  });
  readonly bundleSlots = computed(() => {
    const config = this.configuration();
    return (config?.bundleSlots ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  });

  readonly selectedModifiers = signal<SelectedModifier[]>([]);
  readonly bundleChoices = signal<BundleChoice[]>([]);
  quantity = signal(1);
  notes = '';
  private defaultsApplied = false;

  ngOnInit(): void {
    this.availabilitySub = this.ws.on<{ modifierOptionId: string; isAvailable: boolean }>('modifier-availability-changed').subscribe((payload) => {
      if (!payload?.modifierOptionId) return;
      this.configuration.update((config) => {
        if (!config) return config;
        return {
          ...config,
          modifierGroups: config.modifierGroups.map((g) => ({
            ...g,
            options: (g.options ?? []).map((o) =>
              o.id === payload.modifierOptionId ? { ...o, isAvailable: payload.isAvailable } : o
            ),
          })),
        };
      });
    });
  }

  ngOnDestroy(): void {
    this.availabilitySub?.unsubscribe();
  }

  constructor() {
    effect(() => {
      const groups = this.modifierGroups();
      if (groups.length === 0 || this.defaultsApplied) return;
      const current = this.selectedModifiers();
      if (current.length > 0) return;
      const defaults: SelectedModifier[] = [];
      for (const group of groups) {
        if (group.selectionType === 'SINGLE') {
          const defOpt = group.options?.find((o) => o.isDefault && o.isAvailable !== false);
          if (defOpt) {
            defaults.push({
              modifierOptionId: defOpt.id,
              modifierGroupName: group.name,
              optionName: defOpt.name,
              priceAdjustment: defOpt.priceAdjustment ?? 0,
            });
          }
        } else {
          const defOpts = group.options?.filter((o) => o.isDefault && o.isAvailable !== false) ?? [];
          for (const o of defOpts) {
            defaults.push({
              modifierOptionId: o.id,
              modifierGroupName: group.name,
              optionName: o.name,
              priceAdjustment: o.priceAdjustment ?? 0,
            });
          }
        }
      }
      if (defaults.length > 0) {
        this.selectedModifiers.set(defaults);
        this.defaultsApplied = true;
      }
    });
  }

  totalPrice = computed(() => {
    const i = this.item();
    if (!i) return 0;
    let sum = i.price;
    this.selectedModifiers().forEach((m) => (sum += m.priceAdjustment));
    return sum * this.quantity();
  });

  private static SLIDER_GROUP_NAMES = ['doneness', 'cook level', 'how would you like it', 'steak doneness', 'cook'];

  isSliderGroup(group: MenuItemModifierGroup): boolean {
    const name = (group.name ?? '').toLowerCase();
    if (ItemConfiguratorComponent.SLIDER_GROUP_NAMES.some((n) => name.includes(n))) return true;
    const opts = group.options ?? [];
    return opts.length > 0 && opts.some((o) => (o as ModifierOption & { visualType?: string }).visualType === 'SLIDER');
  }

  getSelectedDonenessKey(group: MenuItemModifierGroup): string {
    const sel = this.selectedModifiers().find((m) =>
      (group.options ?? []).some((o) => o.id === m.modifierOptionId)
    );
    if (!sel) return '';
    const name = (sel.optionName ?? '').toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    if (name.includes('rare') && !name.includes('medium')) return 'rare';
    if (name.includes('medium-rare') || name.includes('mediumrare')) return 'medium-rare';
    if (name === 'medium') return 'medium';
    if (name.includes('medium-well') || name.includes('mediumwell')) return 'medium-well';
    if (name.includes('well-done') || name.includes('welldone')) return 'well-done';
    return name || 'medium';
  }

  getSelectedOptionForGroup(group: MenuItemModifierGroup): ModifierOption | undefined {
    const sel = this.selectedModifiers().find((m) =>
      (group.options ?? []).some((o) => o.id === m.modifierOptionId)
    );
    if (!sel) return undefined;
    return group.options?.find((o) => o.id === sel.modifierOptionId);
  }

  selectSingleOptionWithHaptic(group: MenuItemModifierGroup, opt: ModifierOption): void {
    this.haptics.thumpShort();
    this.selectSingleOption(group, opt);
  }

  isGroupRequired(group: MenuItemModifierGroup): boolean {
    return group.overrideRequired ?? group.isRequired ?? false;
  }

  minForGroup(group: MenuItemModifierGroup): number {
    return group.overrideMin ?? group.minSelections ?? 0;
  }

  maxForGroup(group: MenuItemModifierGroup): number | undefined {
    return group.overrideMax ?? group.maxSelections;
  }

  isOptionSelected(groupId: string, optionId: string): boolean {
    return this.selectedModifiers().some((m) => m.modifierOptionId === optionId);
  }

  canSelectMore(group: MenuItemModifierGroup): boolean {
    const max = this.maxForGroup(group);
    if (max == null) return true;
    const groupOptIds = new Set((group.options ?? []).map((o) => o.id));
    const selectedInGroup = this.selectedModifiers().filter((m) => groupOptIds.has(m.modifierOptionId)).length;
    return selectedInGroup < max;
  }

  selectSingleOption(group: MenuItemModifierGroup, opt: ModifierOption): void {
    const groupOptIds = (group.options ?? []).map((o) => o.id);
    const next = this.selectedModifiers().filter((m) => !groupOptIds.includes(m.modifierOptionId));
    next.push({
      modifierOptionId: opt.id,
      modifierGroupName: group.name,
      optionName: opt.name,
      priceAdjustment: opt.priceAdjustment ?? 0,
    });
    this.selectedModifiers.set(next);
  }

  toggleMultiOption(group: MenuItemModifierGroup, opt: ModifierOption): void {
    const current = this.selectedModifiers();
    const idx = current.findIndex((m) => m.modifierOptionId === opt.id);
    if (idx >= 0) {
      this.selectedModifiers.set(current.filter((_, i) => i !== idx));
    } else {
      const max = this.maxForGroup(group);
      const groupOptIds = new Set((group.options ?? []).map((o) => o.id));
      const count = current.filter((m) => groupOptIds.has(m.modifierOptionId)).length;
      if (max != null && count >= max) return;
      this.selectedModifiers.set([
        ...current,
        {
          modifierOptionId: opt.id,
          modifierGroupName: group.name,
          optionName: opt.name,
          priceAdjustment: opt.priceAdjustment ?? 0,
        },
      ]);
    }
  }

  selectBundleChoice(slot: BundleSlot, menuItemId: string, chosenItemName: string): void {
    const next = this.bundleChoices().filter((b) => b.bundleSlotId !== slot.id);
    next.push({ bundleSlotId: slot.id, chosenMenuItemId: menuItemId, chosenItemName });
    this.bundleChoices.set(next);
  }

  getBundleChoice(slotId: string): BundleChoice | undefined {
    return this.bundleChoices().find((b) => b.bundleSlotId === slotId);
  }

  canAdd(): boolean {
    const groups = this.modifierGroups();
    for (const group of groups) {
      if (!this.isGroupRequired(group)) continue;
      const min = this.minForGroup(group);
      const groupOptIds = new Set((group.options ?? []).map((o) => o.id));
      const count = this.selectedModifiers().filter((m) => groupOptIds.has(m.modifierOptionId)).length;
      if (count < min) return false;
    }
    const slots = this.bundleSlots();
    for (const slot of slots) {
      if (!slot.isRequired) continue;
      if (!this.getBundleChoice(slot.id)) return false;
    }
    return true;
  }

  changeQty(delta: number): void {
    this.quantity.update((q) => Math.max(1, q + delta));
  }

  addToCart(): void {
    const i = this.item();
    if (!i || !this.canAdd()) return;
    const qty = this.quantity();
    const configuredPrice = this.totalPrice() / qty;
    for (let k = 0; k < qty; k++) {
      this.cart.addItem(i, this.notes.trim() || undefined, this.selectedModifiers(), this.bundleChoices(), configuredPrice);
    }
    this.haptics.thumpShort();
    this.notifications.success('Added to cart');
    this.ref.dismiss();
  }
}
