import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

const ROLES = ['WAITER', 'CHEF', 'BARTENDER', 'MANAGER', 'ADMIN'];

@Component({
  selector: 'app-staff-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data?.id ? 'Edit user' : 'Create user' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
        </mat-form-field>
        @if (!data?.id) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" />
          </mat-form-field>
        }
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            @for (r of roles; track r) {
              <mat-option [value]="r">{{ r }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (data?.id) {
          <mat-slide-toggle formControlName="active">Active</mat-slide-toggle>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class StaffFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role: ['WAITER', Validators.required],
    active: [true],
  });

  roles = ROLES;

  constructor(
    public ref: MatDialogRef<StaffFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id?: string; name?: string; email?: string; role?: string; active?: boolean } | null,
  ) {
    if (data?.id) {
      this.form.patchValue({
        name: data.name ?? '',
        email: data.email ?? '',
        role: data.role ?? 'WAITER',
        active: data.active !== false,
      });
      this.form.get('password')?.clearValidators();
    } else {
      this.form.get('password')?.setValidators(Validators.required);
    }
  }

  submit(): void {
    if (this.form.valid) this.ref.close(this.form.getRawValue());
  }
}
