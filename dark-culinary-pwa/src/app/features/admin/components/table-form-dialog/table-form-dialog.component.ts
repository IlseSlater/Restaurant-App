import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-table-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data?.id ? 'Edit table' : 'Add table' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Table number</mat-label>
          <input matInput type="number" formControlName="number" min="1" />
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
export class TableFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  form = this.fb.group({
    number: [1, [Validators.required, Validators.min(1)]],
  });

  constructor(
    public ref: MatDialogRef<TableFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id?: string; number?: number } | null,
  ) {
    if (data?.number) this.form.patchValue({ number: data.number });
  }

  submit(): void {
    if (this.form.valid) this.ref.close(this.form.getRawValue());
  }
}
