import { Injectable, signal, computed } from '@angular/core';

export interface CompanyThemeConfig {
  accentPrimary?: string;
  accentSecondary?: string;
  accentTertiary?: string;
  logoUrl?: string;
}

const DEFAULT_TOKENS: Record<string, string> = {
  '--accent-primary': '#88ffb6',
  '--accent-secondary': '#ffb86c',
  '--accent-tertiary': '#ff6ec7',
  '--accent-primary-soft': 'rgba(136, 255, 182, 0.35)',
  '--accent-border': 'rgba(136, 255, 182, 0.25)',
  '--accent-glow': 'rgba(136, 255, 182, 0.15)',
};

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly accentPrimary = signal<string>(DEFAULT_TOKENS['--accent-primary']!);
  readonly accentSecondary = signal<string>(DEFAULT_TOKENS['--accent-secondary']!);
  readonly accentTertiary = signal<string>(DEFAULT_TOKENS['--accent-tertiary']!);

  readonly themeSnapshot = computed(() => ({
    accentPrimary: this.accentPrimary(),
    accentSecondary: this.accentSecondary(),
    accentTertiary: this.accentTertiary(),
  }));

  applyCompanyTheme(config: CompanyThemeConfig): void {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;

    if (config.accentPrimary) {
      this.accentPrimary.set(config.accentPrimary);
      root.style.setProperty('--accent-primary', config.accentPrimary);
      root.style.setProperty('--accent-primary-soft', this.toSoft(config.accentPrimary));
      root.style.setProperty('--accent-border', this.toBorder(config.accentPrimary));
      root.style.setProperty('--accent-glow', this.toGlow(config.accentPrimary));
    }
    if (config.accentSecondary) {
      this.accentSecondary.set(config.accentSecondary);
      root.style.setProperty('--accent-secondary', config.accentSecondary);
    }
    if (config.accentTertiary) {
      this.accentTertiary.set(config.accentTertiary);
      root.style.setProperty('--accent-tertiary', config.accentTertiary);
    }
  }

  resetToDefaults(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    for (const [key, value] of Object.entries(DEFAULT_TOKENS)) {
      root.style.setProperty(key, value);
    }

    this.accentPrimary.set(DEFAULT_TOKENS['--accent-primary']!);
    this.accentSecondary.set(DEFAULT_TOKENS['--accent-secondary']!);
    this.accentTertiary.set(DEFAULT_TOKENS['--accent-tertiary']!);
  }

  applyHighContrast(enabled: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.dataset['highContrast'] = enabled ? 'true' : 'false';
  }

  private toSoft(hex: string): string {
    const { r, g, b } = this.parseHex(hex);
    return r !== undefined ? `rgba(${r}, ${g}, ${b}, 0.35)` : hex;
  }

  private toBorder(hex: string): string {
    const { r, g, b } = this.parseHex(hex);
    return r !== undefined ? `rgba(${r}, ${g}, ${b}, 0.25)` : hex;
  }

  private toGlow(hex: string): string {
    const { r, g, b } = this.parseHex(hex);
    return r !== undefined ? `rgba(${r}, ${g}, ${b}, 0.15)` : hex;
  }

  private parseHex(hex: string): { r: number; g: number; b: number } | { r: undefined; g: undefined; b: undefined } {
    const normalized = hex.replace('#', '');
    if (normalized.length !== 6) {
      return { r: undefined!, g: undefined!, b: undefined! };
    }
    return {
      r: parseInt(normalized.substring(0, 2), 16),
      g: parseInt(normalized.substring(2, 4), 16),
      b: parseInt(normalized.substring(4, 6), 16),
    };
  }
}
