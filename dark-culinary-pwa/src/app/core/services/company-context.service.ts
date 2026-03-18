import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface CompanyContext {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CompanyContextService {
  private readonly api = inject(ApiService);

  private readonly companySubject = new BehaviorSubject<CompanyContext | null>(null);
  readonly currentCompany$ = this.companySubject.asObservable();

  readonly companyId$: Observable<string | null> = this.currentCompany$.pipe(
    map((company) => company?.id ?? null),
  );

  loadCompany(companyGuid: string) {
    return this.api.get<CompanyContext>(`companies/${companyGuid}`).pipe(
      tap((company) => this.companySubject.next(company)),
    );
  }
}


