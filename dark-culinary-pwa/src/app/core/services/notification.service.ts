import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string, durationMs = 3000): void {
    this.snackBar.open(message, '', {
      duration: durationMs,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['dc-snackbar-success'],
    });
  }

  error(message: string, durationMs = 5000): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: durationMs,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['dc-snackbar-error'],
    });
  }

  info(message: string, durationMs = 3000): void {
    this.snackBar.open(message, '', {
      duration: durationMs,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['dc-snackbar-info'],
    });
  }

  warn(message: string, durationMs = 4000): void {
    this.snackBar.open(message, '', {
      duration: durationMs,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['dc-snackbar-warn'],
    });
  }
}
