import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import type { ModifierGroup, ModifierOption, SelectionType } from '../../../../core/models/modifier.model';

export interface ModifierGroupFormValue {
  name: string;
  description?: string;
  selectionType: 'SINGLE' | 'MULTIPLE';
  isRequired: boolean;
  minSelections: number;
  maxSelections?: number;
  sortOrder: number;
  options: Array<{
    id?: string;
    name: string;
    description?: string;
    priceAdjustment: number;
    isDefault: boolean;
    isAvailable: boolean;
    sortOrder: number;
  }>;
}

@Component({
  selector: 'app-modifier-group-dialog',
  standalone: true,
  imports: [
    CommonModule,
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
    <h2 mat-dialog-title>{{ data?.group ? 'Edit modifier group' : 'Add modifier group' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Doneness, Side" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline" class="half">
            <mat-label>Selection type</mat-label>
            <mat-select formControlName="selectionType">
              <mat-option value="SINGLE">Single</mat-option>
              <mat-option value="MULTIPLE">Multiple</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="half">
            <mat-label>Sort order</mat-label>
            <input matInput type="number" formControlName="sortOrder" min="0" />
          </mat-form-field>
        </div>
        <mat-slide-toggle formControlName="isRequired">Required</mat-slide-toggle>
        <div class="row" *ngIf="form.get('selectionType')?.value === 'MULTIPLE'">
          <mat-form-field appearance="outline" class="half">
            <mat-label>Min selections</mat-label>
            <input matInput type="number" formControlName="minSelections" min="0" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="half">
            <mat-label>Max selections</mat-label>
            <input matInput type="number" formControlName="maxSelections" min="0" />
          </mat-form-field>
        </div>

        <h3 class="options-heading">Options</h3>
        <div formArrayName="options" class="options-list">
          @for (opt of optionsArray.controls; track opt; let i = $index) {
            <div [formGroupName]="i" class="option-row">
              <mat-form-field appearance="outline" class="opt-name">
                <mat-label>Option name</mat-label>
                <input matInput formControlName="name" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="opt-price">
                <mat-label>Price adj.</mat-label>
                <input matInput type="number" formControlName="priceAdjustment" step="0.01" />
              </mat-form-field>
              <mat-slide-toggle formControlName="isDefault">Default</mat-slide-toggle>
              <mat-slide-toggle formControlName="isAvailable">Available</mat-slide-toggle>
              <button mat-icon-button type="button" (click)="removeOption(i)" aria-label="Remove option">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
        </div>
        <button mat-stroked-button type="button" (click)="addOption()">
          <mat-icon>add</mat-icon> Add option
        </button>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width { width: 100%; }
      .half { width: 48%; }
      .row { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; margin-bottom: 0.5rem; }
      .options-heading { font-size: 1rem; margin: 1rem 0 0.5rem; }
      .options-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }
      .option-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: var(--bg-elevated);
        border-radius: var(--radius-md);
      }
      .option-row .opt-name { flex: 1; min-width: 120px; }
      .option-row .opt-price { width: 100px; }
    `,
  ],
})
export class ModifierGroupDialogComponent {
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    selectionType: ['SINGLE' as SelectionType, Validators.required],
    isRequired: [false],
    minSelections: [0, [Validators.required, Validators.min(0)]],
    maxSelections: [undefined as number | undefined],
    sortOrder: [0, [Validators.required, Validators.min(0)]],
    options: this.fb.array<ReturnType<typeof this.createOptionGroup>>([]),
  });

  get optionsArray(): FormArray {
    return this.form.get('options') as FormArray;
  }

  constructor(
    public ref: MatDialogRef<ModifierGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { group?: ModifierGroup; companyId: string } | null
  ) {
    if (data?.group) {
      const g = data.group;
      this.form.patchValue({
        name: g.name,
        description: g.description ?? '',
        selectionType: g.selectionType,
        isRequired: g.isRequired,
        minSelections: g.minSelections,
        maxSelections: g.maxSelections ?? undefined,
        sortOrder: g.sortOrder,
      });
      g.options.forEach((opt: ModifierOption) => this.optionsArray.push(this.createOptionGroup(opt)));
    }
  }

  private createOptionGroup(opt?: Partial<ModifierOption> & { id?: string }) {
    return this.fb.group({
      id: [opt?.id ?? null],
      name: [opt?.name ?? '', Validators.required],
      description: [opt?.description ?? ''],
      priceAdjustment: [opt?.priceAdjustment ?? 0],
      isDefault: [opt?.isDefault ?? false],
      isAvailable: [opt?.isAvailable !== false],
      sortOrder: [opt?.sortOrder ?? 0],
    });
  }

  addOption(): void {
    this.optionsArray.push(this.createOptionGroup());
  }

  removeOption(index: number): void {
    this.optionsArray.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const options = (raw.options ?? []).map((o: { id?: string | null; name: string | null; description?: string | null; priceAdjustment: number | null; isDefault: boolean | null; isAvailable: boolean | null; sortOrder: number | null }) => ({
      id: o.id ?? undefined,
      name: String(o.name ?? ''),
      description: o.description != null ? String(o.description) : undefined,
      priceAdjustment: Number(o.priceAdjustment) || 0,
      isDefault: o.isDefault ?? false,
      isAvailable: o.isAvailable !== false,
      sortOrder: Number(o.sortOrder) || 0,
    }));
    this.ref.close({
      name: raw.name!,
      description: raw.description || undefined,
      selectionType: raw.selectionType!,
      isRequired: raw.isRequired ?? false,
      minSelections: Number(raw.minSelections) ?? 0,
      maxSelections: raw.maxSelections != null ? Number(raw.maxSelections) : undefined,
      sortOrder: Number(raw.sortOrder) ?? 0,
      options,
    } as ModifierGroupFormValue);
  }
}
