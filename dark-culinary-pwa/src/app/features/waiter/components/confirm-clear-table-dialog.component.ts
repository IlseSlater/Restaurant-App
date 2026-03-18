import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-clear-table-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon class="warn-icon">warning</mat-icon>
      Clear table?
    </h2>
    <mat-dialog-content>
      <p>Table {{ data.tableNumber }} will be cleared.</p>
      <p class="destructive">All sessions and orders will be ended.</p>
      <p>Continue?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">Clear table</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .warn-icon {
        color: var(--status-warning);
      }
      .destructive {
        color: var(--status-error);
        font-weight: 500;
      }
    `,
  ],
})
export class ConfirmClearTableDialogComponent {
  constructor(
    public ref: MatDialogRef<ConfirmClearTableDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tableNumber: number },
  ) {}
}
