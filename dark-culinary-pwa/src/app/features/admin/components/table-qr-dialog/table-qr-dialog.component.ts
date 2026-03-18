import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import QRCode from 'qrcode';

export interface TableQRDialogData {
  tableNumber: number;
  customerUrl: string;
}

@Component({
  selector: 'app-table-qr-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>QR code – Table {{ data.tableNumber }}</h2>
    <mat-dialog-content>
      <p class="hint">Customers scan this code to open the menu for this table.</p>
      <div class="qr-wrap">
        <canvas #qrCanvas class="qr-canvas"></canvas>
      </div>
      <p class="url-text">{{ data.customerUrl }}</p>
      <a [href]="data.customerUrl" target="_blank" rel="noopener" class="link">Open link</a>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="downloadPng()">
        <mat-icon>download</mat-icon>
        Download PNG
      </button>
      <button mat-flat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .hint {
        margin: 0 0 1rem 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
      .qr-wrap {
        display: flex;
        justify-content: center;
        padding: 1rem;
        background: #fff;
        border-radius: 12px;
        margin-bottom: 1rem;
      }
      .qr-canvas {
        display: block;
      }
      .url-text {
        margin: 0 0 0.5rem 0;
        font-size: 0.75rem;
        color: var(--text-muted);
        word-break: break-all;
      }
      .link {
        font-size: 0.875rem;
        color: var(--accent-primary);
      }
      .link:hover {
        text-decoration: underline;
      }
      mat-dialog-actions button mat-icon {
        margin-right: 0.35rem;
        vertical-align: middle;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableQRDialogComponent implements AfterViewInit {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly ref = inject(MatDialogRef<TableQRDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: TableQRDialogData) {}

  ngAfterViewInit(): void {
    const canvas = this.qrCanvas?.nativeElement;
    if (!canvas || !this.data.customerUrl) return;
    QRCode.toCanvas(canvas, this.data.customerUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).catch((err) => console.warn('QR render failed', err));
  }

  downloadPng(): void {
    const canvas = this.qrCanvas?.nativeElement;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-${this.data.tableNumber}-qr.png`;
    a.click();
  }
}
