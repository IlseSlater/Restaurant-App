import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { CompanyContextService } from '../../../../core/services/company-context.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { TableFormDialogComponent } from '../../components/table-form-dialog/table-form-dialog.component';
import { TableQRDialogComponent } from '../../components/table-qr-dialog/table-qr-dialog.component';

interface TableRow {
  id: string;
  number: number;
  status: string;
  qrCode?: string;
}

@Component({
  selector: 'app-admin-tables',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="admin-page">
      <h2 class="dc-heading">Table management</h2>

      <div *ngIf="tables.length > 0" class="list">
        <div *ngFor="let t of tables" class="row">
          <span>Table {{ t.number }}</span>
          <span class="status">{{ t.status }}</span>
          @if (baseUrl && companyId) {
            <a [href]="customerUrl(t)" target="_blank" rel="noopener" class="link">Customer URL</a>
          }
          <div class="actions">
            <button mat-icon-button (click)="showQR(t)" aria-label="Show QR code"><mat-icon>qr_code_2</mat-icon></button>
            <button mat-icon-button (click)="editTable(t)" aria-label="Edit"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button (click)="clearTable(t)" aria-label="Clear"><mat-icon>cleaning_services</mat-icon></button>
            <button mat-icon-button color="warn" (click)="deleteTable(t)" aria-label="Delete"><mat-icon>delete</mat-icon></button>
          </div>
        </div>
      </div>
      <p *ngIf="tables.length === 0 && !loading">No tables.</p>
      <p *ngIf="loading">Loading…</p>

      <button mat-flat-button color="primary" (click)="addTable()" class="add-btn">
        <mat-icon>add</mat-icon>
        Add table
      </button>
    </div>
  `,
  styles: [
    `
      .admin-page { display: flex; flex-direction: column; gap: 1rem; }
      .list { display: flex; flex-direction: column; gap: 0.5rem; }
      .row {
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--border-subtle);
      }
      .row .actions {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
      }
      .row .status { color: var(--text-secondary); }
      .row .link { font-size: 0.85rem; }
      .add-btn { align-self: flex-start; }
      .add-btn mat-icon { margin-right: 0.5rem; vertical-align: middle; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTablesPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  tables: TableRow[] = [];
  loading = true;
  companyId: string | null = null;
  companyGuid = '';
  baseUrl = '';

  ngOnInit(): void {
    this.companyGuid = this.route.snapshot.paramMap.get('companyGuid') ?? '';
    if (typeof window !== 'undefined') this.baseUrl = window.location.origin;
    this.companyContext.companyId$.subscribe((companyId: string | null) => {
      this.companyId = companyId;
      if (!companyId) return;
      this.load();
    });
  }

  customerUrl(t: TableRow): string {
    if (!this.baseUrl || !this.companyId) {
      return '';
    }
    return `${this.baseUrl}/customer/welcome?c=${this.companyId}&t=${t.number}&tableId=${t.id}`;
  }

  private load(): void {
    if (!this.companyId) return;
    this.loading = true;
    this.cdr.markForCheck();
    this.api.get<Record<string, unknown>[]>('tables', { companyId: this.companyId }).subscribe({
      next: (list) => {
        this.tables = (Array.isArray(list) ? list : []).map((t) => ({
          id: String(t['id'] ?? ''),
          number: Number(t['number'] ?? 0),
          status: String(t['status'] ?? ''),
          qrCode: t['qrCode'] as string | undefined,
        }));
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  addTable(): void {
    const ref = this.dialog.open(TableFormDialogComponent, { width: '320px', data: null });
    ref.afterClosed().subscribe((result: { number: number } | undefined) => {
      if (!result || !this.companyId) return;
      this.api.post('tables', { number: result.number, companyId: this.companyId }).subscribe({
        next: () => { this.notifications.success('Table added'); this.load(); },
        error: () => this.notifications.error('Failed to add table'),
      });
    });
  }

  editTable(t: TableRow): void {
    const ref = this.dialog.open(TableFormDialogComponent, { width: '320px', data: { id: t.id, number: t.number } });
    ref.afterClosed().subscribe((result: { number: number } | undefined) => {
      if (!result) return;
      this.api.put(`tables/${t.id}`, { number: result.number }).subscribe({
        next: () => { this.notifications.success('Table updated'); this.load(); },
        error: () => this.notifications.error('Failed to update table'),
      });
    });
  }

  clearTable(t: TableRow): void {
    if (!confirm(`Clear table ${t.number}?`)) return;
    this.api.post(`tables/${t.id}/clear`, {}).subscribe({
      next: () => { this.notifications.success('Table cleared'); this.load(); },
      error: () => this.notifications.error('Failed to clear table'),
    });
  }

  deleteTable(t: TableRow): void {
    if (!confirm(`Delete table ${t.number}?`)) return;
    this.api.delete(`tables/${t.id}`).subscribe({
      next: () => { this.notifications.success('Table deleted'); this.load(); },
      error: () => this.notifications.error('Failed to delete table'),
    });
  }

  showQR(t: TableRow): void {
    const customerUrl = this.customerUrl(t);
    this.dialog.open(TableQRDialogComponent, {
      width: '380px',
      data: { tableNumber: t.number, customerUrl },
    });
  }
}
