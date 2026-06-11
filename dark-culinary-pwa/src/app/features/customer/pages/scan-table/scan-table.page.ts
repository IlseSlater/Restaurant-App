import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { TopAppBarComponent } from '../../../../shared/components/top-app-bar/top-app-bar.component';
import { ThemeService } from '../../../../core/services/theme.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../../core/services/api.service';
import { HapticService } from '../../../../core/services/haptic.service';
import { CustomerSessionService } from '../../services/customer-session.service';
import {
  CustomerTableArrivalService,
  TableQrArrivalInput,
} from '../../services/customer-table-arrival.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { StorageService } from '../../../../core/services/storage.service';
import { GlassCardComponent } from '../../../../shared/components/glass-card/glass-card.component';
import { take } from 'rxjs';

const SESSION_KEY = 'dark_culinary_customer_session';

function parseTableLinkParams(
  params: URLSearchParams,
): { companyGuid: string | null; tableNumber: string | null; tableId: string | null } {
  return {
    companyGuid: params.get('c') ?? params.get('company'),
    tableNumber: params.get('t') ?? params.get('table'),
    tableId: params.get('tableId'),
  };
}

@Component({
  selector: 'app-scan-table',
  standalone: true,
  imports: [
    CommonModule,
    GlassCardComponent,
    TopAppBarComponent,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="scan">
      <header class="scan-header">
        <app-top-app-bar
          title="Find your table"
          [brandName]="companyName()"
          [brandLogo]="companyLogo()"
          [showBack]="true"
          [glass]="true"
          (back)="goBack()"
        />
      </header>
      <div class="scan-header-spacer" aria-hidden="true"></div>

      @if (companyName() || companyLogo()) {
        <div class="brand-hero">
          @if (companyLogo()) {
            <img
              [src]="companyLogo()"
              [alt]="companyName() || 'Restaurant logo'"
              class="brand-hero-logo"
            />
          } @else {
            <div class="brand-hero-fallback" aria-hidden="true">
              <mat-icon>storefront</mat-icon>
            </div>
          }
          @if (companyName()) {
            <h2 class="brand-hero-name">{{ companyName() }}</h2>
          }
          @if (companyAddress()) {
            <p class="brand-hero-address">{{ companyAddress() }}</p>
          }
        </div>
      }

      <p class="dc-body scan-intro">Scan the QR code on your table stand to get started.</p>

      @if (rejoinSession()) {
        <div class="rejoin-banner">
          <p>You're at Table {{ rejoinSession()?.tableNumber ?? '?' }} as <strong>{{ rejoinSession()?.customerName }}</strong></p>
          <button mat-flat-button color="primary" type="button" (click)="rejoinMySession()">
            Rejoin my session
          </button>
        </div>
      }

      @if (pendingTableMove(); as move) {
        <app-glass-card>
          <div class="move-card">
            <p>You already have an active session. Move it to <strong>Table {{ move.tableNumber }}</strong>?</p>
            <button mat-flat-button color="primary" type="button" (click)="confirmMoveToPendingTable()">
              Move my session
            </button>
            <button mat-button type="button" (click)="startNewSessionInstead()">
              Start new session instead
            </button>
          </div>
        </app-glass-card>
      }

      @if (!pendingTableMove()) {
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
          @if (errorMessage()) {
            <div class="error-chip" role="alert">
              <mat-icon>error</mat-icon>
              {{ errorMessage() }}
            </div>
          }
        </app-glass-card>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        margin: calc(-1 * var(--space-4));
        margin-bottom: -5rem;
      }
      .scan {
        padding: 0 1rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .scan-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        background: var(--bg-nav);
        backdrop-filter: blur(20px) saturate(1.2);
        -webkit-backdrop-filter: blur(20px) saturate(1.2);
      }
      .scan-header-spacer {
        height: 3.5rem;
        flex-shrink: 0;
      }
      .brand-hero {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        text-align: center;
        padding: 0.25rem 0 0.5rem;
      }
      .brand-hero-logo,
      .brand-hero-fallback {
        width: 64px;
        height: 64px;
        border-radius: 14px;
      }
      .brand-hero-logo {
        object-fit: cover;
        border: 1px solid var(--border-subtle);
        box-shadow: var(--shadow-md);
      }
      .brand-hero-fallback {
        background: var(--accent-primary-soft);
        color: var(--accent-primary);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .brand-hero-fallback mat-icon {
        font-size: 1.75rem;
        width: 1.75rem;
        height: 1.75rem;
      }
      .brand-hero-name {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
      }
      .brand-hero-address {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-secondary);
        max-width: 20rem;
      }
      .scan-intro {
        margin: 0;
        text-align: center;
        color: var(--text-secondary);
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
      .error-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        margin-top: 1rem;
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
      .move-card {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .move-card p {
        margin: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanTablePage implements OnDestroy, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly haptics = inject(HapticService);
  private readonly ngZone = inject(NgZone);
  private readonly sessionService = inject(CustomerSessionService);
  private readonly tableArrival = inject(CustomerTableArrivalService);
  private readonly storage = inject(StorageService);
  private readonly notifications = inject(NotificationService);
  private readonly themeService = inject(ThemeService);

  readonly companyName = signal('');
  readonly companyLogo = signal<string | null>(null);
  readonly companyAddress = signal<string | null>(null);

  @ViewChild('videoElement') private videoElement?: ElementRef<HTMLVideoElement>;
  private mediaStream: MediaStream | null = null;
  private scanFrameId: number | null = null;
  private handlingQr = false;
  private pendingQrArrival: TableQrArrivalInput | null = null;

  readonly cameraAllowed = signal(false);
  readonly processingScan = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly pendingTableMove = signal<{ tableId: string; tableNumber: number; companyGuid: string } | null>(null);

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

  goBack(): void {
    void this.router.navigate(['/customer/welcome']);
  }

  private loadCompanyBranding(companyId: string): void {
    this.api
      .get<{
        name?: string;
        logo?: string | null;
        primaryColor?: string | null;
        secondaryColor?: string | null;
        address?: string | null;
      }>(`companies/${companyId}`)
      .subscribe({
        next: (company) => {
          this.companyName.set(company?.name ?? '');
          this.companyLogo.set(company?.logo ?? null);
          this.companyAddress.set(company?.address ?? null);
          if (company?.primaryColor || company?.secondaryColor) {
            this.themeService.applyCompanyTheme({
              accentPrimary: company.primaryColor ?? undefined,
              accentSecondary: company.secondaryColor ?? undefined,
              logoUrl: company.logo ?? undefined,
            });
          }
        },
      });
  }

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    const moveTableId = params.get('moveTableId');
    const moveTableNumberRaw = params.get('moveTableNumber');
    const moveTableNumber = Number(moveTableNumberRaw);
    const current =
      this.sessionService.currentSessionSnapshot ??
      this.storage.get<{ id?: string; tableId?: string; companyId?: string }>(SESSION_KEY);
    const companyGuid = this.resolveCompanyGuid();
    if (
      moveTableId &&
      companyGuid &&
      Number.isFinite(moveTableNumber) &&
      current?.id
    ) {
      this.pendingTableMove.set({
        tableId: moveTableId,
        tableNumber: moveTableNumber,
        companyGuid,
      });
    }

    const qrCompany = params.get('c') ?? params.get('company');
    const qrTable = params.get('t') ?? params.get('table');
    const qrTableId = params.get('tableId');
    if (qrCompany && qrTable && !moveTableId) {
      this.pendingQrArrival = {
        companyGuid: qrCompany,
        tableNumber: qrTable,
        tableId: qrTableId,
      };
      return;
    }

    if (companyGuid) {
      this.loadCompanyBranding(companyGuid);
    }
  }

  ngAfterViewInit(): void {
    if (this.pendingQrArrival) {
      const arrival = this.pendingQrArrival;
      this.pendingQrArrival = null;
      this.processingScan.set(true);
      this.tableArrival.handleTableQrArrival(arrival).subscribe({
        complete: () => this.processingScan.set(false),
        error: () => {
          this.processingScan.set(false);
          this.beginScanning();
        },
      });
      return;
    }
    if (!this.pendingTableMove()) {
      this.beginScanning();
    }
  }

  private resolveCompanyGuid(): string | null {
    const params = this.route.snapshot.queryParamMap;
    return (
      params.get('c') ??
      params.get('company') ??
      this.sessionService.currentSessionSnapshot?.companyId ??
      this.storage.get<{ companyId?: string }>(SESSION_KEY)?.companyId ??
      null
    );
  }

  private beginScanning(): void {
    if (this.pendingTableMove()) return;
    if (typeof window !== 'undefined' && !(window as Window & { BarcodeDetector?: unknown }).BarcodeDetector) {
      this.errorMessage.set(
        'QR scanning is not supported in this browser. Open the QR code with your phone camera instead.',
      );
      return;
    }
    this.requestCamera();
  }

  requestCamera(): void {
    this.errorMessage.set(null);
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          this.cameraAllowed.set(true);
          this.attachStreamWhenReady(stream);
        })
        .catch(() => {
          this.errorMessage.set('Camera access denied. Allow camera access to scan the table QR code.');
        });
    } else {
      this.errorMessage.set('Camera not supported on this device. Open the QR code with your phone camera instead.');
    }
  }

  confirmMoveToPendingTable(): void {
    const move = this.pendingTableMove();
    const current =
      this.sessionService.currentSessionSnapshot ??
      this.storage.get<{ id?: string; tableId?: string; companyId?: string }>(SESSION_KEY);
    if (!move || !current?.id) {
      this.pendingTableMove.set(null);
      return;
    }
    this.sessionService
      .moveSessionToTable(current.id, move.tableId, {
        currentTableId: current.tableId,
        companyId: current.companyId ?? move.companyGuid,
      })
      .pipe(take(1))
      .subscribe({
      next: () => {
        this.pendingTableMove.set(null);
        this.notifications.success(`Moved your session to Table ${move.tableNumber}.`);
        void this.router.navigate(['/customer/menu']);
      },
      error: (err) => {
        const status = Number(err?.status ?? err?.error?.statusCode);
        const message =
          status === 404 || status === 405
            ? 'Table transfer is unavailable right now. Please try again in a moment.'
            : (err?.error?.message ?? 'Could not move your session to this table.');
        this.notifications.error(message);
      },
    });
  }

  startNewSessionInstead(): void {
    const move = this.pendingTableMove();
    this.pendingTableMove.set(null);
    if (!move) return;
    const ctx = {
      companyGuid: move.companyGuid,
      tableId: move.tableId,
      tableNumber: String(move.tableNumber),
    };
    if (this.tableArrival.hasStoredProfile()) {
      this.tableArrival.beginWithStoredProfile(ctx).subscribe({ error: () => undefined });
      return;
    }
    this.tableArrival.goToRegister(ctx);
  }

  private attachStreamWhenReady(stream: MediaStream, attempt = 0): void {
    const video = this.videoElement?.nativeElement;
    if (!video) {
      if (attempt < 60) {
        requestAnimationFrame(() => this.attachStreamWhenReady(stream, attempt + 1));
        return;
      }
      stream.getTracks().forEach((track) => track.stop());
      this.errorMessage.set('Could not start the camera preview. Tap Allow Camera Access to try again.');
      return;
    }

    this.mediaStream = stream;
    video.srcObject = stream;
    void video.play().catch(() => {
      // Ignore autoplay-related errors; user interaction will trigger play if needed.
    });
    this.startScanLoop();
  }

  private startScanLoop(): void {
    if (typeof window === 'undefined') return;
    const anyWindow = window as Window & {
      BarcodeDetector?: new (opts: { formats: string[] }) => {
        detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
      };
    };
    const BarcodeDetectorCtor = anyWindow.BarcodeDetector;
    if (!BarcodeDetectorCtor) {
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

      const { companyGuid, tableNumber, tableId: tableIdFromQr } = url
        ? parseTableLinkParams(url.searchParams)
        : { companyGuid: null, tableNumber: null, tableId: null };
      if (!companyGuid || !tableNumber) {
        this.processingScan.set(false);
        this.errorMessage.set('That is not a valid table QR code. Scan the code on your table stand.');
        this.handlingQr = false;
        this.beginScanning();
        return;
      }
      const arrival: TableQrArrivalInput = {
        companyGuid,
        tableNumber,
        tableId: tableIdFromQr,
      };
      this.tableArrival.handleTableQrArrival(arrival).subscribe({
        complete: () => {
          this.processingScan.set(false);
          this.handlingQr = false;
        },
        error: () => {
          this.processingScan.set(false);
          this.handlingQr = false;
          this.beginScanning();
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

  ngOnDestroy(): void {
    this.stopCamera();
  }
}
