import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../../core/services/api.service';
import type { ModifierGroup, MenuItemConfiguration, BundleSlot } from '../../../../core/models/modifier.model';
import { forkJoin } from 'rxjs';

export interface MenuItemFormValue {
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  isBundle?: boolean;
  linkedModifierGroupIds?: string[];
  bundleSlots?: Array<{ id?: string; name: string; isRequired: boolean; allowedMenuItemIds: string[] }>;
}

export interface MenuItemDialogData {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  isAvailable?: boolean;
  isBundle?: boolean;
  companyId?: string;
}

const CATEGORIES = ['APPETIZER', 'MAIN_COURSE', 'DESSERT', 'BEVERAGE', 'SIDE'];

@Component({
  selector: 'app-menu-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data?.id ? 'Edit item' : 'Add item' }}</h2>
    <mat-dialog-content class="dialog-content">
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Price</mat-label>
          <input matInput type="number" formControlName="price" min="0" step="0.01" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Category</mat-label>
          <mat-select formControlName="category">
            @for (cat of categories; track cat) {
              <mat-option [value]="cat">{{ cat }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-slide-toggle formControlName="isAvailable">Available</mat-slide-toggle>

        <section class="modifier-section">
          <h3 class="section-heading">Modifier groups</h3>
          <div class="chips">
            @for (g of linkedModifierGroups; track g.id) {
              <span class="chip">
                {{ g.name }}
                <button type="button" class="chip-remove" (click)="unlinkGroup(g.id)" [attr.aria-label]="'Remove ' + g.name">
                  <mat-icon>close</mat-icon>
                </button>
              </span>
            }
          </div>
          <mat-form-field appearance="outline" class="add-group">
            <mat-label>Add modifier group</mat-label>
            <mat-select [(value)]="selectedGroupToAdd" (selectionChange)="linkSelectedGroup()">
              <mat-option [value]="null">— Select —</mat-option>
              @for (g of availableModifierGroups; track g.id) {
                <mat-option [value]="g.id">{{ g.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </section>

        <mat-slide-toggle formControlName="isBundle">Bundle / Special (multiple choices)</mat-slide-toggle>

        @if (form.get('isBundle')?.value) {
          <section class="bundle-section">
            <h3 class="section-heading">Bundle slots</h3>
            @for (slot of bundleSlots; track $index; let i = $index) {
              <div class="slot-row">
                <mat-form-field appearance="outline" class="slot-name">
                  <mat-label>Slot name</mat-label>
                  <input matInput [(ngModel)]="slot.name" [ngModelOptions]="{ standalone: true }" placeholder="e.g. Glass 1" />
                </mat-form-field>
                <mat-slide-toggle [(ngModel)]="slot.isRequired" [ngModelOptions]="{ standalone: true }">Required</mat-slide-toggle>
                <mat-form-field appearance="outline" class="slot-items">
                  <mat-label>Allowed items</mat-label>
                  <mat-select [(ngModel)]="slot.allowedMenuItemIds" [ngModelOptions]="{ standalone: true }" multiple>
                    @for (m of menuItems; track m.id) {
                      <mat-option [value]="m.id">{{ m.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <button mat-icon-button type="button" (click)="removeBundleSlot(i)" [attr.aria-label]="'Remove slot'">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }
            <button mat-stroked-button type="button" (click)="addBundleSlot()">
              <mat-icon>add</mat-icon> Add slot
            </button>
          </section>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-content { max-height: 70vh; overflow-y: auto; }
      .full-width { width: 100%; }
      .modifier-section, .bundle-section { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle); }
      .section-heading { font-size: 0.95rem; margin: 0 0 0.5rem; font-weight: 600; }
      .chips { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.5rem; }
      .chip {
        display: inline-flex; align-items: center; gap: 0.25rem;
        padding: 0.25rem 0.5rem; border-radius: var(--radius-pill);
        background: var(--bg-elevated); border: 1px solid var(--border-subtle);
        font-size: 0.85rem;
      }
      .chip-remove { background: none; border: none; cursor: pointer; padding: 0; line-height: 1; color: var(--text-muted); }
      .chip-remove:hover { color: var(--text-primary); }
      .chip-remove mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
      .add-group { width: 100%; max-width: 260px; }
      .slot-row {
        display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;
        padding: 0.5rem 0; border-bottom: 1px solid var(--border-subtle); margin-bottom: 0.5rem;
      }
      .slot-row .slot-name { flex: 1; min-width: 120px; }
      .slot-row .slot-items { flex: 2; min-width: 180px; }
    `,
  ],
})
export class MenuItemDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    category: ['MAIN_COURSE', Validators.required],
    isAvailable: [true],
    isBundle: [false],
  });

  categories = CATEGORIES;
  linkedModifierGroupIds: string[] = [];
  linkedModifierGroups: ModifierGroup[] = [];
  allModifierGroups: ModifierGroup[] = [];
  get availableModifierGroups(): ModifierGroup[] {
    return this.allModifierGroups.filter((g) => !this.linkedModifierGroupIds.includes(g.id));
  }
  selectedGroupToAdd: string | null = null;
  bundleSlots: Array<{ id?: string; name: string; isRequired: boolean; allowedMenuItemIds: string[] }> = [];
  menuItems: Array<{ id: string; name: string }> = [];
  configLoaded = false;

  constructor(
    public ref: MatDialogRef<MenuItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MenuItemDialogData | null
  ) {
    if (data?.name !== undefined) {
      this.form.patchValue({
        name: data.name,
        description: data.description ?? '',
        price: data.price ?? 0,
        category: data.category ?? 'MAIN_COURSE',
        isAvailable: data.isAvailable !== false,
        isBundle: data.isBundle ?? false,
      });
    }
  }

  ngOnInit(): void {
    const companyId = this.data?.companyId;
    if (!companyId) return;
    this.api.get<Array<{ id: string; name: string }>>('menu', { companyId }).subscribe({
      next: (list) => {
        this.menuItems = Array.isArray(list) ? list.map((m) => ({ id: m.id, name: m.name })) : [];
      },
    });
    this.api.getModifierGroups(companyId).subscribe({
      next: (groups) => {
        this.allModifierGroups = groups ?? [];
      },
    });
    if (this.data?.id) {
      this.api.getMenuItemConfiguration(this.data.id).subscribe({
        next: (config: MenuItemConfiguration) => {
          this.linkedModifierGroupIds = (config.modifierGroups ?? []).map((g) => g.id);
          this.linkedModifierGroups = (config.modifierGroups ?? []).map((g) => ({ ...g, options: g.options ?? [] }));
          this.bundleSlots = (config.bundleSlots ?? []).map((s: BundleSlot) => ({
            id: s.id,
            name: s.name,
            isRequired: s.isRequired ?? true,
            allowedMenuItemIds: (s.allowedItems ?? []).map((i) => i.id),
          }));
          this.configLoaded = true;
        },
        error: () => {
          this.configLoaded = true;
        },
      });
    } else {
      this.configLoaded = true;
    }
  }

  linkSelectedGroup(): void {
    if (!this.selectedGroupToAdd) return;
    if (this.linkedModifierGroupIds.includes(this.selectedGroupToAdd)) return;
    this.linkedModifierGroupIds = [...this.linkedModifierGroupIds, this.selectedGroupToAdd];
    const g = this.allModifierGroups.find((x) => x.id === this.selectedGroupToAdd);
    if (g) this.linkedModifierGroups = [...this.linkedModifierGroups, g];
    this.selectedGroupToAdd = null;
  }

  unlinkGroup(groupId: string): void {
    this.linkedModifierGroupIds = this.linkedModifierGroupIds.filter((id) => id !== groupId);
    this.linkedModifierGroups = this.linkedModifierGroups.filter((g) => g.id !== groupId);
  }

  addBundleSlot(): void {
    this.bundleSlots = [...this.bundleSlots, { name: '', isRequired: true, allowedMenuItemIds: [] }];
  }

  removeBundleSlot(index: number): void {
    this.bundleSlots = this.bundleSlots.filter((_, i) => i !== index);
  }

  submit(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    this.ref.close({
      name: raw.name!,
      description: raw.description ?? '',
      price: Number(raw.price) ?? 0,
      category: raw.category!,
      isAvailable: raw.isAvailable ?? true,
      isBundle: raw.isBundle ?? false,
      linkedModifierGroupIds: [...this.linkedModifierGroupIds],
      bundleSlots: this.bundleSlots.map((s) => ({
        id: s.id,
        name: s.name,
        isRequired: s.isRequired,
        allowedMenuItemIds: s.allowedMenuItemIds ?? [],
      })),
    } as MenuItemFormValue);
  }
}
