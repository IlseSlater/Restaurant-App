import { Injectable, inject } from '@angular/core';

import { Router } from '@angular/router';

import { MatBottomSheet } from '@angular/material/bottom-sheet';

import {

  Observable,

  of,

  tap,

  catchError,

  throwError,

  map,

  switchMap,

  finalize,

  take,

} from 'rxjs';

import { CustomerSession } from '../../../core/models/customer-session.model';
import { CustomerProfileService } from './customer-profile.service';
import { CustomerSessionService, ScanStatusResponse } from './customer-session.service';

import { CustomerTableResolveService } from './customer-table-resolve.service';

import { NotificationService } from '../../../core/services/notification.service';

import { StorageService } from '../../../core/services/storage.service';

import { JoinTableSheetComponent } from '../components/join-table-sheet/join-table-sheet.component';



const SESSION_KEY = 'dark_culinary_customer_session';



export interface TableArrivalContext {

  companyGuid: string;

  tableId: string;

  tableNumber: string;

}



export interface TableQrArrivalInput {

  companyGuid: string;

  tableNumber: string;

  tableId?: string | null;

}



@Injectable({

  providedIn: 'root',

})

export class CustomerTableArrivalService {

  private readonly profileService = inject(CustomerProfileService);

  private readonly sessionService = inject(CustomerSessionService);

  private readonly tableResolve = inject(CustomerTableResolveService);

  private readonly router = inject(Router);

  private readonly notifications = inject(NotificationService);

  private readonly bottomSheet = inject(MatBottomSheet);

  private readonly storage = inject(StorageService);



  private arrivalInFlight = false;



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



  /**

   * Single entry point for QR table links (welcome deep-link or in-app scan).

   * Resolves the table, reconciles any local session, then routes to menu/register/join.

   */

  handleTableQrArrival(input: TableQrArrivalInput): Observable<void> {

    if (this.arrivalInFlight) {

      return of(undefined);

    }

    this.arrivalInFlight = true;



    const companyGuid = input.companyGuid.trim();

    const tableNumber = String(input.tableNumber).trim();

    if (!companyGuid || !tableNumber) {

      this.arrivalInFlight = false;

      return of(undefined);

    }



    return this.tableResolve

      .resolve(companyGuid, { tableId: input.tableId, tableNumber })

      .pipe(

        switchMap((table) => {

          if (!table?.id) {

            this.notifications.warn('Table not found. Please scan the QR code at your table.');

            this.goToRegister({ companyGuid, tableId: '', tableNumber });

            return of(undefined);

          }



          const ctx: TableArrivalContext = {

            companyGuid,

            tableId: table.id,

            tableNumber: String(table.number),

          };



          return this.reconcileLocalSessionThenProceed(ctx);

        }),

        catchError(() => {

          this.notifications.error('Could not load table information. Please try again.');

          this.goToRegister({ companyGuid, tableId: input.tableId ?? '', tableNumber });

          return of(undefined);

        }),

        finalize(() => {

          this.arrivalInFlight = false;

        }),

      );

  }



  private reconcileLocalSessionThenProceed(ctx: TableArrivalContext): Observable<void> {

    const local =

      this.sessionService.currentSessionSnapshot ??

      this.storage.get<{ id?: string; tableId?: string; companyId?: string }>(SESSION_KEY);



    if (!local?.id) {

      return this.proceedAfterTableResolved(ctx);

    }



    if (local.tableId === ctx.tableId) {

      return this.sessionService.checkCanLeave(local as CustomerSession).pipe(

        take(1),

        switchMap((leave) => {

          if (!leave.allowed) {

            this.notifications.warn('Please pay your bill before starting a new visit.');

            void this.router.navigate(['/customer/bill']);

            return of(undefined);

          }

          void this.router.navigate(['/customer/menu']);

          return of(undefined);

        }),

        catchError(() => {

          void this.router.navigate(['/customer/menu']);

          return of(undefined);

        }),

      );

    }



    if (local.tableId && local.tableId !== ctx.tableId) {

      void this.router.navigate(['/customer/scan-table'], {

        queryParams: {

          c: ctx.companyGuid,

          moveTableId: ctx.tableId,

          moveTableNumber: ctx.tableNumber,

        },

        queryParamsHandling: '',

      });

      return of(undefined);

    }



    return this.proceedAfterTableResolved(ctx);

  }



  private proceedAfterTableResolved(ctx: TableArrivalContext): Observable<void> {

    return this.sessionService.getScanStatus(ctx.tableId, ctx.companyGuid).pipe(

      switchMap((status) => this.routeFromScanStatus(ctx, status)),

      catchError(() => this.routeFromScanStatus(ctx)),

    );

  }



  private routeFromScanStatus(

    ctx: TableArrivalContext,

    status?: ScanStatusResponse,

  ): Observable<void> {

    const local = this.sessionService.currentSessionSnapshot;



    if (local?.id && status?.sessionId && local.id === status.sessionId) {

      void this.router.navigate(['/customer/menu']);

      return of(undefined);

    }



    if (this.hasStoredProfile()) {

      return this.beginWithStoredProfile(ctx, status);

    }



    if (status?.hasActiveSession && status.sessionId) {

      const joinRef = this.bottomSheet.open(JoinTableSheetComponent, {

        data: {

          tableNumber: status.tableNumber ?? ctx.tableNumber,

          sessionId: status.sessionId,

          participants: status.participants ?? [],

        },

        panelClass: 'dc-join-table-sheet',

      });

      joinRef.afterDismissed().subscribe((join) => {

        if (join === true) {

          this.goToRegister(ctx, status.sessionId);

        }

      });

      return of(undefined);

    }



    if (local?.id) {

      void this.router.navigate(['/customer/scan-table'], {

        queryParams: {

          c: ctx.companyGuid,

          moveTableId: ctx.tableId,

          moveTableNumber: ctx.tableNumber,

        },

        queryParamsHandling: '',

      });

      return of(undefined);

    }



    this.goToRegister(ctx);

    return of(undefined);

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



    const session$ = this.tableResolve.resolve(ctx.companyGuid, {

      tableId: ctx.tableId,

      tableNumber: ctx.tableNumber,

    }).pipe(

      switchMap((table) => {

        if (!table?.id) {

          throw new Error('Table not found. Please scan the QR code at your table again.');

        }

        if (scanStatus?.hasActiveSession && scanStatus.sessionId) {

          return this.sessionService.joinSession(scanStatus.sessionId, {

            displayName: profile.customerName,

            phoneNumber: profile.phoneNumber,

            deviceId: this.profileService.getDeviceId(),

          });

        }

        return this.sessionService.startSession(ctx.companyGuid, table.id, payload);

      }),

    );



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


