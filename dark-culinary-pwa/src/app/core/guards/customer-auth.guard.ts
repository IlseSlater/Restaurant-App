import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { CustomerSessionService } from '../../features/customer/services/customer-session.service';
import { NotificationService } from '../services/notification.service';
import { catchError, map, of } from 'rxjs';

const SESSION_KEY = 'dark_culinary_customer_session';

export const customerAuthGuard: CanActivateFn = () => {
  const storage = inject(StorageService);
  const router = inject(Router);
  const sessionService = inject(CustomerSessionService);
  const notifications = inject(NotificationService);

  const session = storage.get<{ id: string }>(SESSION_KEY);
  if (session?.id) {
    // Guard against stale local sessions after DB reset/reseed.
    return sessionService.getSessionWithBill(session.id).pipe(
      map(() => true),
      catchError(() => {
        sessionService.clearLocalSession(session.id);
        notifications.warn('Your session has expired. Please scan the table QR again.');
        return of(router.parseUrl('/customer/welcome'));
      }),
    );
  }

  return router.parseUrl('/customer/welcome');
};

