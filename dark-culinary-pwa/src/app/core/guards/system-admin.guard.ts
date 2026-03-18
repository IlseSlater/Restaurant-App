import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const systemAdminGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUserSnapshot;
  if (!auth.token || !user) {
    return router.parseUrl('/customer/welcome');
  }

  const role = (user.role ?? '').toUpperCase();
  if (role === 'SYSTEM_ADMIN') {
    return true;
  }

  return router.parseUrl('/customer/welcome');
};
