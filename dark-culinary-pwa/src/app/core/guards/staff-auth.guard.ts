import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const staffAuthGuard: CanActivateFn = (route): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUserSnapshot;
  if (auth.token && user) {
    return true;
  }

  const companyGuid = route.params['companyGuid'];
  if (companyGuid) {
    return router.parseUrl(`/staff/login/${companyGuid}`);
  }
  return router.parseUrl('/customer/welcome');
};

