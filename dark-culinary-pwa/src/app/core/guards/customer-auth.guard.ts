import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from '../services/storage.service';

const SESSION_KEY = 'dark_culinary_customer_session';

export const customerAuthGuard: CanActivateFn = () => {
  const storage = inject(StorageService);
  const router = inject(Router);

  const session = storage.get(SESSION_KEY);
  if (session) {
    return true;
  }

  return router.parseUrl('/customer/welcome');
};

