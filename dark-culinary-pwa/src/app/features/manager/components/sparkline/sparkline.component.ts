import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sparkline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      class="sparkline"
      [class.ok]="level === 'ok'"
      [class.warn]="level === 'warn'"
      [class.critical]="level === 'critical'"
      [attr.viewBox]="'0 0 ' + width + ' ' + height"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient [id]="gradientId" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-opacity="0.35" class="gradient-stop" />
          <stop offset="100%" stop-opacity="0" class="gradient-stop" />
        </linearGradient>
      </defs>
      @if (fillPath) {
        <path [attr.d]="fillPath" [attr.fill]="'url(#' + gradientId + ')'" />
      }
      <polyline
        [attr.points]="points"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        vector-effect="non-scaling-stroke"
      />
      @if (lastPoint; as p) {
        <circle [attr.cx]="p.x" [attr.cy]="p.y" r="2" fill="currentColor" vector-effect="non-scaling-stroke" />
      }
    </svg>
  `,
  styles: [
    `
      .sparkline {
        width: 100%;
        height: 28px;
        display: block;
        color: var(--text-muted);
      }
      .sparkline.ok {
        color: var(--status-success);
      }
      .sparkline.warn {
        color: var(--status-warning);
      }
      .sparkline.critical {
        color: var(--status-error);
      }
      .gradient-stop {
        stop-color: currentColor;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparklineComponent {
  @Input() values: number[] = [];
  @Input() width = 80;
  @Input() height = 28;
  @Input() level?: 'ok' | 'warn' | 'critical';

  private static _gradientCounter = 0;
  readonly gradientId = 'sparkline-grad-' + (SparklineComponent._gradientCounter++);

  get points(): string {
    const vals = this.values;
    if (!vals.length) return '';
    const max = Math.max(...vals, 1);
    const min = Math.min(...vals, 0);
    const range = max - min || 1;
    const w = this.width;
    const h = this.height;
    const step = vals.length > 1 ? w / (vals.length - 1) : 0;
    return vals
      .map((v, i) => {
        const x = vals.length > 1 ? i * step : w / 2;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
      })
      .join(' ');
  }

  get coords(): { x: number; y: number }[] {
    const vals = this.values;
    if (!vals.length) return [];
    const max = Math.max(...vals, 1);
    const min = Math.min(...vals, 0);
    const range = max - min || 1;
    const w = this.width;
    const h = this.height;
    const step = vals.length > 1 ? w / (vals.length - 1) : 0;
    return vals.map((v, i) => {
      const x = vals.length > 1 ? i * step : w / 2;
      const y = h - ((v - min) / range) * h;
      return { x, y };
    });
  }

  get fillPath(): string | null {
    const c = this.coords;
    if (c.length < 2) return null;
    const w = this.width;
    const h = this.height;
    const d = c.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
    return `${d} L ${c[c.length - 1].x},${h} L 0,${h} Z`;
  }

  get lastPoint(): { x: number; y: number } | null {
    const c = this.coords;
    return c.length ? c[c.length - 1] : null;
  }
}
