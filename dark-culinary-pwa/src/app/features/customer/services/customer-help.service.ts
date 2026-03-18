import { Injectable, inject } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BottomSheetHelpComponent } from '../../../shared/components/bottom-sheet-help/bottom-sheet-help.component';
import { CustomerEscalationService } from './customer-escalation.service';

export interface HelpSheetData {
  tableId: string;
  customerSessionId: string;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerHelpService {
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly api = inject(ApiService);
  private readonly notifications = inject(NotificationService);
  private readonly escalation = inject(CustomerEscalationService);

  openHelpSheet(data: HelpSheetData): void {
    this.loadPendingCallsForSheet(data);
    const ref = this.bottomSheet.open(BottomSheetHelpComponent, {
      data,
      panelClass: 'dc-help-sheet',
    });

    ref.instance.requestWaiter.subscribe(() => this.requestWaiter(data));
    ref.instance.speakToManager.subscribe(() => this.speakToManager(data));
    ref.instance.cancelWaiter.subscribe((id) => this.cancelRequest(id));
    ref.instance.cancelManager.subscribe((id) => this.cancelRequest(id));
  }

  private cancelRequest(callId: string): void {
    this.api.put(`waiter-calls/${callId}/resolve`, {}).subscribe({
      next: () => {
        this.notifications.success('Request cancelled.');
        this.escalation.clearPendingCallById(callId);
      },
      error: (err) => {
        this.notifications.error(err?.error?.message ?? 'Failed to cancel request.');
      },
    });
  }

  private loadPendingCallsForSheet(data: HelpSheetData): void {
    this.api
      .get<Array<{ id: string; createdAt: string; callType: string; customerSessionId: string; status: string }>>(
        `waiter-calls/table/${data.tableId}`,
      )
      .subscribe({
        next: (calls) => {
          const pending = calls.filter(
            (c) =>
              c.customerSessionId === data.customerSessionId &&
              c.status !== 'RESOLVED',
          );
          this.escalation.setPendingCallsFromApi(pending);
        },
      });
  }

  private requestWaiter(data: HelpSheetData): void {
    this.api
      .post<{ id: string; createdAt: string; callType: string }>('waiter-calls', {
        tableId: data.tableId,
        customerSessionId: data.customerSessionId,
        callType: 'WAITER',
      })
      .subscribe({
        next: (call) => {
          this.notifications.success('Waiter notified.');
          this.escalation.setPendingWaiterCall({
            id: call.id,
            createdAt: call.createdAt ?? new Date().toISOString(),
          });
        },
        error: (err) => {
          this.notifications.error(err?.error?.message ?? 'Failed to send request.');
        },
      });
  }

  private speakToManager(data: HelpSheetData): void {
    this.api
      .post<{ id: string; createdAt: string; callType: string }>('waiter-calls', {
        tableId: data.tableId,
        customerSessionId: data.customerSessionId,
        callType: 'MANAGER',
      })
      .subscribe({
        next: (call) => {
          this.notifications.info('Manager notified. Someone will be with you shortly.');
          this.escalation.setPendingManagerCall({
            id: call.id,
            createdAt: call.createdAt ?? new Date().toISOString(),
          });
        },
        error: (err) => {
          this.notifications.error(err?.error?.message ?? 'Failed to send request.');
        },
      });
  }
}
