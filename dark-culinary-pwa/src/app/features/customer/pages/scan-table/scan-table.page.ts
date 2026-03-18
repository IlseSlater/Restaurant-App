import {
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../../../core/services/api.service';
import { HapticService } from '../../../../core/services/haptic.service';
import { CustomerSessionService } from '../../services/customer-session.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { StorageService } from '../../../../core/services/storage.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { JoinTableSheetComponent } from '../../components/join-table-sheet/join-table-sheet.component';
import { GlassCardComponent } from '../../../../shared/components/glass-card/glass-card.component';
import { take } from 'rxjs';

const QUICK_TABLE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

@Component({
  selector: 'app-scan-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GlassCardComponent,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="scan">
      <h1 class="dc-title">Find your table</h1>
      <p class="dc-body">Scan the code on your table stand or enter the table number.</p>

      @if (rejoinSession()) {
        <div class="rejoin-banner">
          <p>You're at Table {{ rejoinSession()?.tableNumber ?? '?' }} as <strong>{{ rejoinSession()?.customerName }}</strong></p>
          <button mat-flat-button color="primary" type="button" (click)="rejoinMySession()">
            Rejoin my session
          </button>
        </div>
      }

      @if (mode() === 'scan') {
        <app-glass-card>
          <div class="scanner-frame">
            <video
              #videoElement
              class="scanner-video"
              autoplay
              playsinline
              muted
            ></video>
            <div class="scanner-placeholder">
              @if (processingScan()) {
                <mat-icon class="spin">hourglass_empty</mat-icon>
                <p>Table found — redirecting…</p>
              } @else if (!cameraAllowed()) {
                <button mat-flat-button type="button" (click)="requestCamera()">
                  <mat-icon>camera_alt</mat-icon>
                  Allow Camera Access
                </button>
              } @else {
                <mat-icon>qr_code_scanner</mat-icon>
                <p>Align the QR code within the frame.</p>
              }
            </div>
          </div>
          <button mat-button type="button" class="toggle-manual" (click)="setMode('manual')">
            <mat-icon>dialpad</mat-icon>
            Enter table number instead
          </button>
        </app-glass-card>
      } @else {
        <app-glass-card>
          <div class="manual">
            <button mat-button type="button" class="toggle-scan" (click)="setMode('scan')">
              <mat-icon>qr_code_scanner</mat-icon>
              Scan QR instead
            </button>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Table number</mat-label>
              <input
                matInput
                type="number"
                [formControl]="form.controls.tableNumber"
                placeholder="e.g. 5"
              />
            </mat-form-field>
            <div class="quick-select">
              @for (n of quickTableNumbers; track n) {
                <button
                  mat-mini-fab
                  [class.selected]="selectedQuickTable() === n"
                  type="button"
                  (click)="selectQuickTable(n)"
                >
                  {{ n }}
                </button>
              }
            </div>
            @if (errorMessage()) {
              <div class="error-chip" role="alert">
                <mat-icon>error</mat-icon>
                {{ errorMessage() }}
              </div>
            }
            <button
              mat-flat-button
              color="primary"
              [disabled]="form.invalid"
              (click)="continue()"
            >
              <mat-icon>arrow_forward</mat-icon>
              Continue
            </button>
          </div>
        </app-glass-card>
      }
    </div>
  `,
  styles: [
    `
      .scan {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .scanner-frame {
        position: relative;
        border: 2px solid var(--accent-primary);
        border-radius: 16px;
        padding: 0;
        overflow: hidden;
        text-align: center;
        animation: pulse-border 2s ease-in-out infinite;
      }
      .scanner-video {
        width: 100%;
        height: auto;
        display: block;
        object-fit: cover;
      }
      .scanner-placeholder {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .scanner-placeholder button {
        pointer-events: auto;
      }
      @keyframes pulse-border {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      .scanner-placeholder mat-icon {
        font-size: 4rem;
        width: 4rem;
        height: 4rem;
        color: var(--accent-primary);
        margin-bottom: 0.5rem;
      }
      .scanner-placeholder mat-icon.spin {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .scanner-placeholder p {
        margin: 0 0 1rem;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }
      .toggle-manual, .toggle-scan {
        margin-top: 1rem;
        width: 100%;
      }
      .manual {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .full-width { width: 100%; }
      .quick-select {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .quick-select button.selected {
        background-color: var(--accent-primary);
        color: var(--text-inverse);
      }
      .error-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        background-color: var(--status-error-soft);
        color: var(--status-error);
        font-size: 0.85rem;
      }
      .error-chip mat-icon {
        font-size: 1.1rem;
        width: 1.1rem;
        height: 1.1rem;
      }
      .rejoin-banner {
        padding: 1rem;
        background: var(--status-success-soft);
        border: 1px solid var(--accent-primary);
        border-radius: var(--radius-lg);
        margin-bottom: 0.5rem;
      }
      .rejoin-banner p {
        margin: 0 0 0.75rem;
        font-size: 0.95rem;
      }
      .rejoin-banner button {
        width: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanTablePage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly haptics = inject(HapticService);
  private readonly ngZone = inject(NgZone);
  private readonly sessionService = inject(CustomerSessionService);
  private readonly storage = inject(StorageService);
  private readonly notifications = inject(NotificationService);
  private readonly bottomSheet = inject(MatBottomSheet);

  @ViewChild('videoElement') private videoElement?: ElementRef<HTMLVideoElement>;
  private mediaStream: MediaStream | null = null;
  private scanFrameId: number | null = null;
  private handlingQr = false;

  readonly quickTableNumbers = QUICK_TABLE_NUMBERS;
  readonly mode = signal<'scan' | 'manual'>('manual');
  readonly cameraAllowed = signal(false);
  readonly processingScan = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedQuickTable = signal<number | null>(null);

  form = this.fb.group({
    tableNumber: ['', [Validators.required]],
  });

  rejoinSession(): { customerName: string; tableNumber: string } | null {
    const session = this.sessionService.currentSessionSnapshot;
    if (!session?.id) return null;
    const sessionWithTable = session as unknown as { table?: { number: number } };
    const tableNumber =
      sessionWithTable?.table?.number != null
        ? String(sessionWithTable.table.number)
        : this.storage.get<string>('dark_culinary_table_number') ?? '?';
    return { customerName: session.customerName ?? 'Guest', tableNumber };
  }

  rejoinMySession(): void {
    if (!this.sessionService.currentSessionSnapshot) return;
    void this.router.navigate(['/customer/menu']);
  }

  constructor() {
    const modeParam = this.route.snapshot.queryParamMap.get('mode');
    if (modeParam === 'scan' || modeParam === 'manual') {
      this.mode.set(modeParam);
    }
    if (this.mode() === 'scan') {
      this.requestCamera();
    }
  }

  setMode(m: 'scan' | 'manual'): void {
    this.mode.set(m);
    this.errorMessage.set(null);
    if (m === 'scan') {
      this.requestCamera();
    } else {
      this.stopCamera();
    }
  }

  requestCamera(): void {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          this.cameraAllowed.set(true);
          this.attachStream(stream);
          this.startScanLoop();
        })
        .catch(() => {
          this.errorMessage.set('Camera access denied. Use manual entry.');
        });
    } else {
      this.errorMessage.set('Camera not supported. Use manual entry.');
    }
  }

  selectQuickTable(n: number): void {
    this.selectedQuickTable.set(n);
    this.form.patchValue({ tableNumber: String(n) });
  }

  /**
   * If user has an active session at this table and has not paid, block and redirect to bill.
   * Otherwise call onProceed. When blocked, whenBlocked is called (e.g. to reset processing state).
   */
  private checkSameTableUnpaidThenProceed(
    tableId: string,
    onProceed: () => void,
    whenBlocked?: () => void,
  ): void {
    const session = this.sessionService.currentSessionSnapshot;
    if (!session || session.tableId !== tableId) {
      onProceed();
      return;
    }
    this.sessionService.checkCanLeave(session).pipe(take(1)).subscribe({
      next: (result) => {
        if (!result.allowed) {
          this.notifications.warn(
            'You already have an active session at this table. Please pay your bill first.',
          );
          void this.router.navigate(['/customer/bill']);
          whenBlocked?.();
          return;
        }
        onProceed();
      },
      error: () => onProceed(),
    });
  }

  private attachStream(stream: MediaStream): void {
    this.mediaStream = stream;
    const video = this.videoElement?.nativeElement;
    if (!video) {
      return;
    }
    video.srcObject = stream;
    void video.play().catch(() => {
      // Ignore autoplay-related errors; user interaction will trigger play if needed.
    });
  }

  private startScanLoop(): void {
    if (typeof window === 'undefined') return;
    const anyWindow = window as any;
    const BarcodeDetectorCtor = anyWindow.BarcodeDetector as
      | (new (opts: { formats: string[] }) => {
          detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
        })
      | undefined;
    if (!BarcodeDetectorCtor) {
      // Browser does not support BarcodeDetector; fall back to manual entry.
      return;
    }
    const video = this.videoElement?.nativeElement;
    if (!video) return;

    const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
    const scan = async (): Promise<void> => {
      if (this.handlingQr) {
        this.scanFrameId = requestAnimationFrame(() => void scan());
        return;
      }
      if (!this.mediaStream || video.readyState < 2) {
        this.scanFrameId = requestAnimationFrame(() => void scan());
        return;
      }
      try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
          const raw = barcodes[0]?.rawValue ?? '';
          if (raw) {
            this.handleQrDetected(raw);
            return;
          }
        }
      } catch {
        // Ignore detection errors and keep scanning.
      }
      this.scanFrameId = requestAnimationFrame(() => void scan());
    };

    if (this.scanFrameId !== null) {
      cancelAnimationFrame(this.scanFrameId);
    }
    this.scanFrameId = requestAnimationFrame(() => void scan());
  }

  private handleQrDetected(raw: string): void {
    if (this.handlingQr) return;
    this.handlingQr = true;
    this.stopCamera();

    this.ngZone.run(() => {
      this.processingScan.set(true);
      this.haptics.thumpShort();

      let url: URL | null = null;
      try {
        url = new URL(raw);
      } catch {
        try {
          url = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        } catch {
          url = null;
        }
      }

      const companyGuid = url?.searchParams.get('c');
      const tableNumber = url?.searchParams.get('t');
      if (!companyGuid || !tableNumber) {
        this.processingScan.set(false);
        this.errorMessage.set('QR code is not a valid table link. Use manual entry instead.');
        this.mode.set('manual');
        this.handlingQr = false;
        return;
      }

      this.api.get<{ id: string; number: number }[]>('tables', { companyId: companyGuid }).subscribe({
        next: (tables) => {
          const list = Array.isArray(tables) ? tables : [];
          const table = list.find(
            (tb) => String(tb.number) === tableNumber || tb.id === tableNumber,
          );
          const tableId = table?.id;
          if (!tableId) {
            void this.router.navigate(['/customer/register'], {
              queryParams: { c: companyGuid, t: tableNumber },
              queryParamsHandling: '',
            });
            this.handlingQr = false;
            return;
          }
          this.checkSameTableUnpaidThenProceed(
            tableId,
            () => {
              this.sessionService.getScanStatus(tableId, companyGuid).subscribe({
                next: (status) => {
                  if (status.hasActiveSession && status.sessionId) {
                    const session = this.sessionService.currentSessionSnapshot;
                    if (session?.tableId === tableId && session.id === status.sessionId) {
                      void this.router.navigate(['/customer/menu']);
                      this.handlingQr = false;
                      return;
                    }
                    const sheetRef = this.bottomSheet.open(JoinTableSheetComponent, {
                      data: {
                        tableNumber: status.tableNumber ?? tableNumber,
                        sessionId: status.sessionId,
                        participants: status.participants ?? [],
                      },
                      panelClass: 'dc-join-table-sheet',
                    });
                    sheetRef.afterDismissed().subscribe((join) => {
                      this.handlingQr = false;
                      if (join === true) {
                        void this.router.navigate(['/customer/register'], {
                          queryParams: { c: companyGuid, t: tableNumber, tableId, sid: status.sessionId },
                          queryParamsHandling: '',
                        });
                      } else {
                        this.processingScan.set(false);
                      }
                    });
                  } else {
                    void this.router.navigate(['/customer/register'], {
                      queryParams: { c: companyGuid, t: tableNumber, tableId },
                      queryParamsHandling: '',
                    });
                    this.handlingQr = false;
                  }
                },
                error: () => {
                  void this.router.navigate(['/customer/register'], {
                    queryParams: { c: companyGuid, t: tableNumber, tableId },
                    queryParamsHandling: '',
                  });
                  this.handlingQr = false;
                },
              });
            },
            () => {
              this.processingScan.set(false);
              this.handlingQr = false;
            },
          );
        },
        error: () => {
          this.processingScan.set(false);
          this.errorMessage.set("We can't find that table from the QR. Please enter the table number manually.");
          this.mode.set('manual');
          this.handlingQr = false;
        },
      });
    });
  }

  private stopCamera(): void {
    if (this.scanFrameId !== null) {
      cancelAnimationFrame(this.scanFrameId);
      this.scanFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    const video = this.videoElement?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
  }

  continue(): void {
    this.errorMessage.set(null);
    const tableNumber = this.form.value.tableNumber;
    if (!tableNumber) return;

    const companyGuid = this.route.snapshot.queryParamMap.get('c');
    if (!companyGuid) {
      void this.router.navigate(['/customer/welcome']);
      return;
    }

    const num = Number(tableNumber);
    this.api.get<{ id: string; number: number }[]>('tables', { companyId: companyGuid }).subscribe({
      next: (tables) => {
        const list = Array.isArray(tables) ? tables : [];
        const table = list.find((t) => t.number === num || Number(t.number) === num);
        if (!table) {
          this.errorMessage.set("We can't find that table. Please check the number or ask a waiter.");
          return;
        }
        this.haptics.thumpShort();
        this.checkSameTableUnpaidThenProceed(
          table.id,
          () => {
            this.sessionService.getScanStatus(table.id, companyGuid).subscribe({
              next: (status) => {
                if (status.hasActiveSession && status.sessionId) {
                  const session = this.sessionService.currentSessionSnapshot;
                  if (session?.tableId === table.id && session.id === status.sessionId) {
                    void this.router.navigate(['/customer/menu']);
                    return;
                  }
                  const sheetRef = this.bottomSheet.open(JoinTableSheetComponent, {
                    data: {
                      tableNumber: status.tableNumber ?? table.number,
                      sessionId: status.sessionId,
                      participants: status.participants ?? [],
                    },
                    panelClass: 'dc-join-table-sheet',
                  });
                  sheetRef.afterDismissed().subscribe((join) => {
                    if (join === true) {
                      void this.router.navigate(['/customer/register'], {
                        queryParams: {
                          c: companyGuid,
                          t: String(table.number),
                          tableId: table.id,
                          sid: status.sessionId,
                        },
                        queryParamsHandling: '',
                      });
                    }
                  });
                } else {
                  void this.router.navigate(['/customer/register'], {
                    queryParams: { c: companyGuid, tableId: table.id, t: table.number },
                    queryParamsHandling: '',
                  });
                }
              },
              error: () => {
                void this.router.navigate(['/customer/register'], {
                  queryParams: { c: companyGuid, tableId: table.id, t: table.number },
                  queryParamsHandling: '',
                });
              },
            });
          },
        );
      },
      error: () => {
        this.errorMessage.set("We can't find that table. Please check the number or ask a waiter.");
      },
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }
}
