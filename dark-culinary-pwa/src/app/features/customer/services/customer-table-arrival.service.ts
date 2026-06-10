import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, tap, catchError, throwError, map } from 'rxjs';
import { CustomerProfileService } from './customer-profile.service';
import { CustomerSessionService, ScanStatusResponse } from './customer-session.service';
import { NotificationService } from '../../../core/services/notification.service';

export interface TableArrivalContext {
  companyGuid: string;
  tableId: string;
  tableNumber: string;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerTableArrivalService {
  private readonly profileService = inject(CustomerProfileService);
  private readonly sessionService = inject(CustomerSessionService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  hasStoredProfile(): boolean {
    return !!this.profileService.getProfileSnapshot()?.customerName?.trim();
  }

  goToRegister(ctx: TableArrivalContext, sessionId?: string): void {
    void this.router.navigate(['/customer/register'], {
      queryParams: {
        c: ctx.companyGuid,
        t: ctx.tableNumber,
        tableId: ctx.tableId,
        ...(sessionId ? { sid: sessionId } : {}),
      },
      queryParamsHandling: '',
    });
  }

  /** Start or join a table session using the saved device profile, then open the menu. */
  beginWithStoredProfile(
    ctx: TableArrivalContext,
    scanStatus?: Pick<ScanStatusResponse, 'hasActiveSession' | 'sessionId'>,
  ): Observable<void> {
    const profile = this.profileService.getProfileSnapshot();
    if (!profile?.customerName?.trim()) {
      this.goToRegister(ctx, scanStatus?.sessionId);
      return of(undefined);
    }

    const payload = {
      customerName: profile.customerName,
      phoneNumber: profile.phoneNumber,
      dietaryPreferences: profile.dietaryPreferences,
      allergies: profile.allergies,
    };

    const session$ =
      scanStatus?.hasActiveSession && scanStatus.sessionId
        ? this.sessionService.joinSession(scanStatus.sessionId, {
            displayName: profile.customerName,
            phoneNumber: profile.phoneNumber,
            deviceId: this.profileService.getDeviceId(),
          })
        : this.sessionService.startSession(ctx.companyGuid, ctx.tableId, payload);

    return session$.pipe(
      tap(() => {
        void this.router.navigate(['/customer/menu']);
      }),
      map(() => undefined),
      catchError((err) => {
        const message =
          (err as { error?: { message?: string } })?.error?.message ??
          'Could not start your session. Please try again.';
        this.notifications.error(message);
        this.goToRegister(ctx, scanStatus?.sessionId);
        return throwError(() => err);
      }),
    );
  }

}
