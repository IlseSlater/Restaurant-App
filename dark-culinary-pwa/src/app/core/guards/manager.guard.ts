import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const managerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.currentUser$.pipe(
    map((user): boolean | UrlTree => {
      if (!user) {
        return router.parseUrl('/customer/welcome');
      }
      if (user.role === 'MANAGER' || user.role === 'SYSTEM_ADMIN') {
        return true;
      }
      return router.parseUrl('/customer/welcome');
    }),
  );
};

