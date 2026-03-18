import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusLabel',
  standalone: true,
})
export class StatusPipe implements PipeTransform {
  transform(status: string | null | undefined): string {
    if (!status) {
      return '';
    }
    const normalized = status.toUpperCase();
    switch (normalized) {
      case 'PENDING':
        return 'Pending';
      case 'CONFIRMED':
      case 'PREPARING':
        return 'Preparing';
      case 'READY':
        return 'Ready';
      case 'SERVED':
      case 'DELIVERED':
        return 'Served';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return normalized.charAt(0) + normalized.slice(1).toLowerCase();
    }
  }
}

