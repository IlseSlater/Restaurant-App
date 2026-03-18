import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { CompanyContextService } from '../../../../core/services/company-context.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AdjustStockDialogComponent } from '../../components/adjust-stock-dialog/adjust-stock-dialog.component';
import { InventoryItemDialogComponent } from '../../components/inventory-item-dialog/inventory-item-dialog.component';

interface InvItem {
  id: string;
  name: string;
  currentStock: number;
  minStockLevel: number;
  type?: string;
  status?: string;
  category?: string;
}

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="admin-page">
      <h2 class="dc-heading">Inventory</h2>

      @if (summary) {
        <div class="summary">
          <span>Total items: {{ summary.totalItems }}</span>
          <span>Low stock: {{ summary.lowStockCount }}</span>
        </div>
      }

      <div class="toolbar">
        <mat-form-field appearance="outline">
          <mat-label>Filter</mat-label>
          <mat-select [(value)]="statusFilter" (selectionChange)="applyFilter()">
            <mat-option value="all">All</mat-option>
            <mat-option value="low">Low stock</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div *ngIf="filteredItems.length > 0" class="list">
        <div
          *ngFor="let i of filteredItems"
          class="row"
          [class.low-stock]="i.currentStock <= i.minStockLevel"
        >
          <span class="name">{{ i.name }}</span>
          <span>Current: {{ i.currentStock }}, Min: {{ i.minStockLevel }}</span>
          <div class="actions">
            <button mat-button (click)="adjustStock(i)">Adjust</button>
            <button mat-icon-button (click)="editItem(i)" aria-label="Edit"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button color="warn" (click)="deleteItem(i)" aria-label="Delete"><mat-icon>delete</mat-icon></button>
          </div>
        </div>
      </div>
      <p *ngIf="filteredItems.length === 0 && !loading">No inventory items.</p>
      <p *ngIf="loading">Loading…</p>

      <button mat-flat-button color="primary" (click)="addItem()" class="add-btn">
        <mat-icon>add</mat-icon>
        Add item
      </button>
    </div>
  `,
  styles: [
    `
      .admin-page { display: flex; flex-direction: column; gap: 1rem; }
      .summary { display: flex; gap: 1rem; font-size: 0.95rem; color: var(--text-secondary); }
      .list { display: flex; flex-direction: column; gap: 0.5rem; }
      .row {
        display: grid;
        grid-template-columns: 1fr auto auto;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--border-subtle);
      }
      .row.low-stock { background: var(--status-error-soft); border-radius: var(--radius-sm); padding: 0.5rem; }
      .actions { display: flex; gap: 0.25rem; align-items: center; }
      .add-btn { align-self: flex-start; }
      .add-btn mat-icon { margin-right: 0.5rem; vertical-align: middle; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminInventoryPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);

  items: InvItem[] = [];
  filteredItems: InvItem[] = [];
  summary: { totalItems: number; lowStockCount: number } | null = null;
  loading = true;
  statusFilter = 'all';
  companyId: string | null = null;

  ngOnInit(): void {
    this.companyContext.companyId$.subscribe((companyId: string | null) => {
      this.companyId = companyId;
      if (!companyId) return;
      this.load();
      this.loadSummary(companyId);
    });
  }

  private load(): void {
    if (!this.companyId) return;
    this.loading = true;
    this.cdr.markForCheck();
    this.api.get<Record<string, unknown>[]>('inventory/items/company/' + this.companyId).subscribe({
      next: (list) => {
        this.items = (Array.isArray(list) ? list : []).map((i) => ({
          id: String(i['id'] ?? ''),
          name: String(i['name'] ?? ''),
          currentStock: Number(i['currentStock'] ?? i['currentStock'] ?? 0),
          minStockLevel: Number(i['minStockLevel'] ?? i['minStockLevel'] ?? 0),
          type: i['type'] as string | undefined,
          status: i['status'] as string | undefined,
          category: i['category'] as string | undefined,
        }));
        this.applyFilter();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  private loadSummary(companyId: string): void {
    this.api.get<{ totalItems?: number; lowStockCount?: number }>('inventory/summary/company/' + companyId).subscribe({
      next: (s) => {
        this.summary = { totalItems: s.totalItems ?? 0, lowStockCount: s.lowStockCount ?? 0 };
        this.cdr.markForCheck();
      },
    });
  }

  applyFilter(): void {
    if (this.statusFilter === 'low') {
      this.filteredItems = this.items.filter((i) => i.currentStock <= i.minStockLevel);
    } else {
      this.filteredItems = this.items;
    }
    this.cdr.markForCheck();
  }

  addItem(): void {
    const ref = this.dialog.open(InventoryItemDialogComponent, { width: '360px', data: null });
    ref.afterClosed().subscribe((result: { name: string; currentStock: number; minStockLevel: number } | undefined) => {
      if (!result || !this.companyId) return;
      this.api.post('inventory/items', { ...result, companyId: this.companyId }).subscribe({
        next: () => { this.notifications.success('Item added'); this.load(); this.companyId && this.loadSummary(this.companyId); },
        error: () => this.notifications.error('Failed to add'),
      });
    });
  }

  editItem(i: InvItem): void {
    const ref = this.dialog.open(InventoryItemDialogComponent, {
      width: '360px',
      data: { id: i.id, name: i.name, currentStock: i.currentStock, minStockLevel: i.minStockLevel },
    });
    ref.afterClosed().subscribe((result: { name: string; currentStock: number; minStockLevel: number } | undefined) => {
      if (!result) return;
      this.api.put('inventory/items/' + i.id, result).subscribe({
        next: () => { this.notifications.success('Item updated'); this.load(); this.companyId && this.loadSummary(this.companyId); },
        error: () => this.notifications.error('Failed to update'),
      });
    });
  }

  deleteItem(i: InvItem): void {
    if (!confirm(`Delete ${i.name}?`)) return;
    this.api.delete('inventory/items/' + i.id).subscribe({
      next: () => { this.notifications.success('Deleted'); this.load(); this.companyId && this.loadSummary(this.companyId); },
      error: () => this.notifications.error('Failed to delete'),
    });
  }

  adjustStock(i: InvItem): void {
    const ref = this.dialog.open(AdjustStockDialogComponent, {
      width: '320px',
      data: { id: i.id, name: i.name, currentStock: i.currentStock },
    });
    ref.afterClosed().subscribe((delta: number | undefined) => {
      if (delta === undefined) return;
      this.api.post('inventory/items/' + i.id + '/adjust', { delta }).subscribe({
        next: () => { this.notifications.success('Stock updated'); this.load(); this.companyId && this.loadSummary(this.companyId); },
        error: () => this.notifications.error('Failed to adjust'),
      });
    });
  }
}
