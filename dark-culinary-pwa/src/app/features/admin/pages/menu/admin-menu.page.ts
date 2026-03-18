import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { CompanyContextService } from '../../../../core/services/company-context.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MenuItemDialogComponent, MenuItemFormValue } from '../../components/menu-item-dialog/menu-item-dialog.component';
import type { MenuItemConfiguration } from '../../../../core/models/modifier.model';
import { AppCurrencyPipe } from '../../../../core/pipes/app-currency.pipe';

interface MenuRow {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
}

const CATEGORIES = ['All', 'APPETIZER', 'MAIN_COURSE', 'DESSERT', 'BEVERAGE', 'SIDE'];

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatSlideToggleModule,
    AppCurrencyPipe,
  ],
  template: `
    <div class="admin-page">
      <h2 class="dc-heading">Menu management</h2>

      <div class="toolbar">
        <mat-form-field appearance="outline" class="search">
          <mat-label>Search</mat-label>
          <input matInput [(ngModel)]="searchQuery" (ngModelChange)="applyFilter()" />
        </mat-form-field>
        <div class="chips">
          <mat-chip-set>
            @for (cat of categories; track cat) {
              <mat-chip [class.selected]="categoryFilter === cat" (click)="setCategory(cat)">{{ cat }}</mat-chip>
            }
          </mat-chip-set>
        </div>
      </div>

      <div *ngIf="filteredItems.length > 0" class="list">
        <div *ngFor="let item of filteredItems" class="row">
          <span class="name">{{ item.name }}</span>
          <span class="cat">{{ item.category }}</span>
          <span class="price">{{ item.price | appCurrency }}</span>
          <mat-slide-toggle [checked]="item.available" (change)="toggleAvailability(item)"></mat-slide-toggle>
          <div class="actions">
            <button mat-icon-button (click)="editItem(item)" aria-label="Edit">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteItem(item)" aria-label="Delete">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
      </div>
      <p *ngIf="filteredItems.length === 0 && !loading">No menu items.</p>
      <p *ngIf="loading">Loading…</p>

      <button mat-fab color="primary" class="fab" (click)="addItem()" aria-label="Add item">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: [
    `
      .admin-page { display: flex; flex-direction: column; gap: 1rem; position: relative; padding-bottom: 80px; }
      .toolbar { display: flex; flex-direction: column; gap: 0.75rem; }
      .search { width: 100%; max-width: 320px; }
      .chips mat-chip-set { display: flex; flex-wrap: wrap; gap: 0.35rem; }
      .chips mat-chip { cursor: pointer; }
      .chips mat-chip.selected { background: var(--accent-primary); color: var(--text-inverse); }
      .list { display: flex; flex-direction: column; gap: 0.5rem; }
      .row {
        display: grid;
        grid-template-columns: 1fr auto auto auto auto;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--border-subtle);
      }
      .row .name { font-weight: 500; }
      .row .cat { color: var(--text-secondary); font-size: 0.9rem; }
      .row .actions { display: flex; gap: 0.25rem; }
      .fab { position: fixed; bottom: 1.5rem; right: 1.5rem; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMenuPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);

  items: MenuRow[] = [];
  filteredItems: MenuRow[] = [];
  loading = true;
  searchQuery = '';
  categoryFilter = 'All';
  categories = CATEGORIES;
  companyId: string | null = null;

  ngOnInit(): void {
    this.companyContext.companyId$.subscribe((companyId: string | null) => {
      this.companyId = companyId;
      if (!companyId) return;
      this.load();
    });
  }

  private load(): void {
    if (!this.companyId) return;
    this.loading = true;
    this.cdr.markForCheck();
    this.api.get<Record<string, unknown>[]>('menu', { companyId: this.companyId }).subscribe({
      next: (list) => {
        this.items = (Array.isArray(list) ? list : []).map((item) => ({
          id: String(item['id'] ?? ''),
          name: String(item['name'] ?? ''),
          description: item['description'] as string | undefined,
          price: Number(item['price'] ?? item['price'] ?? 0),
          category: String(item['category'] ?? ''),
          available: item['isAvailable'] !== false && item['available'] !== false,
        }));
        this.applyFilter();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  applyFilter(): void {
    let out = this.items;
    if (this.categoryFilter !== 'All') {
      out = out.filter((i) => i.category === this.categoryFilter);
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      out = out.filter((i) => i.name.toLowerCase().includes(q) || (i.description?.toLowerCase().includes(q)));
    }
    this.filteredItems = out;
    this.cdr.markForCheck();
  }

  setCategory(cat: string): void {
    this.categoryFilter = cat;
    this.applyFilter();
  }

  addItem(): void {
    const ref = this.dialog.open(MenuItemDialogComponent, {
      width: '520px',
      data: { companyId: this.companyId! },
    });
    ref.afterClosed().subscribe((result: MenuItemFormValue | undefined) => {
      if (!result || !this.companyId) return;
      const { linkedModifierGroupIds, bundleSlots, ...menuPayload } = result;
      this.api.post<{ id: string }>('menu', { ...menuPayload, companyId: this.companyId, isBundle: result.isBundle ?? false }).subscribe({
        next: (res) => {
          const newId = res?.id;
          if (newId) {
            this.syncModifiersAndSlots(newId, [], linkedModifierGroupIds ?? [], [], bundleSlots ?? []);
          }
          this.notifications.success('Item added');
          this.load();
        },
        error: () => this.notifications.error('Failed to add item'),
      });
    });
  }

  editItem(item: MenuRow): void {
    const ref = this.dialog.open(MenuItemDialogComponent, {
      width: '520px',
      data: {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        isAvailable: item.available,
        companyId: this.companyId!,
      },
    });
    ref.afterClosed().subscribe((result: MenuItemFormValue | undefined) => {
      if (!result) return;
      const { linkedModifierGroupIds, bundleSlots, ...menuPayload } = result;
      this.api.put(`menu/${item.id}`, { ...menuPayload, isBundle: result.isBundle ?? false }).subscribe({
        next: () => {
          this.api.getMenuItemConfiguration(item.id).subscribe({
            next: (config: MenuItemConfiguration) => {
              const prevGroupIds = (config.modifierGroups ?? []).map((g) => g.id);
              const prevSlots = (config.bundleSlots ?? []).map((s) => ({ id: s.id, name: s.name, isRequired: s.isRequired, allowedMenuItemIds: (s.allowedItems ?? []).map((i) => i.id) }));
              this.syncModifiersAndSlots(item.id, prevGroupIds, linkedModifierGroupIds ?? [], prevSlots, bundleSlots ?? []);
            },
            error: () => {},
          });
          this.notifications.success('Item updated');
          this.load();
        },
        error: () => this.notifications.error('Failed to update item'),
      });
    });
  }

  private syncModifiersAndSlots(
    menuItemId: string,
    prevGroupIds: string[],
    nextGroupIds: string[],
    prevSlots: Array<{ id?: string; name: string; isRequired: boolean; allowedMenuItemIds: string[] }>,
    nextSlots: Array<{ id?: string; name: string; isRequired: boolean; allowedMenuItemIds: string[] }>
  ): void {
    nextGroupIds.forEach((groupId) => {
      if (!prevGroupIds.includes(groupId)) {
        this.api.linkModifierGroupToMenuItem(menuItemId, { modifierGroupId: groupId }).subscribe();
      }
    });
    prevGroupIds.forEach((groupId) => {
      if (!nextGroupIds.includes(groupId)) {
        this.api.unlinkModifierGroupFromMenuItem(menuItemId, groupId).subscribe();
      }
    });
    const nextSlotIds = new Set(nextSlots.filter((s) => s.id).map((s) => s.id!));
    prevSlots.forEach((s) => {
      if (s.id && !nextSlotIds.has(s.id)) {
        this.api.deleteBundleSlot(s.id).subscribe();
      }
    });
    nextSlots.forEach((slot) => {
      if (slot.id) {
        this.api.updateBundleSlot(slot.id, { name: slot.name, isRequired: slot.isRequired, allowedMenuItemIds: slot.allowedMenuItemIds }).subscribe();
      } else {
        this.api.createBundleSlot(menuItemId, { name: slot.name, isRequired: slot.isRequired, allowedMenuItemIds: slot.allowedMenuItemIds }).subscribe();
      }
    });
  }

  deleteItem(item: MenuRow): void {
    if (!confirm(`Delete "${item.name}"?`)) return;
    this.api.delete(`menu/${item.id}`).subscribe({
      next: () => { this.notifications.success('Item deleted'); this.load(); },
      error: () => this.notifications.error('Failed to delete item'),
    });
  }

  toggleAvailability(item: MenuRow): void {
    const next = !item.available;
    this.api.put(`menu/${item.id}`, { ...item, isAvailable: next, available: next }).subscribe({
      next: () => { item.available = next; this.applyFilter(); this.cdr.markForCheck(); },
      error: () => this.notifications.error('Failed to update availability'),
    });
  }
}
