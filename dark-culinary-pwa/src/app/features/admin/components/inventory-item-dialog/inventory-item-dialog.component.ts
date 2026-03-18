import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-inventory-item-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data?.id ? 'Edit item' : 'Add item' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Current stock</mat-label>
          <input matInput type="number" formControlName="currentStock" min="0" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Min stock level</mat-label>
          <input matInput type="number" formControlName="minStockLevel" min="0" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class InventoryItemDialogComponent {
  private readonly fb = inject(FormBuilder);
  form = this.fb.group({
    name: ['', Validators.required],
    currentStock: [0, [Validators.required, Validators.min(0)]],
    minStockLevel: [0, [Validators.required, Validators.min(0)]],
  });

  constructor(
    public ref: MatDialogRef<InventoryItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id?: string; name?: string; currentStock?: number; minStockLevel?: number } | null,
  ) {
    if (data?.name != null) this.form.patchValue({
      name: data.name,
      currentStock: data.currentStock ?? 0,
      minStockLevel: data.minStockLevel ?? 0,
    });
  }

  submit(): void {
    if (this.form.valid) this.ref.close(this.form.getRawValue());
  }
}
