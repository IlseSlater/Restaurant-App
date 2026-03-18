import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-adjust-stock-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Adjust stock – {{ data.name }}</h2>
    <mat-dialog-content>
      <p>Current: {{ data.currentStock }}</p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Adjustment (+ or -)</mat-label>
          <input matInput type="number" formControlName="delta" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">Apply</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class AdjustStockDialogComponent {
  private readonly fb = inject(FormBuilder);
  form = this.fb.group({
    delta: [0, Validators.required],
  });

  constructor(
    public ref: MatDialogRef<AdjustStockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string; name: string; currentStock: number },
  ) {}

  submit(): void {
    if (this.form.valid) this.ref.close(Number(this.form.value.delta));
  }
}
