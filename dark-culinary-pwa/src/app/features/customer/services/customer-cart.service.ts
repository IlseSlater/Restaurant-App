import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { StorageService } from '../../../core/services/storage.service';
import { MenuItem } from '../../../core/models/menu.model';
import type { SelectedModifier, BundleChoice } from '../../../core/models/modifier.model';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  category?: string;
  selectedModifiers?: SelectedModifier[];
  bundleChoices?: BundleChoice[];
  configuredPrice?: number;
  /** When true, this line represents an applied special (bundle). */
  isSpecial?: boolean;
  specialId?: string;
  specialName?: string;
}

const CART_KEY = 'dark_culinary_cart';

@Injectable({
  providedIn: 'root',
})
export class CustomerCartService {
  private readonly storage = inject(StorageService);

  private readonly itemsSubject = new BehaviorSubject<CartItem[]>(this.load());
  private readonly serviceFeePercentSubject = new BehaviorSubject<number>(0);

  readonly items$ = this.itemsSubject.asObservable();
  readonly serviceFeePercent$ = this.serviceFeePercentSubject.asObservable();

  readonly subtotal$ = this.items$.pipe(
    map((items) =>
      items.reduce((sum, item) => sum + (item.configuredPrice ?? item.price) * item.quantity, 0),
    ),
  );

  readonly serviceFee$ = combineLatest([this.subtotal$, this.serviceFeePercent$]).pipe(
    map(([subtotal, pct]) => (subtotal * pct) / 100),
  );

  readonly total$ = combineLatest([this.subtotal$, this.serviceFee$]).pipe(
    map(([sub, fee]) => sub + fee),
  );

  setServiceFeePercent(pct: number): void {
    this.serviceFeePercentSubject.next(pct);
  }

  addItem(
    menuItem: MenuItem,
    notes?: string,
    selectedModifiers?: SelectedModifier[],
    bundleChoices?: BundleChoice[],
    configuredPrice?: number
  ): void {
    const items = [...this.itemsSubject.value];
    const sameConfig = (a: CartItem, b: CartItem) =>
      a.menuItemId === b.menuItemId &&
      a.notes === b.notes &&
      JSON.stringify(a.selectedModifiers ?? []) === JSON.stringify(b.selectedModifiers ?? []) &&
      JSON.stringify(a.bundleChoices ?? []) === JSON.stringify(b.bundleChoices ?? []);
    const priceToUse = configuredPrice ?? menuItem.price;
    const newItem: CartItem = {
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: priceToUse,
      quantity: 1,
      notes,
      category: menuItem.category,
      selectedModifiers: selectedModifiers?.length ? selectedModifiers : undefined,
      bundleChoices: bundleChoices?.length ? bundleChoices : undefined,
      configuredPrice: configuredPrice != null ? configuredPrice : undefined,
    };
    const existing = items.find((i) => sameConfig(i, newItem));
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push(newItem);
    }
    this.save(items);
  }

  updateQuantity(menuItemId: string, quantity: number): void {
    const items = this.itemsSubject.value
      .map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i))
      .filter((i) => i.quantity > 0);
    this.save(items);
  }

  updateQuantityAt(index: number, quantity: number): void {
    const items = [...this.itemsSubject.value];
    if (index < 0 || index >= items.length) return;
    if (quantity <= 0) {
      items.splice(index, 1);
    } else {
      items[index] = { ...items[index], quantity };
    }
    this.save(items);
  }

  remove(menuItemId: string): void {
    const items = this.itemsSubject.value.filter((i) => i.menuItemId !== menuItemId);
    this.save(items);
  }

  removeAt(index: number): void {
    const items = this.itemsSubject.value.filter((_, i) => i !== index);
    this.save(items);
  }

  /**
   * Replace matched items with a single special/bundle line (Ghost Cart transformation).
   * When matchedMenuItemIds is empty (e.g. AUTO_APPENDED corkage), only adds the special line without removing any items.
   */
  applySpecial(
    matchedMenuItemIds: string[],
    specialId: string,
    specialName: string,
    bundlePrice: number,
    quantity = 1
  ): void {
    let items = this.itemsSubject.value.filter(
      (i) => !i.isSpecial && !matchedMenuItemIds.includes(i.menuItemId)
    );
    // Avoid duplicate same special (e.g. corkage applied twice)
    items = items.filter((i) => !(i.isSpecial && i.specialId === specialId));
    const specialItem: CartItem = {
      menuItemId: specialId,
      name: specialName,
      price: bundlePrice,
      quantity,
      isSpecial: true,
      specialId,
      specialName,
      configuredPrice: bundlePrice,
    };
    items.push(specialItem);
    this.save(items);
  }

  clear(): void {
    this.save([]);
  }

  private save(items: CartItem[]): void {
    this.itemsSubject.next(items);
    this.storage.set(CART_KEY, items);
  }

  private load(): CartItem[] {
    return this.storage.get<CartItem[]>(CART_KEY) ?? [];
  }
}

