import { Pipe, PipeTransform } from '@angular/core';
import { APP_CURRENCY_CODE } from '../constants/app-currency';

/**
 * Formats a number as currency using the app's single currency (symbol, e.g. R for ZAR).
 * Use this pipe everywhere instead of hardcoding currency codes.
 */
@Pipe({
  name: 'appCurrency',
  standalone: true,
})
export class AppCurrencyPipe implements PipeTransform {
  private getSymbol(code: string): string {
    switch (code) {
      case 'ZAR':
        return 'R';
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      default:
        // Fallback: show code itself
        return code;
    }
  }

  transform(value: number | string | null | undefined, digitsInfo?: string): string | null {
    if (value == null) return null;
    const n = typeof value === 'string' ? parseFloat(value) : value;
    if (!Number.isFinite(n)) return null;
    const symbol = this.getSymbol(APP_CURRENCY_CODE);
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    const formatted = Number(n).toLocaleString('en-ZA', options);
    const sign = n < 0 ? '-' : '';
    return `${sign}${symbol} ${formatted}`;
  }
}
