import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { MenuItem } from '../../../core/models/menu.model';
import { CustomerSessionService } from './customer-session.service';
import { combineLatest, map, Observable, switchMap } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CustomerMenuService {
  private readonly api = inject(ApiService);
  private readonly sessionService = inject(CustomerSessionService);

  private readonly categoryFilter$ = new BehaviorSubject<string>('ALL');
  private readonly searchQuery$ = new BehaviorSubject<string>('');

  menu$ = this.sessionService.currentSession$.pipe(
    switchMap((session) => {
      if (!session) {
        return [[] as MenuItem[]];
      }
      return this.api.get<MenuItem[]>('menu', { companyId: session.companyId });
    }),
  );

  filteredMenu$ = combineLatest([
    this.menu$,
    this.categoryFilter$,
    this.searchQuery$,
  ]).pipe(
    map(([items, category, query]) => {
      let list = Array.isArray(items) ? [...items] : [];
      if (category && category !== 'ALL') {
        list = list.filter((i) => i.category === category);
      }
      const q = (query ?? '').trim().toLowerCase();
      if (q) {
        list = list.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            (i.description?.toLowerCase().includes(q)),
        );
      }
      return list;
    }),
  );

  setCategory(category: string): void {
    this.categoryFilter$.next(category);
  }

  setSearchQuery(query: string): void {
    this.searchQuery$.next(query);
  }

  getCategories(menuItems: MenuItem[]): string[] {
    const set = new Set<string>();
    (menuItems ?? []).forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return ['ALL', ...Array.from(set).sort()];
  }
}

