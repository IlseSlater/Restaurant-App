import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface ResolvedTable {
  id: string;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class CustomerTableResolveService {
  private readonly api = inject(ApiService);

  /** Resolve a table for a company, preferring a live id then falling back to table number. */
  resolve(
    companyId: string,
    hints: { tableId?: string | null; tableNumber?: string | number | null },
  ): Observable<ResolvedTable | null> {
    const company = companyId.trim();
    if (!company) return of(null);

    return this.api
      .get<{ id: string; number: number }[]>('tables', { companyId: company })
      .pipe(map((tables) => this.pickTable(Array.isArray(tables) ? tables : [], hints)));
  }

  pickTable(
    list: { id: string; number: number }[],
    hints: { tableId?: string | null; tableNumber?: string | number | null },
  ): ResolvedTable | null {
    const preferredId = hints.tableId?.trim();
    if (preferredId) {
      const byId = list.find((table) => table.id === preferredId);
      if (byId) return byId;
    }

    const rawNumber = hints.tableNumber;
    if (rawNumber == null || rawNumber === '') return null;

    const asString = String(rawNumber).trim();
    const asNum = Number(asString);
    return (
      list.find(
        (table) =>
          String(table.number) === asString ||
          (!Number.isNaN(asNum) && table.number === asNum) ||
          table.id === asString,
      ) ?? null
    );
  }
}
