import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { CompanyContextService } from '../services/company-context.service';
import { ThemeService } from '../services/theme.service';
import { map, Observable, tap } from 'rxjs';

export const companyGuard: CanActivateFn = (route): Observable<boolean | UrlTree> => {
  const companyContext = inject(CompanyContextService);
  const themeService = inject(ThemeService);
  const router = inject(Router);

  const companyGuid = route.params['companyGuid'];
  if (!companyGuid) {
    return new Observable<boolean | UrlTree>((subscriber) => {
      subscriber.next(router.parseUrl('/admin/system'));
      subscriber.complete();
    });
  }

  return companyContext.loadCompany(companyGuid).pipe(
    tap((company) => {
      if (company?.primaryColor || company?.secondaryColor) {
        themeService.applyCompanyTheme({
          accentPrimary: company.primaryColor,
          accentSecondary: company.secondaryColor,
        });
      }
    }),
    map((company) => (company ? true : router.parseUrl('/admin/system'))),
  );
};


