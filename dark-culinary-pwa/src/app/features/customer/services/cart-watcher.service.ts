import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, debounceTime, switchMap, of, catchError } from 'rxjs';
import { CustomerCartService } from './customer-cart.service';
import { CustomerSessionService } from './customer-session.service';
import { ApiService, ActiveSpecial } from '../../../core/services/api.service';

const DEBOUNCE_MS = 300;

@Injectable({
  providedIn: 'root',
})
export class CartWatcherService implements OnDestroy {
  private readonly cart = inject(CustomerCartService);
  private readonly session = inject(CustomerSessionService);
  private readonly api = inject(ApiService);

  private readonly activeSpecialsSubject = new BehaviorSubject<ActiveSpecial[]>([]);
  readonly activeSpecials$ = this.activeSpecialsSubject.asObservable();

  private sub: Subscription | null = null;

  constructor() {
    this.sub = this.cart.items$.pipe(
      debounceTime(DEBOUNCE_MS),
      switchMap((items) => {
        const session = this.session.currentSessionSnapshot;
        if (!session?.companyId || items.length === 0) {
          return of([]);
        }
        const cartItems = items
          .filter((i) => !i.isSpecial)
          .map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            category: i.category,
            price: i.configuredPrice ?? i.price,
          }));
        if (cartItems.length === 0) return of([]);
        return this.api.evaluateSpecials({
          companyId: session.companyId,
          tableId: session.tableId,
          guestCount: 1,
          cartItems,
        }).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe((specials) => this.activeSpecialsSubject.next(specials));
  }

  get activeSpecialsSnapshot(): ActiveSpecial[] {
    return this.activeSpecialsSubject.value;
  }

  applySpecial(special: ActiveSpecial): void {
    const matchedIds = special.matchedItemIds ?? [];
    const price = special.bundlePrice ?? special.fixedPrice ?? special.totalCharge ?? 0;
    if (matchedIds.length === 0 && special.specialType !== 'AUTO_APPENDED') return;
    if (special.specialType === 'AUTO_APPENDED') {
      // Auto-appended (e.g. corkage): add as a single line, no replacement
      this.cart.applySpecial([], special.id, special.name, price, 1);
      return;
    }
    this.cart.applySpecial(matchedIds, special.id, special.name, price, 1);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
